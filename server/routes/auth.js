const express = require('express');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const userRepository = require('../database/userRepository');
const { mapUser } = require('../database/mappers');
const { pool } = require('../database/pool');
const { asyncHandler, AppError } = require('../utils/asyncHandler');
const { logAudit } = require('../database/auditRepository');
const { sendMail, buildWelcomeEmail } = require('../utils/emailService');

const router = express.Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_AUTH_MAX || 40),
  standardHeaders: true,
  legacyHeaders: false,
});

const TOKEN_COOKIE = 'tt_token';

function authCookieOpts() {
  return {
    httpOnly: true,
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  };
}

function generateToken(user) {
  return jwt.sign(
    { user: { id: user.id, isAdmin: user.is_admin } },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

router.post(
  '/register',
  [
    body('username').isLength({ min: 3, max: 32 }).trim().escape(),
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/),
    body('firstName').isLength({ min: 1, max: 120 }).trim().escape(),
    body('lastName').isLength({ min: 1, max: 120 }).trim().escape(),
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, email, password, firstName, lastName } = req.body;

    const exists = await userRepository.existsByUsernameOrEmail(username, email);
    if (exists) {
      return res.status(400).json({ message: 'Username or email already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const userId = await userRepository.create({
      username,
      email,
      password: hashedPassword,
      firstName,
      lastName,
    });

    const token = generateToken({ id: userId, is_admin: 0 });
    res.cookie(TOKEN_COOKIE, token, authCookieOpts());
    res.status(201).json({ id: userId, username, email, firstName, lastName });

    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    sendMail({
      to: email,
      ...buildWelcomeEmail(username, clientUrl),
    }).catch(() => {});
  })
);

router.post('/login', asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await userRepository.findByEmail(email);
  if (!user) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }
  
  if (user.password === 'google_oauth') {
    return res.status(401).json({ message: 'This account uses Google login. Sign in with Google instead.' });
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  await userRepository.updateLastLogin(user.id);
  await logAudit(user.id, 'auth.login', null, null, req);

  const token = generateToken(user);
  res.cookie(TOKEN_COOKIE, token, authCookieOpts());

  const { password: _p, ...safe } = user;
  res.json(mapUser(safe, { includeEmail: true }));
}));

router.get('/google', (req, res) => {
  const googleClientID = process.env.GOOGLE_CLIENT_ID;
  if (!googleClientID) {
    return res.status(501).json({ message: 'Google login not configured. Add GOOGLE_CLIENT_ID to .env' });
  }
  res.redirect('/api/auth/google/auth');
});

router.get('/google/auth', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get(
  '/google/callback',
  passport.authenticate('google', { session: false }),
  asyncHandler(async (req, res) => {
    try {
      const googleUser = req.user;
      const email = googleUser?.emails?.[0]?.value || googleUser?.email;
      
      if (!email) {
        return res.redirect('/?error=google_no_email');
      }

      let [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
      
      let user = rows[0];
      
      if (!user) {
        const username = googleUser.displayName || email.split('@')[0];
        const name = googleUser.name || {};
        const firstName = name.givenName || '';
        const lastName = name.familyName || '';
        const avatar = googleUser.photos?.[0]?.value || '';

        const [result] = await pool.query(
          `INSERT INTO users (username, email, password, first_name, last_name, avatar, is_verified)
           VALUES (?, ?, 'google_oauth', ?, ?, ?, 1)`,
          [username, email, firstName, lastName, avatar]
        );

        user = { id: result.insertId, is_admin: 0 };
      }

      await userRepository.updateLastLogin(user.id);

      const token = generateToken(user);
      res.cookie(TOKEN_COOKIE, token, authCookieOpts());
      res.redirect(process.env.CLIENT_URL || 'http://localhost:5173');
    } catch (err) {
      res.redirect('/?error=google_auth_failed');
    }
  })
);

router.post('/logout', authLimiter, (req, res) => {
  res.clearCookie(TOKEN_COOKIE, { path: '/' });
  res.json({ ok: true });
});

router.get('/me', auth, asyncHandler(async (req, res) => {
  const row = await userRepository.findById(req.user.id);
  if (!row) {
    return res.status(404).json({ message: 'User not found' });
  }
  const { password: _p, ...safe } = row;
  res.json(mapUser(safe, { includeEmail: true }));
}));

router.post('/refresh', auth, asyncHandler(async (req, res) => {
  const row = await userRepository.findById(req.user.id);
  if (!row) {
    return res.status(401).json({ message: 'User not found' });
  }
  const token = generateToken(row);
  res.cookie(TOKEN_COOKIE, token, authCookieOpts());
  const { password: _p, ...safe } = row;
  res.json(mapUser(safe, { includeEmail: true }));
}));

module.exports = router;