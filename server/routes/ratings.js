const express = require('express');
const { body, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const ratingRepository = require('../database/ratingRepository');
const userRepository = require('../database/userRepository');
const { plainText } = require('../utils/sanitize');

const router = express.Router();

router.get('/seller/:sellerId', async (req, res) => {
  try {
    const sellerId = Number(req.params.sellerId);
    if (Number.isNaN(sellerId)) {
      return res.status(404).json({ message: 'Seller not found' });
    }
    const seller = await userRepository.findById(sellerId);
    if (!seller) {
      return res.status(404).json({ message: 'Seller not found' });
    }
    const [summary, latestReviews] = await Promise.all([
      ratingRepository.getSellerSummary(sellerId),
      ratingRepository.getLatestReviews(sellerId, 6),
    ]);
    res.json({ ...summary, latestReviews });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

router.post(
  '/',
  auth,
  [
    body('sellerId').isInt({ min: 1 }),
    body('rating').isInt({ min: 1, max: 5 }),
    body('comment').optional().isLength({ max: 1000 }).trim(),
    body('listingId').optional().isInt({ min: 1 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const sellerId = Number(req.body.sellerId);
      const myId = Number(req.user.id);
      if (sellerId === myId) {
        return res.status(400).json({ message: 'You cannot rate yourself' });
      }
      const seller = await userRepository.findById(sellerId);
      if (!seller) {
        return res.status(404).json({ message: 'Seller not found' });
      }

      await ratingRepository.upsertReview({
        sellerId,
        reviewerId: req.user.id,
        listingId: req.body.listingId != null ? Number(req.body.listingId) : null,
        rating: Number(req.body.rating),
        comment: plainText(req.body.comment || '', 1000),
      });

      const [summary, latestReviews] = await Promise.all([
        ratingRepository.getSellerSummary(sellerId),
        ratingRepository.getLatestReviews(sellerId, 6),
      ]);
      res.json({ ...summary, latestReviews });
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  }
);

module.exports = router;
