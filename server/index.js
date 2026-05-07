const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const helmet = require('helmet');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const socketIo = require('socket.io');
const path = require('path');
const { ensureDatabase } = require('./database/bootstrap');
const { initSchema } = require('./database/initSchema');
const { pool } = require('./database/pool');
const { log, requestLogger } = require('./logger');
const { uploadsDir } = require('./middleware/listingImageUpload');
const { ensureCsrfCookie, verifyCsrf } = require('./middleware/csrf');
const { attachSocketAuth } = require('./middleware/socketAuth');
const swaggerUi = require('swagger-ui-express');
const swaggerSpecs = require('./swagger');

dotenv.config();

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  log('fatal', 'jwt_secret_required', { hint: 'JWT_SECRET must be set to at least 32 random characters.' });
  process.exit(1);
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

const isDev = process.env.NODE_ENV !== 'production';

const helmetOpts = {
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  permissionsPolicy: {
    directives: {
      camera: [],
      microphone: [],
      geolocation: [],
      'interest-cohort': [],
    },
  },
};

if (process.env.NODE_ENV === 'production') {
  helmetOpts.hsts = {
    maxAge: 15552000,
    includeSubDomains: false,
    preload: false,
  };
}

// CSP -- more permissive in dev (eval sourcemaps, local ws), stricter in prod
helmetOpts.contentSecurityPolicy = {
  useDefaults: false,
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: [
      "'self'",
      "'unsafe-inline'",
      ...(isDev ? ["'unsafe-eval'"] : []),
      'https://accounts.google.com',
    ],
    styleSrc: ["'self'", "'unsafe-inline'"],
    imgSrc: [
      "'self'",
      'data:',
      'blob:',
      'https://res.cloudinary.com',
      'https://images.unsplash.com',
    ],
    connectSrc: [
      "'self'",
      ...(isDev ? ['ws://localhost:*', 'http://localhost:*'] : []),
    ],
    fontSrc: ["'self'", 'data:'],
    frameSrc: ['https://accounts.google.com'],
    objectSrc: ["'none'"],
    formAction: ["'self'"],
    frameAncestors: ["'none'"],
    baseUri: ["'self'"],
  },
};
app.use(helmet(helmetOpts));
app.use(requestLogger);
app.use(cookieParser());

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  const { setupGoogleAuth } = require('./middleware/googleAuth');
  setupGoogleAuth(app, pool);
}

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

app.use('/uploads', (req, res, next) => {
  // Cache images for 30 days (immutable after upload)
  res.setHeader('Cache-Control', 'public, max-age=2592000, immutable');
  res.setHeader('Vary', 'Accept-Encoding');
  next();
}, express.static(uploadsDir));

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_API_MAX || 1200),
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
app.use('/api/favorites', require('./routes/favorites'));
app.use('/api/password', require('./routes/password'));
app.use('/api/locations', require('./routes/locations'));
app.use('/api/consents', require('./routes/consents'));

// Swagger API documentation
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs));
log('info', 'swagger_docs_available', { url: 'http://localhost:' + (process.env.PORT || 5000) + '/api/docs' });

// Database Viewer (development only)
if (process.env.NODE_ENV !== 'production') {
  const { createDbViewer } = require('./db-viewer');
  app.use('/db-viewer', createDbViewer(pool));
  const viewerPort = process.env.PORT || 5000;
  log('info', 'db_viewer_available', { url: `http://localhost:${viewerPort}/db-viewer` });
}

attachSocketAuth(io);

process.on('SIGTERM', async () => {
  log('info', 'shutting_down');
  await pool.end();
  process.exit(0);
});

process.on('SIGINT', async () => {
  log('info', 'shutting_down');
  await pool.end();
  process.exit(0);
});

app.use((req, res, next) => {
  if (req.method === 'GET' && !req.url.startsWith('/api') && !req.url.startsWith('/uploads') && !req.url.startsWith('/socket.io')) {
    return res.sendFile(path.join(__dirname, '..', 'client', 'dist', 'index.html'), (err) => {
      if (err) {
        log('error', 'serve_index_failed', { message: err.message });
        res.status(404).send('Not found');
      }
    });
  }
  next();
});

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
    log('error', 'mysql_init_hint', { hint: 'Fix MYSQL_* in .env and ensure the MySQL server is running.' });
  }

  server.listen(PORT, '0.0.0.0', () => {
    log('info', 'server_listen', { port: PORT });
    log('info', 'server_running', { port: PORT });
  });
}

start();
