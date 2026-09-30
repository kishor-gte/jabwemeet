const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
require('dotenv').config();
require('./ensure-deps');
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const authRouter = require('./routes/auth');
const eventsRouter = require('./routes/events');
const adminRouter = require('./routes/admin');
const matchmakerRouter = require('./routes/matchmaker');
const servicesRouter = require('./routes/services');
const { initAdminDb } = require('./db/adminInit');
const { startEventReminderCron } = require('./services/eventReminderService');
const prisma = require('./db');
const { authenticateToken } = require('./middleware/auth');

const helmet = require('helmet');

const app = express();
const PORT = process.env.PORT || 5001;

// Initialize admin schema safely in background
initAdminDb().catch(err => console.error('Failed to initialize admin database:', err));

// Initialize automated 24-hour event reminder scheduler
startEventReminderCron();

// Trust proxy for rate limiting behind reverse proxies (like Next.js rewrites)
app.set('trust proxy', 1);

// HTTP Security Headers
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
    contentSecurityPolicy: false,
    xFrameOptions: { action: "sameorigin" },
  })
);

// CORS configuration supporting credentials (cookies)
const allowedOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:5001',
  'http://127.0.0.1:5001',
];

if (process.env.FRONTEND_URL) {
  process.env.FRONTEND_URL.split(',').forEach(url => {
    const trimmed = url.trim();
    if (trimmed && !allowedOrigins.includes(trimmed)) {
      allowedOrigins.push(trimmed);
    }
  });
}

if (process.env.ALLOWED_ORIGINS) {
  process.env.ALLOWED_ORIGINS.split(',').forEach(url => {
    const trimmed = url.trim();
    if (trimmed && !allowedOrigins.includes(trimmed)) {
      allowedOrigins.push(trimmed);
    }
  });
}

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error('Blocked by CORS policy: Origin not allowed'));
    },
    credentials: true,
  })
);

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ limit: '2mb', extended: true }));
app.use(cookieParser());

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

const publicDir = path.join(__dirname, '..', 'frontend', 'public');
app.use(express.static(publicDir));

// Serve uploaded documents safely with restrictive security headers and KYC authorization
const uploadsDir = path.join(__dirname, 'uploads');
app.use('/uploads', async (req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Content-Security-Policy', "default-src 'none'");

  const filename = path.basename(req.path);
  const isKycDoc = /^(govIdProof|addressProof|eduCertificate|workExperience)-/i.test(filename);

  if (!isKycDoc) {
    return next();
  }

  // Enforce authentication and ownership on all KYC and identity documents
  return authenticateToken(req, res, async () => {
    try {
      // Platform admins have full clearance for verification audits
      if (req.user.role === 'ADMIN') {
        return next();
      }

      // Check if document belongs to the requesting user
      const owner = await prisma.user.findFirst({
        where: {
          id: req.user.userId,
          OR: [
            { govIdProof: filename },
            { addressProof: filename },
            { eduCertificate: filename },
            { workExperience: filename },
          ],
        },
        select: { id: true },
      });

      if (!owner) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: You do not have permission to view this confidential document.',
        });
      }

      return next();
    } catch (err) {
      console.error('Error validating KYC document access:', err);
      return res.status(500).json({ success: false, message: 'Authorization check failed' });
    }
  });
}, express.static(uploadsDir, {
  setHeaders: (res, filePath) => {
    if (!filePath.match(/\.(jpg|jpeg|png|webp|pdf)$/i)) {
      res.setHeader('Content-Disposition', 'attachment');
    }
  }
}));

// API Routes

const subscriptionRouter = require('./routes/subscription');
const placesRouter = require('./routes/places');

app.use('/api/auth', authRouter);
app.use('/api/events', eventsRouter);
app.use('/api/admin', adminRouter);
const cafeRouter = require('./routes/cafe');
app.use('/api/cafe', cafeRouter);
app.use('/api/matchmaker', matchmakerRouter);
app.use('/api/buddy', require('./routes/buddy'));
app.use('/api/subscription', subscriptionRouter);
app.use('/api/places', placesRouter);
app.use('/api/services', servicesRouter);
app.use('/api', servicesRouter);

