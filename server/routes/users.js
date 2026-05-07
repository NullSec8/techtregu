const express = require('express');
const { body, validationResult } = require('express-validator');
const userRepository = require('../database/userRepository');
const listingRepository = require('../database/listingRepository');
const auth = require('../middleware/auth');
const { upload } = require('../middleware/listingImageUpload');
const { mapUser } = require('../database/mappers');
const { plainText } = require('../utils/sanitize');
const { asyncHandler, AppError } = require('../utils/asyncHandler');

const router = express.Router();

router.post('/profile/avatar', auth, (req, res, next) => {
  upload.single('avatar')(req, res, (err) => {
    if (err) return res.status(400).json({ message: err.message || 'Avatar upload failed' });
    next();
  });
}, asyncHandler(async (req, res) => {
  const file = req.file;
  if (!file) return res.status(400).json({ message: 'No avatar file uploaded' });
  const avatarUrl = `/uploads/${file.filename}`;
  await userRepository.updateProfile(req.user.id, { avatar: avatarUrl });
  res.json({ avatar: avatarUrl });
}));

router.put(
  '/profile',
  auth,
  [
    body('firstName').optional().trim().escape(),
    body('lastName').optional().trim().escape(),
    body('phone').optional().trim(),
    body('location').optional().trim().escape(),
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const row = await userRepository.findById(req.user.id);
    if (!row) {
      return res.status(404).json({ message: 'User not found' });
    }

    const { firstName, lastName, phone, location, avatar } = req.body;
    const safeAvatar = avatar && typeof avatar === 'string' && avatar.startsWith('/uploads/') && /^\/uploads\/[a-zA-Z0-9_-]+\.(jpg|jpeg|png|gif|webp|avif)$/i.test(avatar) ? avatar : undefined;

    await userRepository.updateProfile(req.user.id, {
      firstName,
      lastName,
      phone,
      location,
      avatar: safeAvatar,
    });

    const updated = await userRepository.findById(req.user.id);
    const { password: _p, ...safe } = updated;
    res.json(mapUser(safe, { includeEmail: true }));
  })
);

router.get('/me/listings', auth, asyncHandler(async (req, res) => {
  const listings = await listingRepository.findBySellerAll(req.user.id);
  res.json(listings);
}));

router.get('/by-username/:username/listings', asyncHandler(async (req, res) => {
  const username = String(req.params.username || '').trim();
  if (!username) {
    return res.status(404).json({ message: 'User not found' });
  }
  const row = await userRepository.findByUsername(username);
  if (!row) {
    return res.status(404).json({ message: 'User not found' });
  }
  const listings = await listingRepository.findBySeller(row.id);
  res.json(listings);
}));

router.get('/by-username/:username', asyncHandler(async (req, res) => {
  const username = String(req.params.username || '').trim();
  if (!username) {
    return res.status(404).json({ message: 'User not found' });
  }
  const row = await userRepository.findByUsername(username);
  if (!row) {
    return res.status(404).json({ message: 'User not found' });
  }
  const { password: _p, ...safe } = row;
  res.json(mapUser(safe, { includeEmail: false }));
}));

router.get('/:id/listings', asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (Number.isNaN(id)) {
    return res.status(404).json({ message: 'User not found' });
  }
  const row = await userRepository.findById(id);
  if (!row) {
    return res.status(404).json({ message: 'User not found' });
  }
  const listings = await listingRepository.findBySeller(id);
  res.json(listings);
}));

// Export all data for the authenticated user (GDPR-style data export)
router.get('/me/export', auth, asyncHandler(async (req, res) => {
  const user = await userRepository.findById(req.user.id);
  if (!user) return res.status(404).json({ message: 'User not found' });

  const { password: _p, reset_token: _rt, ...profile } = user;

  const [listings] = await pool.query(
    'SELECT * FROM listings WHERE seller_id = ? ORDER BY created_at DESC',
    [req.user.id]
  );

  const [messages] = await pool.query(
    'SELECT * FROM messages WHERE sender_id = ? OR recipient_id = ? ORDER BY created_at DESC',
    [req.user.id, req.user.id]
  );

  const [ratings] = await pool.query(
    'SELECT * FROM ratings WHERE reviewer_id = ? OR recipient_id = ? ORDER BY created_at DESC',
    [req.user.id, req.user.id]
  );

  const [reports] = await pool.query(
    'SELECT * FROM reports WHERE reporter_id = ? ORDER BY created_at DESC',
    [req.user.id]
  );

  res.json({
    exportedAt: new Date().toISOString(),
    profile,
    listings,
    messages,
    ratings,
    reports,
  });
}));

// Delete (anonymize) the authenticated user's account
router.delete('/me', auth, asyncHandler(async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Anonymize user record
    await conn.query(
      'UPDATE users SET username = CONCAT("deleted_", id), email = CONCAT("deleted_", id, "@deleted"), first_name = NULL, last_name = NULL, phone = NULL, location = NULL, avatar = NULL, password = NULL, reset_token = NULL, reset_expires = NULL WHERE id = ?',
      [req.user.id]
    );

    // Anonymize messages
    await conn.query(
      'UPDATE messages SET sender_id = NULL WHERE sender_id = ?',
      [req.user.id]
    );

    // Remove reports by this user
    await conn.query('DELETE FROM reports WHERE reporter_id = ?', [req.user.id]);

    // Remove favorites
    await conn.query('DELETE FROM favorites WHERE user_id = ?', [req.user.id]);

    // Remove ratings given by this user
    await conn.query('DELETE FROM ratings WHERE reviewer_id = ?', [req.user.id]);

    // Deactivate listings
    await conn.query(
      'UPDATE listings SET is_active = 0 WHERE seller_id = ?',
      [req.user.id]
    );

    await conn.commit();
    res.json({ message: 'Account deleted' });
  } catch (err) {
    await conn.rollback();
    throw new AppError('Failed to delete account', 500);
  } finally {
    conn.release();
  }
}));

module.exports = router;
