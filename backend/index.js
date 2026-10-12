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
const activeCalls = new Map(); // requestId -> { interval, callLogId, startTime, elapsedSec, initialChatSec, initialVoiceSec, limitSec, hasActivePackage }
global.activeCalls = activeCalls;
global.chatPresenceTracker = global.chatPresenceTracker || new Map();

function computeRequestQuota(req) {
  const hasActivePackage = !!(req.packageExpiresAt && new Date(req.packageExpiresAt).getTime() > Date.now());
  const totalLimitSeconds = hasActivePackage ? Math.max(1800, req.chatLimitSeconds || 1800) : 1800;
  const chatUsed = req.timeUsedSeconds || 0;
  const callUsed = req.voiceCallSeconds || 0;
  const totalUsedSeconds = Math.min(totalLimitSeconds, chatUsed + callUsed);
  const remainingSeconds = Math.max(0, totalLimitSeconds - totalUsedSeconds);
  return {
    hasActivePackage,
    totalLimitSeconds,
    chatUsed,
    callUsed,
    totalUsedSeconds,
    remainingSeconds,
  };
}

async function stopAndSaveActiveCall(io, requestId, callLogId, reason) {
  const callData = activeCalls.get(requestId);
  const targetCallLogId = callLogId || (callData ? callData.callLogId : null);

  if (callData) {
    clearInterval(callData.interval);
    activeCalls.delete(requestId);

    const elapsed = Math.max(0, callData.elapsedSec || Math.floor((Date.now() - callData.startTime) / 1000));
    const maxAdditionalVoice = Math.max(0, callData.limitSec - callData.initialChatSec - callData.initialVoiceSec);
    const addedVoice = Math.min(maxAdditionalVoice, elapsed);
    const finalVoiceSec = callData.initialVoiceSec + addedVoice;
    const totalUsedSeconds = Math.min(callData.limitSec, callData.initialChatSec + finalVoiceSec);
    const remainingSeconds = Math.max(0, callData.limitSec - totalUsedSeconds);

    await prisma.buddyRequest.update({
      where: { id: requestId },
      data: { voiceCallSeconds: finalVoiceSec }
    }).catch(() => {});

    if (targetCallLogId) {
      await prisma.callLog.update({
        where: { id: targetCallLogId },
        data: { durationSec: Math.max(1, addedVoice), endedAt: new Date(), status: 'COMPLETED' }
      }).catch(() => {});
    }

    io.to(`request-${requestId}`).emit('call-ended', {
      reason: reason || 'ended',
      remainingSeconds,
      totalUsedSeconds,
      totalLimitSeconds: callData.limitSec,
      hasActivePackage: callData.hasActivePackage,
    });
  } else {
    if (targetCallLogId) {
      await prisma.callLog.update({
        where: { id: targetCallLogId },
        data: { endedAt: new Date() }
      }).catch(() => {});
    }
    io.to(`request-${requestId}`).emit('call-ended', { reason: reason || 'ended' });
    try {
      const req = await prisma.buddyRequest.findUnique({ where: { id: requestId } });
      if (req) {
        io.to(`user-${req.userId}`).emit('call-ended', { reason: reason || 'ended' });
        io.to(`buddy-${req.buddyId}`).emit('call-ended', { reason: reason || 'ended' });
      }
    } catch (e) {}
  }
}

