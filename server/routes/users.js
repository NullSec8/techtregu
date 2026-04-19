const express = require('express');
const { body, validationResult } = require('express-validator');
const userRepository = require('../database/userRepository');
const listingRepository = require('../database/listingRepository');
const auth = require('../middleware/auth');
const { upload } = require('../middleware/listingImageUpload');
const { mapUser } = require('../database/mappers');
const { plainText } = require('../utils/sanitize');

const router = express.Router();

router.post('/profile/avatar', auth, (req, res, next) => {
  upload.single('avatar')(req, res, (err) => {
    if (err) return res.status(400).json({ message: err.message || 'Avatar upload failed' });
    next();
  });
}, async (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ message: 'No avatar file uploaded' });
    const avatarUrl = `/uploads/${file.filename}`;
    await userRepository.updateProfile(req.user.id, { avatar: avatarUrl });
    res.json({ avatar: avatarUrl });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

router.put(
  '/profile',
  auth,
  [
    body('firstName').optional().trim().escape(),
    body('lastName').optional().trim().escape(),
    body('phone').optional().trim(),
    body('location').optional().trim().escape(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
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
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  }
);

router.get('/me/listings', auth, async (req, res) => {
  try {
    const listings = await listingRepository.findBySellerAll(req.user.id);
    res.json(listings);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

router.get('/by-username/:username/listings', async (req, res) => {
  try {
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
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

router.get('/by-username/:username', async (req, res) => {
  try {
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
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

router.get('/:id/listings', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      return res.status(404).json({ message: 'User not found' });
    }
    const row = await userRepository.findById(id);
    if (!row) {
      return res.status(404).json({ message: 'User not found' });
    }
    const { password: _p, ...safe } = row;
    res.json(mapUser(safe, { includeEmail: false }));
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
