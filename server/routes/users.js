const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Listing = require('../models/Listing');
const auth = require('../middleware/auth');

const router = express.Router();

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', auth, [
  body('firstName').optional().trim().escape(),
  body('lastName').optional().trim().escape(),
  body('phone').optional().trim(),
  body('location').optional().trim().escape(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const { firstName, lastName, phone, location, avatar } = req.body;

    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (phone) user.phone = phone;
    if (location) user.location = location;
    if (avatar) user.avatar = avatar;

    await user.save();

    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET /api/users/:id/listings
// @desc    Get user's listings
// @access  Public
router.get('/:id/listings', async (req, res) => {
  try {
    const listings = await Listing.find({ seller: req.params.id, isActive: true }).sort({
      createdAt: -1,
    });
    res.json(listings);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET /api/users/:id
// @desc    Get user profile
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
