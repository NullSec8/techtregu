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
const passport = require('passport');
const session = require('express-session');
const { ensureDatabase } = require('./database/bootstrap');
const { initSchema } = require('./database/initSchema');
const { pool } = require('./database/pool');
const { log } = require('./logger');
const { uploadsDir } = require('./middleware/listingImageUpload');
const { ensureCsrfCookie, verifyCsrf } = require('./middleware/csrf');
const { attachSocketAuth } = require('./middleware/socketAuth');

dotenv.config();

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  console.error('FATAL: JWT_SECRET must be set to at least 32 random characters.');
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

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  const GoogleStrategy = require('passport-google-oauth20').Strategy;
  
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/auth/google/callback',
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      const email = profile.emails?.[0]?.value;
      if (!email) return done(new Error('No email'));
      
      const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
      if (rows[0]) return done(null, rows[0]);
      
      const username = profile.displayName || email.split('@')[0];
      const [result] = await pool.query(
        `INSERT INTO users (username, email, password, first_name, last_name, avatar, is_verified)
         VALUES (?, ?, 'google_oauth', ?, ?, ?, 1)`,
        [username, email, profile.name?.givenName || '', profile.name?.familyName || '', profile.photos?.[0]?.value || '']
      );
      
      const [newUser] = await pool.query('SELECT * FROM users WHERE id = ?', [result.insertId]);
      return done(null, newUser[0]);
    } catch (err) {
      return done(err);
    }
  }));
  
  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id, done) => {
    try {
      const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [id]);
      done(null, rows[0]);
    } catch (err) {
      done(err);
    }
  });
  
  app.use(session({
    secret: process.env.SESSION_SECRET || process.env.JWT_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: process.env.NODE_ENV === 'production', maxAge: 60000 },
  }));
  app.use(passport.initialize());
  app.use(passport.session());
  
  console.log('[GoogleAuth] Passport configured');
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

const messageLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: Number(process.env.RATE_LIMIT_MESSAGE_MAX || 20),
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many messages, please slow down',
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

attachSocketAuth(io);

process.on('SIGTERM', async () => {
  console.log('Shutting down gracefully...');
  await pool.end();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('Shutting down gracefully...');
  await pool.end();
  process.exit(0);
});

app.use((req, res, next) => {
  if (req.method === 'GET' && !req.url.startsWith('/api') && !req.url.startsWith('/uploads') && !req.url.startsWith('/socket.io')) {
    return res.sendFile(path.join(__dirname, '..', 'client', 'dist', 'index.html'), (err) => {
      if (err) {
        console.error('Error serving index.html:', err.message);
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
    console.error('MySQL init failed:', err.message);
    console.error('Fix MYSQL_* in .env and ensure the MySQL server is running.');
  }

  server.listen(PORT, () => {
    log('info', 'server_listen', { port: PORT });
    console.log(`Server running on port ${PORT}`);
  });
}

start();
