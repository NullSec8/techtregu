const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const userRepository = require('../database/userRepository');
const { mapUser } = require('../database/mappers');

const router = express.Router();

const TOKEN_COOKIE = 'tt_token';

function authCookieOpts() {
  return {
    httpOnly: true,
    path: '/api',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  };
}

router.post(
  '/register',
  [
    body('username').isLength({ min: 3 }).trim().escape(),
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }),
    body('firstName').trim().escape(),
    body('lastName').trim().escape(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, email, password, firstName, lastName, phone, location } = req.body;

    try {
      const exists = await userRepository.existsByUsernameOrEmail(username, email);
      if (exists) {
        return res.status(400).json({ message: 'User already exists' });
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const userId = await userRepository.create({
        username,
        email,
        password: hashedPassword,
        firstName,
        lastName,
        phone,
        location,
      });

      const payload = { user: { id: userId } };
      const token = jwt.sign(payload, process.env.JWT_SECRET || 'your_jwt_secret', { expiresIn: '7d' });

      res.cookie(TOKEN_COOKIE, token, authCookieOpts());
      res.json({ token });
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  }
);

router.post(
  '/login',
  [body('email').isEmail().normalizeEmail(), body('password').exists()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
      const user = await userRepository.findByEmail(email);
      if (!user) {
        return res.status(400).json({ message: 'Invalid credentials' });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: 'Invalid credentials' });
      }

      await userRepository.updateLastLogin(user.id);

      const payload = { user: { id: user.id } };
      const token = jwt.sign(payload, process.env.JWT_SECRET || 'your_jwt_secret', { expiresIn: '7d' });

      res.cookie(TOKEN_COOKIE, token, authCookieOpts());
      res.json({ token });
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  }
);

router.post('/logout', (req, res) => {
  res.clearCookie(TOKEN_COOKIE, { path: '/api' });
  res.json({ ok: true });
});

router.get('/me', auth, async (req, res) => {
  try {
    const row = await userRepository.findById(req.user.id);
    if (!row) {
      return res.status(404).json({ message: 'User not found' });
    }
    const { password: _p, ...safe } = row;
    res.json(mapUser(safe, { includeEmail: true }));
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
