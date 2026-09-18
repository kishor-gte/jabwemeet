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

const app = express();
const PORT = process.env.PORT || 5001;

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

const server = app.listen(PORT, () => {
  console.log(`JabWeMeet Backend Server running at http://localhost:${PORT}`);
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