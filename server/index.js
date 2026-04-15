const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const helmet = require('helmet');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const socketIo = require('socket.io');
const { ensureDatabase } = require('./database/bootstrap');
const { initSchema } = require('./database/initSchema');
const { pool } = require('./database/pool');
const { log } = require('./logger');
const { uploadsDir } = require('./middleware/listingImageUpload');
const { ensureCsrfCookie, verifyCsrf } = require('./middleware/csrf');
const { attachSocketAuth } = require('./middleware/socketAuth');

dotenv.config();

if (process.env.NODE_ENV === 'production') {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    console.error('FATAL: Set JWT_SECRET to at least 32 random characters in production.');
    process.exit(1);
  }
}

function parseCorsOrigins() {
  const raw = process.env.CORS_ORIGINS || process.env.CLIENT_URL || 'http://localhost:5173';
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

const app = express();
app.set('trust proxy', 1);
app.disable('x-powered-by');

const server = http.createServer(app);
const corsOrigins = parseCorsOrigins();
const io = socketIo(server, {
  cors: {
    origin: corsOrigins.length <= 1 ? corsOrigins[0] || true : corsOrigins,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

app.set('io', io);

const helmetOpts = {
  crossOriginResourcePolicy: { policy: 'cross-origin' },
};
if (process.env.NODE_ENV === 'production') {
  helmetOpts.hsts = {
    maxAge: 15552000,
    includeSubDomains: false,
    preload: false,
  };
}
app.use(helmet(helmetOpts));
app.use(cookieParser());

app.use(
  cors({
    origin(origin, cb) {
      if (!origin) return cb(null, true);
      if (corsOrigins.includes(origin)) return cb(null, true);
      return cb(null, false);
    },
    credentials: true,
  })
);

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(hpp());

app.use('/uploads', express.static(uploadsDir));

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_API_MAX || 400),
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.originalUrl.split('?')[0] === '/api/health',
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_AUTH_MAX || 40),
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api', apiLimiter);
app.use('/api/auth', authLimiter);
app.use('/api', ensureCsrfCookie);
app.use('/api', verifyCsrf);

app.get('/api/health', async (_req, res) => {
  let database = 'down';
  try {
    await pool.query('SELECT 1');
    database = 'up';
  } catch (e) {
    log('warn', 'health_db_check_failed', { message: e.message });
  }
  res.json({
    ok: database === 'up',
    timestamp: new Date().toISOString(),
    database,
    env: process.env.NODE_ENV || 'development',
  });
});

app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/listings', require('./routes/listings'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/ratings', require('./routes/ratings'));

attachSocketAuth(io);

app.use((err, req, res, _next) => {
  log('error', 'express_error', {
    message: err.message,
    path: req.originalUrl,
    method: req.method,
  });
  if (res.headersSent) return;
  const status = Number(err.statusCode || err.status) || 500;
  const body =
    process.env.NODE_ENV === 'production' && status >= 500
      ? { message: 'Something went wrong' }
      : { message: err.message || 'Server error' };
  res.status(status).json(body);
});

const PORT = process.env.PORT || 5000;

async function start() {
  try {
    await ensureDatabase();
    await initSchema();
    log('info', 'database_ready');
  } catch (err) {
    log('error', 'mysql_init_failed', { message: err.message });
    console.error('MySQL init failed:', err.message);
    console.error('Fix MYSQL_* in .env and ensure the MySQL server is running.');
  }

  server.listen(PORT, () => {
    log('info', 'server_listen', { port: PORT });
    console.log(`Server running on port ${PORT}`);
  });
}

start();