io.on('connection', (socket) => {
  console.log(`Socket authenticated & connected: ${socket.id} (user: ${socket.user?.userId || 'unknown'})`);

  socket.on('join-buddy-room', (buddyId) => {
    const targetId = socket.user.role === 'ADMIN' ? buddyId : socket.user.userId;
    socket.join(`buddy-${targetId}`);
    socket.join(`user-${targetId}`);
  });

  socket.on('join-user-room', (userId) => {
    const targetId = socket.user.role === 'ADMIN' ? userId : socket.user.userId;
    socket.join(`user-${targetId}`);
  });

  socket.on('join-request-room', async (requestId) => {
    if (!requestId) return;
    // Join immediately so signaling events are never lost to async race conditions
    socket.join(`request-${requestId}`);
    socket.activeCallRequestId = requestId;
    try {
      const request = await prisma.buddyRequest.findUnique({
        where: { id: requestId },
        select: { userId: true, buddyId: true }
      });
      if (!request) {
        socket.leave(`request-${requestId}`);
        return;
      }
      const isParticipant = request.userId === socket.user.userId || request.buddyId === socket.user.userId || socket.user.role === 'ADMIN';
      if (!isParticipant) {
        socket.leave(`request-${requestId}`);
        console.warn(`[Socket Security] Unauthorized attempt to join request-${requestId} by user ${socket.user.userId}`);
      }
    } catch (e) {
      console.error('Error joining request room:', e);
    }
  });

  socket.on('initiate-call', async ({ requestId, targetUserId, callerName, callerRole }) => {
    try {
      if (!requestId) return;
      socket.join(`request-${requestId}`);
      socket.activeCallRequestId = requestId;

      const request = await prisma.buddyRequest.findUnique({ where: { id: requestId } });
      if (!request) {
        socket.emit('call-rejected', { reason: 'error' });
        return;
      }

      const quota = computeRequestQuota(request);
      if (quota.remainingSeconds <= 0) {
        socket.emit('call-rejected', {
          reason: 'limit-reached',
          remainingSeconds: 0,
          totalUsedSeconds: quota.totalUsedSeconds,
          totalLimitSeconds: quota.totalLimitSeconds,
          hasActivePackage: quota.hasActivePackage,
        });
        return;
      }

      // Verify that caller is an authorized participant
      const isUserCaller = request.userId === socket.user.userId;
      const isBuddyCaller = request.buddyId === socket.user.userId;
      if (!isUserCaller && !isBuddyCaller && socket.user.role !== 'ADMIN') {
        socket.emit('call-rejected', { reason: 'unauthorized' });
        return;
      }

      // Pause any chat presence timer while call is being initiated/active
      global.chatPresenceTracker.delete(requestId);

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

      const callMeta = {
        callLogId: callLog.id,
        remainingSeconds: quota.remainingSeconds,
        totalUsedSeconds: quota.totalUsedSeconds,
        totalLimitSeconds: quota.totalLimitSeconds,
        voiceCallLimitSeconds: quota.totalLimitSeconds,
        hasActivePackage: quota.hasActivePackage,
      };

      socket.emit('call-initiated', callMeta);

      // Notify the target receiver room
      const payload = {
        requestId,
        ...callMeta,
        callerName,
        callerRole: isUserCaller ? 'USER' : 'BUDDY',
        callerId: actualCallerId,
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
    if (!requestId) return;
    socket.join(`request-${requestId}`);
    socket.activeCallRequestId = requestId;
    global.chatPresenceTracker.delete(requestId);

    let quota = {
      hasActivePackage: false,
      totalLimitSeconds: 1800,
      chatUsed: 0,
      callUsed: 0,
      totalUsedSeconds: 0,
      remainingSeconds: 1800,
    };

    try {
      const req = await prisma.buddyRequest.findUnique({ where: { id: requestId } });
      if (req) {
        quota = computeRequestQuota(req);
      }
    } catch (e) {}

    if (quota.remainingSeconds <= 0) {
      io.to(`request-${requestId}`).emit('call-ended', {
        reason: 'time-expired',
        remainingSeconds: 0,
        totalUsedSeconds: quota.totalLimitSeconds,
        totalLimitSeconds: quota.totalLimitSeconds,
        hasActivePackage: quota.hasActivePackage,
      });
      return;
    }

    io.to(`request-${requestId}`).emit('call-accepted', {
      remainingSeconds: quota.remainingSeconds,
      totalUsedSeconds: quota.totalUsedSeconds,
      totalLimitSeconds: quota.totalLimitSeconds,
      voiceCallLimitSeconds: quota.totalLimitSeconds,
      hasActivePackage: quota.hasActivePackage,
    });

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

    // Clear any stale interval if one existed
    if (activeCalls.has(requestId)) {
      clearInterval(activeCalls.get(requestId).interval);
      activeCalls.delete(requestId);
    }

    // Start tracking exact cumulative time in DB ONLY when both User and BB are in the call room
    const callState = {
      interval: null,
      callLogId,
      startTime: Date.now(),
      elapsedSec: 0,
      initialChatSec: quota.chatUsed,
      initialVoiceSec: quota.callUsed,
      limitSec: quota.totalLimitSeconds,
      hasActivePackage: quota.hasActivePackage,
      aloneTicks: 0,
    };

    callState.interval = setInterval(async () => {
      try {
        const room = io.sockets.adapter.rooms.get(`request-${requestId}`);
        const numInRoom = room ? room.size : 0;

        // Only count time when BOTH User and Breakup Buddy are connected in the call room
        if (numInRoom < 2) {
          callState.aloneTicks += 1;
          if (callState.aloneTicks >= 3) {
            await stopAndSaveActiveCall(io, requestId, callLogId, 'peer-disconnected');
          }
          return;
        }

        callState.aloneTicks = 0;
        callState.elapsedSec += 1;

        const currentVoiceSec = callState.initialVoiceSec + callState.elapsedSec;
        const currentTotalUsed = callState.initialChatSec + currentVoiceSec;
        const remaining = Math.max(0, callState.limitSec - currentTotalUsed);

        if (currentTotalUsed >= callState.limitSec) {
          // Strict 30-minute (or package limit) cap reached! Force end call server-side
          const maxVoiceSec = Math.max(0, callState.limitSec - callState.initialChatSec);
          await prisma.buddyRequest.update({
            where: { id: requestId },
            data: { voiceCallSeconds: maxVoiceSec }
          }).catch(() => {});

          clearInterval(callState.interval);
          activeCalls.delete(requestId);

          if (callState.callLogId) {
            await prisma.callLog.update({
              where: { id: callState.callLogId },
              data: { durationSec: Math.max(1, callState.elapsedSec), endedAt: new Date(), status: 'COMPLETED' }
            }).catch(() => {});
          }

          io.to(`request-${requestId}`).emit('call-ended', {
            reason: 'time-expired',
            remainingSeconds: 0,
            totalUsedSeconds: callState.limitSec,
            totalLimitSeconds: callState.limitSec,
            hasActivePackage: callState.hasActivePackage,
          });
        } else {
          // Save cumulative voice seconds in DB every second
          await prisma.buddyRequest.update({
            where: { id: requestId },
            data: { voiceCallSeconds: currentVoiceSec }
          }).catch(() => {});

          // Broadcast live synchronized remaining & used time to both participants
          io.to(`request-${requestId}`).emit('timer-tick', {
            remainingSeconds: remaining,
            totalUsedSeconds: currentTotalUsed,
            totalLimitSeconds: callState.limitSec,
            voiceCallSeconds: currentVoiceSec,
            callElapsedSeconds: callState.elapsedSec,
            voiceCallLimitSeconds: callState.limitSec,
            hasActivePackage: callState.hasActivePackage,
          });
        }
      } catch (e) {
        console.error('Timer error:', e);
      }
    }, 1000);

    activeCalls.set(requestId, callState);
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
    if (!requestId) return;
    await stopAndSaveActiveCall(io, requestId, callLogId, 'ended');
  });

  // WebRTC Signaling (Relay offer, answer, and ICE candidates reliably)
  socket.on('webrtc-offer', ({ requestId, offer }) => {
    if (!requestId) return;
    socket.join(`request-${requestId}`);
    socket.to(`request-${requestId}`).emit('webrtc-offer', offer);
  });

  socket.on('webrtc-answer', ({ requestId, answer }) => {
    if (!requestId) return;
    socket.join(`request-${requestId}`);
    socket.to(`request-${requestId}`).emit('webrtc-answer', answer);
  });

  const relayIceCandidate = ({ requestId, candidate }) => {
    if (!requestId) return;
    socket.join(`request-${requestId}`);
    socket.to(`request-${requestId}`).emit('webrtc-ice', candidate);
    socket.to(`request-${requestId}`).emit('ice-candidate', candidate);
  };
  socket.on('webrtc-ice', relayIceCandidate);
  socket.on('ice-candidate', relayIceCandidate);

  socket.on('disconnect', () => {
    console.log('Socket disconnected:', socket.id);
    if (socket.activeCallRequestId && activeCalls.has(socket.activeCallRequestId)) {
      stopAndSaveActiveCall(io, socket.activeCallRequestId, null, 'peer-disconnected').catch(() => {});
    }
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