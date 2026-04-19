const express = require('express');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const userRepository = require('../database/userRepository');

const router = express.Router();

const passwordResetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many reset requests, try again later' },
});

function generateResetToken() {
  return crypto.randomBytes(32).toString('hex');
}

router.post(
  '/forgot',
  passwordResetLimiter,
  [body('email').isEmail().normalizeEmail()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email } = req.body;
    try {
      const user = await userRepository.findByEmail(email);
      if (!user) {
        return res.status(200).json({ message: 'If the email exists, a reset link has been sent' });
      }

      const resetToken = generateResetToken();
      const resetExpires = new Date(Date.now() + 15 * 60 * 1000);

      await userRepository.setPasswordReset(user.id, resetToken, resetExpires);

      const resetLink = `${process.env.CLIENT_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;

      return res.status(200).json({ message: 'If the email exists, a reset link has been sent' });
    } catch (err) {
      console.error(err.message);
      return res.status(500).send('Server error');
    }
  }
);

router.post(
  '/reset',
  [
    body('email').isEmail().normalizeEmail(),
    body('token').isLength({ min: 64, max: 64 }),
    body('password').isLength({ min: 8 }).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'i'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, token, password } = req.body;

    try {
      const user = await userRepository.findByEmail(email);
      if (!user) {
        return res.status(400).json({ message: 'Invalid reset token' });
      }

      if (user.reset_token !== token) {
        return res.status(400).json({ message: 'Invalid reset token' });
      }

      if (!user.reset_expires || new Date(user.reset_expires) < new Date()) {
        return res.status(400).json({ message: 'Reset token has expired' });
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      await userRepository.updatePassword(user.id, hashedPassword);
      await userRepository.clearPasswordReset(user.id);

      return res.json({ message: 'Password has been reset successfully' });
    } catch (err) {
      console.error(err.message);
      return res.status(500).send('Server error');
    }
  }
);

router.post(
  '/change',
  [
    body('currentPassword').exists(),
    body('newPassword').isLength({ min: 8 }).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'i'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { currentPassword, newPassword } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    try {
      const user = await userRepository.findById(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: 'Current password is incorrect' });
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);

      await userRepository.updatePassword(userId, hashedPassword);

      return res.json({ message: 'Password changed successfully' });
    } catch (err) {
      console.error(err.message);
      return res.status(500).send('Server error');
    }
  }
);

module.exports = router;