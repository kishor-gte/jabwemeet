require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');

const authRouter = require('./routes/auth');
const eventsRouter = require('./routes/events');
const adminRouter = require('./routes/admin');
const matchmakerRouter = require('./routes/matchmaker');
const servicesRouter = require('./routes/services');
const { initAdminDb } = require('./db/adminInit');

const app = express();
const PORT = process.env.PORT || 5001;

// Initialize admin schema safely in background
initAdminDb().catch(err => console.error('Failed to initialize admin database:', err));

// Trust proxy for rate limiting behind reverse proxies (like Next.js rewrites)
app.set('trust proxy', 1);

// CORS configuration supporting credentials (cookies)
const allowedOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:5001',
  'http://127.0.0.1:5001',
];

if (process.env.FRONTEND_URL && !allowedOrigins.includes(process.env.FRONTEND_URL)) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(null, true); 
    },
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

const publicDir = path.join(__dirname, '..', 'frontend', 'public');
app.use(express.static(publicDir));

// Serve uploaded documents
const uploadsDir = path.join(__dirname, 'uploads');
app.use('/uploads', express.static(uploadsDir));

// API Routes

const subscriptionRouter = require('./routes/subscription');

app.use('/api/auth', authRouter);
app.use('/api/events', eventsRouter);
app.use('/api/admin', adminRouter);
app.use('/api/matchmaker', matchmakerRouter);
app.use('/api/buddy', require('./routes/buddy'));
app.use('/api/subscription', subscriptionRouter);
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
const prisma = require('./db'); // Database

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
  }
});

// Track call intervals to update DB
const activeCalls = new Map(); // requestId -> intervalId

io.on('connection', (socket) => {
  console.log('Socket connected:', socket.id);

  socket.on('join-buddy-room', (buddyId) => {
    socket.join(`buddy-${buddyId}`);
  });

  socket.on('join-request-room', (requestId) => {
    socket.join(`request-${requestId}`);
  });

  socket.on('initiate-call', async ({ requestId, buddyId, callerName }) => {
    try {
      const request = await prisma.buddyRequest.findUnique({ where: { id: requestId } });
      if (!request || request.voiceCallSeconds >= request.voiceCallLimitSeconds) {
        // Strict limit reached
        socket.emit('call-rejected', { reason: 'limit-reached' });
        return;
      }
      io.to(`buddy-${buddyId}`).emit('incoming-call', { requestId, callerName });
    } catch (e) {
      console.error(e);
      socket.emit('call-rejected', { reason: 'error' });
    }
  });

  socket.on('accept-call', ({ requestId }) => {
    io.to(`request-${requestId}`).emit('call-accepted');
    
    // Start tracking time in DB for this call
    if (!activeCalls.has(requestId)) {
      const interval = setInterval(async () => {
        try {
          const req = await prisma.buddyRequest.update({
            where: { id: requestId },
            data: { voiceCallSeconds: { increment: 5 } }
          });
          if (req.voiceCallSeconds >= req.voiceCallLimitSeconds) {
            // Force end call when time is up server-side
            io.to(`request-${requestId}`).emit('call-ended', { reason: 'time-expired' });
            clearInterval(activeCalls.get(requestId));
            activeCalls.delete(requestId);
          }
        } catch (e) {
          console.error("Timer error:", e);
        }
      }, 5000);
      activeCalls.set(requestId, interval);
    }
  });

  socket.on('reject-call', ({ requestId, reason }) => {
    io.to(`request-${requestId}`).emit('call-rejected', { reason });
  });

  socket.on('end-call', ({ requestId }) => {
    io.to(`request-${requestId}`).emit('call-ended');
    if (activeCalls.has(requestId)) {
      clearInterval(activeCalls.get(requestId));
      activeCalls.delete(requestId);
    }
  });

  // WebRTC Signaling
  socket.on('webrtc-offer', ({ requestId, offer }) => {
    socket.to(`request-${requestId}`).emit('webrtc-offer', offer);
  });

  socket.on('webrtc-answer', ({ requestId, answer }) => {
    socket.to(`request-${requestId}`).emit('webrtc-answer', answer);
  });

  socket.on('ice-candidate', ({ requestId, candidate }) => {
    socket.to(`request-${requestId}`).emit('ice-candidate', candidate);
  });

  socket.on('disconnect', () => {
    console.log('Socket disconnected:', socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`JabWeMeet Backend Server (with Socket.io) running at http://localhost:${PORT}`);
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