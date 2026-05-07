const express = require('express');
const { body, validationResult } = require('express-validator');
const userRepository = require('../database/userRepository');
const listingRepository = require('../database/listingRepository');
const auth = require('../middleware/auth');
const { upload } = require('../middleware/listingImageUpload');
const { mapUser } = require('../database/mappers');
const { pool } = require('../database/pool');
const { asyncHandler, AppError } = require('../utils/asyncHandler');

const router = express.Router();
/**
 * @openapi
 * /api/users/{id}/listings:
 *   get:
 *     tags: [Users]
 *     summary: Get user's listings
 *     description: Returns all active listings for a specific user by their user ID.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *     responses:
 *       200:
 *         description: Array of user's listings
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Listing'
 *       404:
 *         description: User not found
 *
 * @openapi
 * /api/users/profile:
 *   put:
 *     tags: [Users]
 *     summary: Update user profile
 *     description: Update the authenticated user's profile information. Requires authentication.
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               phone:
 *                 type: string
 *               location:
 *                 type: string
 *               avatar:
 *                 type: string
 *                 description: Avatar image URL (must be an uploaded image path)
 *     responses:
 *       200:
 *         description: Profile updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 username:
 *                   type: string
 *                 email:
 *                   type: string
 *                 firstName:
 *                   type: string
 *                 lastName:
 *                   type: string
 *                 avatar:
 *                   type: string
 *                   nullable: true
 *                 phone:
 *                   type: string
 *                   nullable: true
 *                 location:
 *                   type: string
 *                   nullable: true
 *       400:
 *         description: Validation error
 *       401:
 *         description: Not authenticated
 *       404:
 *         description: User not found
 *
 * @openapi
 * /api/users/profile/avatar:
 *   post:
 *     tags: [Users]
 *     summary: Upload profile avatar
 *     description: Upload an avatar image for the authenticated user. Requires authentication.
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               avatar:
 *                 type: string
 *                 format: binary
 *                 description: Avatar image file
 *     responses:
 *       200:
 *         description: Avatar uploaded
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 avatar:
 *                   type: string
 *       400:
 *         description: Upload failed
 *       401:
 *         description: Not authenticated
 *
 * @openapi
 * /api/users/me/listings:
 *   get:
 *     tags: [Users]
 *     summary: Get own listings
 *     description: Returns all listings for the authenticated user (including inactive). Requires authentication.
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Array of user's listings
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Listing'
 *       401:
 *         description: Not authenticated
 *
 * @openapi
 * /api/users/by-username/{username}:
 *   get:
 *     tags: [Users]
 *     summary: Get user by username
 *     description: Returns the public profile of a user by their username.
 *     parameters:
 *       - in: path
 *         name: username
 *         required: true
 *         schema:
 *           type: string
 *         description: Username
 *     responses:
 *       200:
 *         description: User profile
 *       404:
 *         description: User not found
 *
 * @openapi
 * /api/users/by-username/{username}/listings:
 *   get:
 *     tags: [Users]
 *     summary: Get user's listings by username
 *     description: Returns all active listings for a user by their username.
 *     parameters:
 *       - in: path
 *         name: username
 *         required: true
 *         schema:
 *           type: string
 *         description: Username
 *     responses:
 *       200:
 *         description: Array of user's listings
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Listing'
 *       404:
 *         description: User not found
 *
 * @openapi
 * /api/users/me/export:
 *   get:
 *     tags: [Users]
 *     summary: Export user data (GDPR)
 *     description: Export all data for the authenticated user including profile, listings, messages, ratings, and reports. Requires authentication.
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: User data export
 *       401:
 *         description: Not authenticated
 *       404:
 *         description: User not found
 *
 * @openapi
 * /api/users/me:
 *   delete:
 *     tags: [Users]
 *     summary: Delete (anonymize) account
 *     description: Anonymize the authenticated user's account and all associated data. This is irreversible. Requires authentication.
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Account deleted
 *       401:
 *         description: Not authenticated
 */

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
  } catch {
    await conn.rollback();
    throw new AppError('Failed to delete account', 500);
  } finally {
    conn.release();
  }
}));

module.exports = router;
