const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
require('dotenv').config();
const nodemailer = require('nodemailer');
const Redis = require('ioredis');

// 1. Initialize Nodemailer Transporter
let transporter;
try {
  if (process.env.MAIL_USERNAME && process.env.MAIL_PASSWORD) {
    transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.MAIL_PORT, 10) || 587,
      secure: process.env.MAIL_PORT == '465',
      auth: {
        user: process.env.MAIL_USERNAME,
        pass: process.env.MAIL_PASSWORD,
      },
    });
  } else {
    transporter = {
      sendMail: async (options) => {
        console.log(`[EmailQueue Sim] To: ${options.to} | Subject: ${options.subject}`);
        return { messageId: 'simulated-' + Date.now() };
      },
    };
  }
} catch (err) {
  console.warn('⚠️ [EmailQueue] Failed to initialize nodemailer transport:', err.message);
  transporter = {
    sendMail: async (options) => {
      console.log(`[EmailQueue Sim] To: ${options.to} | Subject: ${options.subject}`);
      return { messageId: 'simulated-' + Date.now() };
    },
  };
}

// 2. Initialize Redis Client with Auto-Fallback
const REDIS_KEY = 'jabweemeet:email:queue';
let redisClient = null;
let isRedisAvailable = false;
const inMemoryQueue = [];