app.get(
  [
    '/admin',
    '/dashboard',
    '/matchmaker/dashboard',
    '/breakup-buddy/dashboard',
    '/host/dashboard',
    '/login',
    '/register',
    '/forgot-password',
  ],
  (req, res) => {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    return res.redirect(`${frontendUrl}${req.originalUrl}`);
  }
);

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    brand: 'JabWeMeet',
    version: '1.0.0',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

app.get('/api', (req, res) => {
  res.json({
    name: 'JabWeMeet API',
    status: 'running',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      events: '/api/events',
    },
  });
});

app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ success: false, error: 'API endpoint not found' });
  }
  next();
});

app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({
    success: false,
    message: "We couldn't connect to JabWeMeet right now. Please try again.",
  });
});

const http = require('http');
const { Server } = require('socket.io');

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
  }
});
app.set('io', io);

const jwt = require('jsonwebtoken');

// Enforce JWT authentication on all WebSocket connections
io.use((socket, next) => {
  let token = null;

  // 1. Check HTTP-only cookie in handshake headers
  const cookieHeader = socket.handshake.headers.cookie;
  if (cookieHeader) {
    const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
      const parts = cookie.trim().split('=');
      if (parts.length >= 2) {
        acc[parts[0]] = decodeURIComponent(parts.slice(1).join('='));
      }
      return acc;
    }, {});
    if (cookies.token) {
      token = cookies.token;
    }
  }

  // 2. Check auth handshake object or authorization header
  if (!token && socket.handshake.auth && socket.handshake.auth.token) {
    token = socket.handshake.auth.token;
  } else if (!token && socket.handshake.headers.authorization && socket.handshake.headers.authorization.startsWith('Bearer ')) {
    token = socket.handshake.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(new Error('Authentication required for WebSocket connection'));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = decoded;
    return next();
  } catch (err) {
    return next(new Error('Invalid or expired WebSocket authentication token'));
  }
});

// Track call intervals and metadata to update DB
const activeCalls = new Map(); // requestId -> { interval, callLogId, startTime }

