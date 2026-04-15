const express = require('express');
const { body, validationResult } = require('express-validator');
const userRepository = require('../database/userRepository');
const listingRepository = require('../database/listingRepository');
const auth = require('../middleware/auth');
const { mapUser } = require('../database/mappers');

const router = express.Router();

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

      await userRepository.updateProfile(req.user.id, {
        firstName,
        lastName,
        phone,
        location,
        avatar,
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

router.get('/:id/listings', async (req, res) => {
  try {
    const sellerId = parseInt(req.params.id, 10);
    if (Number.isNaN(sellerId)) {
      return res.status(404).json({ message: 'User not found' });
    }
    const listings = await listingRepository.findBySeller(sellerId);
    res.json(listings);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

router.get('/:id', async (req, res) => {
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