let cleanRedisUrl = (process.env.REDIS_URL || process.env.REDISCLOUD_URL || '').trim();
if (cleanRedisUrl) {
  cleanRedisUrl = cleanRedisUrl.replace(/^redis-cli\s+--tls\s+-u\s+/i, '');
  cleanRedisUrl = cleanRedisUrl.replace(/^redis-cli\s+-u\s+/i, '');
  cleanRedisUrl = cleanRedisUrl.replace(/^['"]|['"]$/g, '');
  if (cleanRedisUrl.includes('upstash.io') && cleanRedisUrl.startsWith('redis://')) {
    cleanRedisUrl = cleanRedisUrl.replace('redis://', 'rediss://');
  }
}

const redisHost = process.env.REDIS_HOST;
const redisPort = parseInt(process.env.REDIS_PORT, 10) || 6379;
const redisPassword = process.env.REDIS_PASSWORD || undefined;

try {
  const redisOptions = {
    maxRetriesPerRequest: 1,
    connectTimeout: 7000,
    retryStrategy: (times) => {
      if (times > 5) return 10000;
      return Math.min(times * 500, 3000);
    },
    lazyConnect: true,
  };

  if (redisPassword) redisOptions.password = redisPassword;

  if (cleanRedisUrl) {
    redisClient = new Redis(cleanRedisUrl, redisOptions);
  } else if (redisHost) {
    redisClient = new Redis({
      host: redisHost,
      port: redisPort,
      ...redisOptions,
    });
  }

  if (redisClient) {
    redisClient.on('connect', () => {
      isRedisAvailable = true;
      console.log('✅ [EmailQueue] Redis connected successfully. Persistent email queue active.');
      flushMemoryQueueToRedis();
    });

    redisClient.on('ready', () => {
      isRedisAvailable = true;
    });

    redisClient.on('error', (err) => {
      if (isRedisAvailable) {
        console.warn('⚠️ [EmailQueue] Redis disconnected. Falling back to in-memory email queue:', err.message);
      }
      isRedisAvailable = false;
    });

    redisClient.connect().then(() => {
      isRedisAvailable = true;
      flushMemoryQueueToRedis();
    }).catch((err) => {
      isRedisAvailable = false;
      console.log('ℹ️ [EmailQueue] Redis connection unsuccessful (' + err.message + '). Operating in in-memory queue mode.');
    });
  } else {
    console.log('ℹ️ [EmailQueue] No Redis configuration detected. Running in resilient in-memory queue mode.');
  }
} catch (e) {
  isRedisAvailable = false;
  console.log('ℹ️ [EmailQueue] Running in resilient in-memory queue mode.');
}

/**
 * Flush any queued in-memory items to Redis when Redis reconnects
 */
async function flushMemoryQueueToRedis() {
  if (!isRedisAvailable || !redisClient || inMemoryQueue.length === 0) return;
  try {
    const items = inMemoryQueue.splice(0, inMemoryQueue.length);
    for (const item of items) {
      await redisClient.lpush(REDIS_KEY, JSON.stringify(item));
    }
    console.log(`[EmailQueue] Flushed ${items.length} in-memory emails into Redis queue.`);
  } catch (err) {
    console.warn('[EmailQueue] Error flushing in-memory queue to Redis:', err.message);
  }
}

/**
 * Enqueue an email job into Redis or in-memory fallback
 */
async function enqueueEmail(job) {
  const emailJob = {
    id: 'job_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9),
    mailOptions: job.mailOptions,
    attempts: 0,
    maxRetries: job.maxRetries || 3,
    createdAt: Date.now(),
  };

  if (isRedisAvailable && redisClient) {
    try {
      await redisClient.lpush(REDIS_KEY, JSON.stringify(emailJob));
      return { success: true, queued: true, queueType: 'redis', jobId: emailJob.id };
    } catch (err) {
      console.warn('⚠️ [EmailQueue] Failed writing to Redis, saving to in-memory queue:', err.message);
    }
  }

  inMemoryQueue.push(emailJob);
  return { success: true, queued: true, queueType: 'memory', jobId: emailJob.id };
}

/**
 * Worker: Process email queue at a controlled throttled rate
 * Default: 3 emails/second to remain strictly within Gmail & SMTP provider limits
 */
let isWorkerRunning = false;
const RATE_INTERVAL_MS = parseInt(process.env.EMAIL_QUEUE_INTERVAL_MS, 10) || 350; // ~3 emails/sec

async function processNextEmail() {
  if (isWorkerRunning) return;
  isWorkerRunning = true;

  try {
    let rawJob = null;

    if (isRedisAvailable && redisClient) {
      try {
        rawJob = await redisClient.rpop(REDIS_KEY);
      } catch (err) {
        isRedisAvailable = false;
      }
    }

    if (!rawJob && inMemoryQueue.length > 0) {
      rawJob = inMemoryQueue.shift();
    }

    if (!rawJob) {
      isWorkerRunning = false;
      return;
    }

    const job = typeof rawJob === 'string' ? JSON.parse(rawJob) : rawJob;
    job.attempts = (job.attempts || 0) + 1;

    try {
      const result = await transporter.sendMail(job.mailOptions);
      console.log(`📬 [EmailQueue Dispatched] To: ${job.mailOptions.to} | Subject: "${job.mailOptions.subject}" | ID: ${result.messageId}`);
    } catch (sendErr) {
      console.error(`❌ [EmailQueue Send Failed] (Attempt ${job.attempts}/${job.maxRetries}) to ${job.mailOptions.to}:`, sendErr.message);

      if (job.attempts < job.maxRetries) {
        // Re-queue with exponential backoff delay
        setTimeout(async () => {
          if (isRedisAvailable && redisClient) {
            try {
              await redisClient.lpush(REDIS_KEY, JSON.stringify(job));
              return;
            } catch (e) {
              // fallback
            }
          }
          inMemoryQueue.push(job);
        }, job.attempts * 3000);
      } else {
        console.error(`🛑 [EmailQueue Dropped] Maximum retries reached for ${job.mailOptions.to}.`);
      }
    }
  } catch (err) {
    console.error('[EmailQueue Worker Error]:', err.message);
  } finally {
    isWorkerRunning = false;
  }
}

// Start continuous throttled queue processor
setInterval(processNextEmail, RATE_INTERVAL_MS);

/**
 * Public helper to send or enqueue email
 */
async function sendQueuedMail(mailOptions, immediate = false) {
  if (!mailOptions || !mailOptions.to) {
    console.warn('⚠️ [EmailQueue] Attempted to send email without recipient.');
    return { success: false, message: 'Recipient is required' };
  }

  if (immediate) {
    try {
      const result = await transporter.sendMail(mailOptions);
      console.log(`📬 [Immediate Email Sent] To: ${mailOptions.to} | ID: ${result.messageId}`);
      return { success: true, messageId: result.messageId };
    } catch (err) {
      console.warn(`⚠️ [Immediate Email Failed] Falling back to queue for ${mailOptions.to}:`, err.message);
    }
  }

  return enqueueEmail({ mailOptions });
}

module.exports = {
  transporter,
  enqueueEmail,
  sendQueuedMail,
};
