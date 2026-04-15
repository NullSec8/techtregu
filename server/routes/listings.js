const express = require('express');
const { body, validationResult } = require('express-validator');
const Listing = require('../models/Listing');
const auth = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/listings
// @desc    Get all listings with filters
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { category, search, minPrice, maxPrice, condition, location, page = 1, limit = 12 } = req.query;

    let query = { isActive: true };

    if (category && category !== 'all') {
      query.category = category;
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(minPrice);
      if (maxPrice) query.price.$lte = parseFloat(maxPrice);
    }

    if (condition) {
      query.condition = condition;
    }

    if (location) {
      query.location = { $regex: location, $options: 'i' };
    }

    const listings = await Listing.find(query)
      .populate('seller', 'username firstName lastName avatar')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Listing.countDocuments(query);

    res.json({
      listings,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET /api/listings/:id
// @desc    Get single listing
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id)
      .populate('seller', 'username firstName lastName email phone avatar location');

    if (!listing || !listing.isActive) {
      return res.status(404).json({ message: 'Listing not found' });
    }

    // Increment views
    listing.views += 1;
    await listing.save();

    res.json(listing);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST /api/listings
// @desc    Create new listing
// @access  Private
router.post('/', auth, [
  body('title').isLength({ min: 3 }).trim().escape(),
  body('description').isLength({ min: 10 }).trim(),
  body('price').isFloat({ min: 0 }),
  body('category').isIn(['laptop', 'desktop', 'gpu', 'cpu', 'ram', 'storage', 'monitor', 'peripheral', 'other']),
  body('condition').isIn(['new', 'used', 'refurbished']),
  body('location').trim().escape()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { title, description, price, category, condition, images, location, specs } = req.body;

    const listing = new Listing({
      title,
      description,
      price,
      category,
      condition,
      images: images || [],
      location,
      specs: specs || {},
      seller: req.user.id
    });

    await listing.save();
    await listing.populate('seller', 'username firstName lastName avatar');

    res.json(listing);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   PUT /api/listings/:id
// @desc    Update listing
// @access  Private
router.put('/:id', auth, async (req, res) => {
  try {
    let listing = await Listing.findById(req.params.id);

    if (!listing) {
      return res.status(404).json({ message: 'Listing not found' });
    }

    // Check if user owns the listing
    if (listing.seller.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    const { title, description, price, category, condition, images, location, specs, isActive } = req.body;

    if (title) listing.title = title;
    if (description) listing.description = description;
    if (price) listing.price = price;
    if (category) listing.category = category;
    if (condition) listing.condition = condition;
    if (images) listing.images = images;
    if (location) listing.location = location;
    if (specs) listing.specs = specs;
    if (isActive !== undefined) listing.isActive = isActive;

    await listing.save();
    await listing.populate('seller', 'username firstName lastName avatar');

    res.json(listing);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   DELETE /api/listings/:id
// @desc    Delete listing
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);

    if (!listing) {
      return res.status(404).json({ message: 'Listing not found' });
    }

    // Check if user owns the listing or is admin
    if (listing.seller.toString() !== req.user.id) {
      // Check if admin (would need to implement admin check)
      return res.status(401).json({ message: 'Not authorized' });
    }

    await Listing.findByIdAndDelete(req.params.id);

    res.json({ message: 'Listing removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;