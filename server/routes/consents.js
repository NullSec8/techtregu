const express = require('express');
const auth = require('../middleware/auth');
const { getUserConsents, setConsent } = require('../database/auditRepository');
const { asyncHandler } = require('../utils/asyncHandler');

const router = express.Router();

router.get('/', auth, asyncHandler(async (req, res) => {
  const consents = await getUserConsents(req.user.id);
  res.json(consents);
}));

router.post('/', auth, asyncHandler(async (req, res) => {
  const { analytics, marketing } = req.body;
  if (analytics !== undefined) {
    await setConsent(req.user.id, 'analytics', Boolean(analytics));
  }
  if (marketing !== undefined) {
    await setConsent(req.user.id, 'marketing', Boolean(marketing));
  }
  const consents = await getUserConsents(req.user.id);
  res.json({ ok: true, consents });
}));

module.exports = router;