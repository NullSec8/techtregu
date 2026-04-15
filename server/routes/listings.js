const express = require('express');
const fs = require('fs');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const { fromBuffer } = require('file-type');
const listingRepository = require('../database/listingRepository');
const auth = require('../middleware/auth');
const { upload } = require('../middleware/listingImageUpload');
const { plainText, sanitizeSpecs } = require('../utils/sanitize');

const router = express.Router();

const ALLOWED_IMAGE_MIMES = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/avif',
]);

const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_UPLOAD_MAX || 40),
  standardHeaders: true,
  legacyHeaders: false,
});

function requireAdmin(req, res, next) {
  if (!req.user?.isAdmin) {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
}

router.get('/', async (req, res) => {
  try {
    const { category, search, minPrice, maxPrice, condition, location, page = 1, limit = 12 } =
      req.query;

    const { listings, total, page: p, limit: lim } = await listingRepository.findMany({
      category,
      search,
      minPrice,
      maxPrice,
      condition,
      location,
      page,
      limit,
    });

    res.json({
      listings,
      totalPages: Math.ceil(total / lim),
      currentPage: p,
      total,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

router.get('/admin/all', auth, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 50, sellerId, active } = req.query;
    const result = await listingRepository.findAllForAdmin({ page, limit, sellerId, active });
    res.json({
      ...result,
      totalPages: Math.ceil(result.total / result.limit),
      currentPage: result.page,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

router.get('/admin/stats', auth, requireAdmin, async (_req, res) => {
  try {
    const stats = await listingRepository.getAdminStats();
    res.json(stats);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

router.post(
  '/images',
  uploadLimiter,
  auth,
  (req, res, next) => {
    upload.array('images', 8)(req, res, (err) => {
      if (err) {
        return res.status(400).json({ message: err.message || 'Upload failed' });
      }
      next();
    });
  },
  async (req, res) => {
    const files = req.files || [];
    try {
      for (const file of files) {
        const buf = fs.readFileSync(file.path);
        const type = await fromBuffer(buf);
        if (!type || !ALLOWED_IMAGE_MIMES.has(type.mime)) {
          try {
            fs.unlinkSync(file.path);
          } catch {
            // ignore
          }
          return res.status(400).json({ message: 'File content is not an allowed image type' });
        }
      }
      const urls = files.map((f) => `/uploads/${f.filename}`);
      res.json({ urls });
    } catch (err) {
      for (const f of files) {
        try {
          fs.unlinkSync(f.path);
        } catch {
          // ignore
        }
      }
      console.error(err.message);
      res.status(500).json({ message: 'Upload verification failed' });
    }
  }
);

router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      return res.status(404).json({ message: 'Listing not found' });
    }

    const shouldTrackView = req.query.track === '1';
    if (shouldTrackView) {
      await listingRepository.incrementViews(id);
    }
    const listing = await listingRepository.findById(id);

    if (!listing) {
      return res.status(404).json({ message: 'Listing not found' });
    }

    res.json(listing);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

router.post(
  '/',
  auth,
  [
    body('title').isLength({ min: 3 }).trim().escape(),
    body('description').isLength({ min: 10 }).trim(),
    body('price').isFloat({ min: 0 }),
    body('category').isIn([
      'laptop',
      'desktop',
      'gpu',
      'cpu',
      'ram',
      'storage',
      'monitor',
      'peripheral',
      'other',
    ]),
    body('condition').isIn(['new', 'used', 'refurbished']),
    body('location').trim().escape(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { title, description, price, category, condition, images, location, specs } = req.body;

      const listing = await listingRepository.create({
        title: plainText(title, 512),
        description: plainText(description, 12000),
        price,
        category,
        condition,
        images: Array.isArray(images) ? images.map((u) => plainText(u, 2048)).filter(Boolean) : [],
        location: plainText(location, 255),
        specs: sanitizeSpecs(specs),
        sellerId: req.user.id,
      });

      res.json(listing);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  }
);

router.put('/:id', auth, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      return res.status(404).json({ message: 'Listing not found' });
    }

    const {
      title,
      description,
      price,
      category,
      condition,
      images,
      location,
      specs,
      isActive,
    } = req.body;

    const patch = {};
    if (title !== undefined) patch.title = plainText(title, 512);
    if (description !== undefined) patch.description = plainText(description, 12000);
    if (price !== undefined) patch.price = price;
    if (category !== undefined) patch.category = category;
    if (condition !== undefined) patch.condition = condition;
    if (images !== undefined) {
      patch.images = Array.isArray(images) ? images.map((u) => plainText(u, 2048)).filter(Boolean) : [];
    }
    if (location !== undefined) patch.location = plainText(location, 255);
    if (specs !== undefined) patch.specs = sanitizeSpecs(specs);
    if (isActive !== undefined) patch.isActive = isActive;

    const listing = await listingRepository.update(id, req.user.id, patch, { isAdmin: req.user.isAdmin });

    if (!listing) {
      return res.status(404).json({ message: 'Listing not found' });
    }

    res.json(listing);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      return res.status(404).json({ message: 'Listing not found' });
    }

    const ok = await listingRepository.remove(id, req.user.id, { isAdmin: req.user.isAdmin });
    if (!ok) {
      return res.status(404).json({ message: 'Listing not found' });
    }

    res.json({ message: 'Listing removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
