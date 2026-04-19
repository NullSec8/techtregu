const express = require('express');
const { body, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const reportRepository = require('../database/reportRepository');
const listingRepository = require('../database/listingRepository');
const { plainText } = require('../utils/sanitize');

const router = express.Router();

function requireAdmin(req, res, next) {
  if (!req.user?.isAdmin) {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
}

router.post(
  '/',
  auth,
  [body('listingId').isInt({ min: 1 }), body('reason').isLength({ min: 8, max: 1200 }).trim()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const listingId = Number(req.body.listingId);
      const listing = await listingRepository.findByIdRaw(listingId);
      if (!listing) {
        return res.status(404).json({ message: 'Listing not found' });
      }
      if (listing.seller_id === req.user.id) {
        return res.status(400).json({ message: 'You cannot report your own listing' });
      }
      if (!listing.is_active) {
        return res.status(400).json({ message: 'This listing is no longer active' });
      }
      const existing = await reportRepository.findDuplicate(listingId, req.user.id);
      if (existing) {
        return res.status(400).json({ message: 'You have already reported this listing' });
      }
      const report = await reportRepository.create({
        listingId,
        reporterId: req.user.id,
        reason: plainText(req.body.reason, 1200),
      });
      res.json(report);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  }
);

router.get('/admin/open', auth, requireAdmin, async (_req, res) => {
  try {
    const reports = await reportRepository.listOpen();
    res.json(reports);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

router.put('/:id/resolve', auth, requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      return res.status(404).json({ message: 'Report not found' });
    }
    const ok = await reportRepository.resolve(id, req.user.id);
    if (!ok) {
      return res.status(404).json({ message: 'Report not found' });
    }
    const report = await reportRepository.findById(id);
    res.json(report);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
