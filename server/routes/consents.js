const express = require('express');
const auth = require('../middleware/auth');
const { getUserConsents, setConsent } = require('../database/auditRepository');

const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const consents = await getUserConsents(req.user.id);
    res.json(consents);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { analytics, marketing } = req.body;
    if (analytics !== undefined) {
      await setConsent(req.user.id, 'analytics', Boolean(analytics));
    }
    if (marketing !== undefined) {
      await setConsent(req.user.id, 'marketing', Boolean(marketing));
    }
    const consents = await getUserConsents(req.user.id);
    res.json({ ok: true, consents });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;