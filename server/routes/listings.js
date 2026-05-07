const express = require('express');
const fs = require('fs');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const { fromBuffer } = require('file-type');
const listingRepository = require('../database/listingRepository');
const auth = require('../middleware/auth');
const { upload, uploadsDir } = require('../middleware/listingImageUpload');
const { optimizeImage, generateThumbnails } = require('../middleware/imageOptimizer');
const { plainText, sanitizeSpecs } = require('../utils/sanitize');
const { analyzeContent } = require('../../shared/contentModeration');
const { asyncHandler, AppError } = require('../utils/asyncHandler');

const router = express.Router();
/**
 * @openapi
 * /api/listings:
 *   get:
 *     tags: [Listings]
 *     summary: List all listings
 *     description: Retrieve a paginated list of active listings with optional filtering, searching, and sorting.
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 12
 *         description: Items per page
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [laptop, desktop, gpu, cpu, ram, storage, monitor, peripheral, other]
 *         description: Filter by category
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for title/description
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *         description: Minimum price filter
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *         description: Maximum price filter
 *       - in: query
 *         name: condition
 *         schema:
 *           type: string
 *           enum: [new, used, refurbished]
 *         description: Filter by condition
 *       - in: query
 *         name: location
 *         schema:
 *           type: string
 *         description: Filter by location
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *         description: Sort field and direction
 *     responses:
 *       200:
 *         description: Paginated list of listings
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 listings:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Listing'
 *                 totalPages:
 *                   type: integer
 *                 currentPage:
 *                   type: integer
 *                 total:
 *                   type: integer
 *
 * @openapi
 * /api/listings/{id}:
 *   get:
 *     tags: [Listings]
 *     summary: Get a listing by ID
 *     description: Retrieve the full details of a single listing by its ID.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Listing ID
 *       - in: query
 *         name: track
 *         schema:
 *           type: string
 *           enum: ['1']
 *         description: Set to '1' with a Referer header to track a view
 *     responses:
 *       200:
 *         description: Listing details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Listing'
 *       404:
 *         description: Listing not found
 *
 *   post:
 *     tags: [Listings]
 *     summary: Create a new listing
 *     description: Create a new tech product listing. Requires authentication.
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *               - price
 *               - category
 *               - condition
 *               - location
 *             properties:
 *               title:
 *                 type: string
 *                 minLength: 3
 *                 description: Listing title
 *               description:
 *                 type: string
 *                 minLength: 10
 *                 description: Detailed description of the item
 *               price:
 *                 type: number
 *                 minimum: 0.01
 *                 maximum: 999999
 *                 description: Price in USD
 *               category:
 *                 type: string
 *                 enum: [laptop, desktop, gpu, cpu, ram, storage, monitor, peripheral, other]
 *               condition:
 *                 type: string
 *                 enum: [new, used, refurbished]
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of image URLs (upload first via POST /api/listings/images)
 *               location:
 *                 type: string
 *                 maxLength: 64
 *                 description: Location/city of the item
 *               specs:
 *                 type: object
 *                 description: Product specifications as key-value pairs
 *     responses:
 *       200:
 *         description: Listing created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Listing'
 *       400:
 *         description: Validation error or content flagged
 *       401:
 *         description: Not authenticated
 *
 *   put:
 *     tags: [Listings]
 *     summary: Update a listing
 *     description: Update an existing listing. Only the owner or an admin can update. Requires authentication.
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Listing ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *                 minimum: 0.01
 *                 maximum: 999999
 *               category:
 *                 type: string
 *                 enum: [laptop, desktop, gpu, cpu, ram, storage, monitor, peripheral, other]
 *               condition:
 *                 type: string
 *                 enum: [new, used, refurbished]
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *               location:
 *                 type: string
 *               specs:
 *                 type: object
 *               isActive:
 *                 type: boolean
 *                 description: Only admins can change visibility
 *               isSold:
 *                 type: boolean
 *                 description: Mark as sold
 *     responses:
 *       200:
 *         description: Listing updated
 *       400:
 *         description: Validation error
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Forbidden (not owner or admin)
 *       404:
 *         description: Listing not found
 *
 *   delete:
 *     tags: [Listings]
 *     summary: Delete a listing
 *     description: Delete a listing. Only the owner or an admin can delete. Requires authentication.
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Listing ID
 *     responses:
 *       200:
 *         description: Listing removed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       401:
 *         description: Not authenticated
 *       404:
 *         description: Listing not found
 *
 * @openapi
 * /api/listings/images:
 *   post:
 *     tags: [Listings]
 *     summary: Upload listing images
 *     description: Upload up to 8 images for a listing. Returns an array of URLs that can be used when creating or updating a listing. Requires authentication.
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
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Image files (JPEG, PNG, GIF, WebP, AVIF) - max 8 files
 *     responses:
 *       200:
 *         description: Images uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 urls:
 *                   type: array
 *                   items:
 *                     type: string
 *                   description: Array of uploaded image URLs
 *       400:
 *         description: Upload failed or invalid file type
 *       401:
 *         description: Not authenticated
 *
 * @openapi
 * /api/listings/admin/all:
 *   get:
 *     tags: [Listings]
 *     summary: List all listings (admin)
 *     description: Get all listings including inactive ones. Requires admin authentication.
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *       - in: query
 *         name: sellerId
 *         schema:
 *           type: integer
 *       - in: query
 *         name: active
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Paginated list of all listings
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Admin access required
 *
 * @openapi
 * /api/listings/admin/stats:
 *   get:
 *     tags: [Listings]
 *     summary: Get listing statistics (admin)
 *     description: Get aggregate statistics about listings. Requires admin authentication.
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Listing statistics
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Admin access required
 */

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