io.on('connection', (socket) => {
  console.log(`Socket authenticated & connected: ${socket.id} (user: ${socket.user?.userId || 'unknown'})`);

  socket.on('join-buddy-room', (buddyId) => {
    // Only allow joining own buddy room or if admin
    const targetId = socket.user.role === 'ADMIN' ? buddyId : socket.user.userId;
    socket.join(`buddy-${targetId}`);
    socket.join(`user-${targetId}`);
  });

  socket.on('join-user-room', (userId) => {
    // Only allow joining own user room or if admin
    const targetId = socket.user.role === 'ADMIN' ? userId : socket.user.userId;
    socket.join(`user-${targetId}`);
  });

  socket.on('join-request-room', async (requestId) => {
    try {
      const request = await prisma.buddyRequest.findUnique({
        where: { id: requestId },
        select: { userId: true, buddyId: true }
      });
      if (!request) return;
      const isParticipant = request.userId === socket.user.userId || request.buddyId === socket.user.userId || socket.user.role === 'ADMIN';
      if (isParticipant) {
        socket.join(`request-${requestId}`);
      } else {
        console.warn(`[Socket Security] Unauthorized attempt to join request-${requestId} by user ${socket.user.userId}`);
      }
    } catch (e) {
      console.error('Error joining request room:', e);
    }
  });

  socket.on('initiate-call', async ({ requestId, targetUserId, callerName, callerRole }) => {
    try {
      const request = await prisma.buddyRequest.findUnique({ where: { id: requestId } });
      if (!request || request.voiceCallSeconds >= request.voiceCallLimitSeconds) {
        socket.emit('call-rejected', { reason: 'limit-reached' });
        return;
      }

      // Verify that caller is an authorized participant
      const isUserCaller = request.userId === socket.user.userId;
      const isBuddyCaller = request.buddyId === socket.user.userId;
      if (!isUserCaller && !isBuddyCaller && socket.user.role !== 'ADMIN') {
        socket.emit('call-rejected', { reason: 'unauthorized' });
        return;
      }

      const actualCallerId = socket.user.userId;
      const actualReceiverId = isUserCaller ? request.buddyId : request.userId;

      // Create CallLog in DB, defaulting to MISSED until accepted
      const callLog = await prisma.callLog.create({
        data: {
          requestId,
          callerId: actualCallerId,
          receiverId: actualReceiverId,
          callerRole: isUserCaller ? 'USER' : 'BUDDY',
          status: 'MISSED',
          startedAt: new Date(),
        }
      });

      const remainingSeconds = Math.max(0, (request.voiceCallLimitSeconds || 300) - (request.voiceCallSeconds || 0));
      const voiceCallLimitSeconds = request.voiceCallLimitSeconds || 300;

      socket.emit('call-initiated', { callLogId: callLog.id, remainingSeconds, voiceCallLimitSeconds });

      // Notify the target receiver room
      const payload = {
        requestId,
        callLogId: callLog.id,
        callerName,
        callerRole: isUserCaller ? 'USER' : 'BUDDY',
        callerId: actualCallerId,
        remainingSeconds,
        voiceCallLimitSeconds,
      };
      if (isUserCaller) {
        io.to(`buddy-${actualReceiverId}`).emit('incoming-call', payload);
      } else {
        io.to(`user-${actualReceiverId}`).emit('incoming-call', payload);
      }
    } catch (e) {
      console.error('Error initiating call:', e);
      socket.emit('call-rejected', { reason: 'error' });
    }
  });

  socket.on('accept-call', async ({ requestId, callLogId }) => {
    let remainingSeconds = 300;
    let voiceCallLimitSeconds = 300;
    try {
      const req = await prisma.buddyRequest.findUnique({ where: { id: requestId } });
      if (req) {
        voiceCallLimitSeconds = req.voiceCallLimitSeconds || 300;
        remainingSeconds = Math.max(0, voiceCallLimitSeconds - (req.voiceCallSeconds || 0));
      }
    } catch (e) {}

    io.to(`request-${requestId}`).emit('call-accepted', { remainingSeconds, voiceCallLimitSeconds });
    
    // Update CallLog status to COMPLETED and mark connect timestamp
    if (callLogId) {
      try {
        await prisma.callLog.update({
          where: { id: callLogId },
          data: { status: 'COMPLETED', startedAt: new Date() }
        });
      } catch (e) {
        console.error('Failed to update CallLog on accept:', e);
      }
    }

    // Start tracking exact cumulative time in DB for this call
    if (!activeCalls.has(requestId)) {
      try {
        const req = await prisma.buddyRequest.findUnique({ where: { id: requestId } });
        const initialVoiceSec = req ? (req.voiceCallSeconds || 0) : 0;
        const limitSec = req ? (req.voiceCallLimitSeconds || 300) : 300;
        const startTime = Date.now();

        const interval = setInterval(async () => {
          try {
            const elapsed = Math.floor((Date.now() - startTime) / 1000);
            const currentTotal = initialVoiceSec + elapsed;

            if (currentTotal >= limitSec) {
              // Strict 5-minute (or limit) cap reached! Force end call server-side
              await prisma.buddyRequest.update({
                where: { id: requestId },
                data: { voiceCallSeconds: limitSec }
              }).catch(() => {});

              io.to(`request-${requestId}`).emit('call-ended', { reason: 'time-expired' });
              
              const callData = activeCalls.get(requestId);
              if (callData) {
                clearInterval(callData.interval);
                const durationSec = Math.max(1, elapsed);
                if (callData.callLogId) {
                  await prisma.callLog.update({
                    where: { id: callData.callLogId },
                    data: { durationSec, endedAt: new Date(), status: 'COMPLETED' }
                  }).catch(() => {});
                }
                activeCalls.delete(requestId);
              }
            } else {
              // Update cumulative voice seconds in DB periodically
              await prisma.buddyRequest.update({
                where: { id: requestId },
                data: { voiceCallSeconds: currentTotal }
              }).catch(() => {});

              // Broadcast live synchronized remaining time to all clients in request room
              const remaining = Math.max(0, limitSec - currentTotal);
              io.to(`request-${requestId}`).emit('timer-tick', { remainingSeconds: remaining, voiceCallLimitSeconds: limitSec });
            }
          } catch (e) {
            console.error('Timer error:', e);
          }
        }, 1000); // Check precision every second

        activeCalls.set(requestId, { interval, callLogId, startTime, initialVoiceSec, limitSec });
      } catch (e) {
        console.error('Accept call DB fetch error:', e);
      }
    }
  });

  socket.on('reject-call', async ({ requestId, callLogId, reason }) => {
    io.to(`request-${requestId}`).emit('call-rejected', { reason });
    try {
      const request = await prisma.buddyRequest.findUnique({ where: { id: requestId } });
      if (request) {
        io.to(`user-${request.userId}`).emit('call-rejected', { reason });
        io.to(`buddy-${request.buddyId}`).emit('call-rejected', { reason });
      }
    } catch (e) {}

    if (callLogId) {
      try {
        const finalStatus = reason === 'busy' ? 'BUSY' : 'REJECTED';
        await prisma.callLog.update({
          where: { id: callLogId },
          data: { status: finalStatus, endedAt: new Date() }
        });
      } catch (e) {
        console.error('Failed to update CallLog on reject:', e);
      }
    }
  });

  socket.on('end-call', async ({ requestId, callLogId }) => {
    io.to(`request-${requestId}`).emit('call-ended');
    
    const callData = activeCalls.get(requestId);
    const targetCallLogId = callLogId || (callData ? callData.callLogId : null);

    if (callData) {
      clearInterval(callData.interval);
      const elapsed = Math.max(1, Math.floor((Date.now() - callData.startTime) / 1000));
      const finalVoiceSec = Math.min(callData.limitSec, callData.initialVoiceSec + elapsed);

      // Save exact cumulative time to DB
      await prisma.buddyRequest.update({
        where: { id: requestId },
        data: { voiceCallSeconds: finalVoiceSec }
      }).catch(() => {});

      if (targetCallLogId) {
        try {
          await prisma.callLog.update({
            where: { id: targetCallLogId },
            data: { durationSec: elapsed, endedAt: new Date(), status: 'COMPLETED' }
          });
        } catch (e) {
          console.error('Failed to update CallLog on end:', e);
        }
      }
      activeCalls.delete(requestId);
    } else if (targetCallLogId) {
      // Unanswered / cancelled before connect
      try {
        await prisma.callLog.update({
          where: { id: targetCallLogId },
          data: { endedAt: new Date() }
        });
      } catch (e) {}
    }
  });

  // WebRTC Signaling (Restricted to verified room participants)
  socket.on('webrtc-offer', ({ requestId, offer }) => {
    if (!requestId || !socket.rooms.has(`request-${requestId}`)) return;
    socket.to(`request-${requestId}`).emit('webrtc-offer', offer);
  });

  socket.on('webrtc-answer', ({ requestId, answer }) => {
    if (!requestId || !socket.rooms.has(`request-${requestId}`)) return;
    socket.to(`request-${requestId}`).emit('webrtc-answer', answer);
  });

  socket.on('ice-candidate', ({ requestId, candidate }) => {
    if (!requestId || !socket.rooms.has(`request-${requestId}`)) return;
    socket.to(`request-${requestId}`).emit('ice-candidate', candidate);
  });

  socket.on('disconnect', () => {
    console.log('Socket disconnected:', socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`JabWeMeet Backend Server (with Socket.io) running at http://localhost:${PORT}`);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

process.on('SIGINT', () => {
  console.log('Shutting down server gracefully...');
  server.close(() => {
    console.log('Server closed.');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('Terminating server...');
  server.close(() => {
    console.log('Server terminated.');
    process.exit(0);
  });
});