const GoogleStrategy = require('passport-google-oauth20').Strategy;
const passport = require('passport');
const jwt = require('jsonwebtoken');
const session = require('express-session');
const { log } = require('../logger');

function setupGoogleAuth(app, pool) {
  const googleClientID = process.env.GOOGLE_CLIENT_ID;
  const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const googleCallbackURL = process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/auth/google/callback';
  const jwtSecret = process.env.JWT_SECRET;

  if (!googleClientID || !googleClientSecret) {
    log('warn', 'google_auth_not_configured');
    return;
  }

  if (!process.env.SESSION_SECRET && process.env.NODE_ENV === 'production') {
    log('fatal', 'session_secret_required', { hint: 'SESSION_SECRET must be set in production.' });
    process.exit(1);
  }

  const sessionSecret = process.env.SESSION_SECRET || 'techtregu_dev_session_fallback';
  if (!process.env.SESSION_SECRET) {
    log('warn', 'session_secret_fallback', { hint: 'Set SESSION_SECRET in .env for better security' });
  }

  app.use(session({
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: process.env.NODE_ENV === 'production', maxAge: 60000 },
  }));

  app.use(passport.initialize());
  app.use(passport.session());

  async function findOrCreateUser(profile) {
    const email = profile.emails?.[0]?.value;
    if (!email) throw new Error('No email from Google');

    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);

    if (rows[0]) {
      return rows[0];
    }

    const username = profile.displayName || email.split('@')[0];
    const firstName = profile.name?.givenName || '';
    const lastName = profile.name?.familyName || '';
    const avatar = profile.photos?.[0]?.value || '';

    const [result] = await pool.query(
      `INSERT INTO users (username, email, password, first_name, last_name, avatar, is_verified)
       VALUES (?, ?, 'google_oauth', ?, ?, ?, 1)`,
      [username, email, firstName, lastName, avatar]
    );

    return { id: result.insertId, username, email, first_name: firstName, last_name: lastName, avatar, is_verified: 1, is_admin: 0, token_version: 0 };
  }

  const strategy = new GoogleStrategy(
    {
      clientID: googleClientID,
      clientSecret: googleClientSecret,
      callbackURL: googleCallbackURL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const user = await findOrCreateUser(profile);
        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    }
  );

  passport.use(strategy);

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id, done) => {
    try {
      const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [id]);
      done(null, rows[0] || null);
    } catch (err) {
      done(err, null);
    }
  });

  log('info', 'google_auth_configured');

  return {
    generateToken: (user) => {
      return jwt.sign(
        { user: { id: user.id, isAdmin: user.is_admin, tokenVersion: user.token_version ?? 0 } },
        jwtSecret,
        { expiresIn: '7d' }
      );
    },
    strategy,
  };
}

module.exports = { setupGoogleAuth };