function sanitizeUploadedImageUrls(input) {
  if (!Array.isArray(input)) return [];
  const seen = new Set();
  return input
    .map((u) => plainText(u, 2048))
    .filter((u) => {
      if (typeof u !== 'string') return false;
      if (u.startsWith('/uploads/') && u.match(/^\/uploads\/[a-zA-Z0-9_-]+\.(jpg|jpeg|png|gif|webp|avif)$/i)) {
        if (seen.has(u)) return false;
        seen.add(u);
        return true;
      }
      if (u.match(/^https:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\//i)) {
        if (seen.has(u)) return false;
        seen.add(u);
        return true;
      }
      if (u.match(/^https:\/\/images\.unsplash\.com\/[a-zA-Z0-9_-]+\.(jpg|jpeg|png|gif|webp)$/i)) {
        if (seen.has(u)) return false;
        seen.add(u);
        return true;
      }
      return false;
    });
}

router.get('/', asyncHandler(async (req, res) => {
  const { category, search, minPrice, maxPrice, condition, location, sortBy, page = 1, limit = 12 } =
    req.query;

  const { listings, total, page: p, limit: lim } = await listingRepository.findMany({
    category,
    search,
    minPrice,
    maxPrice,
    condition,
    location,
    sortBy,
    page,
    limit,
  });

  res.json({
    listings,
    totalPages: Math.ceil(total / lim),
    currentPage: p,
    total,
  });
}));

router.get('/admin/all', auth, requireAdmin, asyncHandler(async (req, res) => {
  const { page: rawPage = 1, limit: rawLimit = 50, sellerId, active } = req.query;
  const page = Math.max(1, parseInt(rawPage, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(rawLimit, 10) || 50));
  const result = await listingRepository.findAllForAdmin({ page, limit, sellerId, active });
  res.json({
    ...result,
    totalPages: Math.ceil(result.total / result.limit),
    currentPage: result.page,
  });
}));

router.get('/admin/stats', auth, requireAdmin, asyncHandler(async (_req, res) => {
  const stats = await listingRepository.getAdminStats();
  res.json(stats);
}));

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
  asyncHandler(async (req, res) => {
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

        try {
          const ext = file.originalname.split('.').pop()?.toLowerCase() || 'jpg';
          const baseName = file.filename.replace(/\.[^.]+$/, '');
          const optPath = `${uploadsDir}/${baseName}_opt.${ext}`;

          const result = await optimizeImage(file.path, optPath, {
            quality: 80,
            format: 'jpeg',
          });

          if (result.saved > 0) {
            fs.unlinkSync(file.path);
            const thumbPath = await generateThumbnails(optPath);
            if (thumbPath) {
              console.log(`[ImageOptim] Thumbnail created: ${thumbPath}`);
            }
            file.filename = `${baseName}_opt.${ext}`;
          }
        } catch (optErr) {
          console.error('[ImageOptim] Skip optimization:', optErr.message);
        }
      }
      const urls = files.map((f) => `/uploads/${f.filename}`);
      res.json({ urls });
    } catch {
      for (const f of files) {
        try {
          fs.unlinkSync(f.path);
        } catch {
          // ignore
        }
      }
      throw new AppError('Upload verification failed', 500);
    }
  })
);

router.get('/:id', asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (Number.isNaN(id)) {
    return res.status(404).json({ message: 'Listing not found' });
  }

  const listing = await listingRepository.findById(id);
  if (!listing) {
    return res.status(404).json({ message: 'Listing not found' });
  }

  const shouldTrackView = req.query.track === '1' && req.get('referer');
  if (shouldTrackView) {
    await listingRepository.incrementViews(id);
  }

  res.json(listing);
}));

router.post(
  '/',
  auth,
  [
    body('title').isLength({ min: 3 }).trim().escape(),
    body('description').isLength({ min: 10 }).trim(),
    body('price').isFloat({ min: 0.01, max: 999999 }),
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
    body('location').isLength({ min: 2, max: 64 }),
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, description, price, category, condition, images, location, specs } = req.body;
    const safeImages = sanitizeUploadedImageUrls(images);
    if (images && Array.isArray(images) && safeImages.length !== images.length) {
      return res.status(400).json({ message: 'Only uploaded images are allowed. Please upload files from your device.' });
    }

    const contentCheck = analyzeContent(title, description);
    if (contentCheck.isSuspicious) {
      return res.status(400).json({ message: 'This listing has been flagged for review. Please ensure your listing follows our community guidelines.' });
    }
    if (!contentCheck.isTech) {
      return res.status(400).json({ message: 'This does not appear to be a tech product. TechTregu is for computer hardware only.' });
    }

    const listing = await listingRepository.create({
      title: plainText(title, 512),
      description: plainText(description, 12000),
      price,
      category,
      condition,
      images: safeImages,
      location: plainText(location, 64),
      specs: sanitizeSpecs(specs),
      sellerId: req.user.id,
    });

    res.json(listing);
  })
);

router.put('/:id', auth, asyncHandler(async (req, res) => {
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
    isSold,
  } = req.body;

  const patch = {};
  if (title !== undefined) patch.title = plainText(title, 512);
  if (description !== undefined) patch.description = plainText(description, 12000);
  if (price !== undefined) {
    const p = Number(price);
    if (isNaN(p) || p <= 0 || p > 999999) {
      return res.status(400).json({ message: 'Invalid price' });
    }
    patch.price = p;
  }
  if (category !== undefined) patch.category = category;
  if (condition !== undefined) patch.condition = condition;
  if (images !== undefined) {
    const safeImages = sanitizeUploadedImageUrls(images);
    if (Array.isArray(images) && safeImages.length !== images.length) {
      return res.status(400).json({ message: 'Only uploaded images are allowed. Please upload files from your device.' });
    }
    patch.images = safeImages;
  }
  if (location !== undefined) patch.location = plainText(location, 64);
  if (specs !== undefined) patch.specs = sanitizeSpecs(specs);
  if (isSold !== undefined) {
    patch.isSold = Boolean(isSold);
    patch.isActive = isSold ? false : patch.isActive;
  }
  if (isActive !== undefined) {
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Only admins can change listing visibility' });
    }
    patch.isActive = isActive;
  }

  const listing = await listingRepository.update(id, req.user.id, patch, { isAdmin: req.user.isAdmin });

  if (!listing) {
    return res.status(404).json({ message: 'Listing not found' });
  }

  res.json(listing);
}));

router.delete('/:id', auth, asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (Number.isNaN(id)) {
    return res.status(404).json({ message: 'Listing not found' });
  }

  const ok = await listingRepository.remove(id, req.user.id, { isAdmin: req.user.isAdmin });
  if (!ok) {
    return res.status(404).json({ message: 'Listing not found' });
  }

  res.json({ message: 'Listing removed' });
}));

module.exports = router;
