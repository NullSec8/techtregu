const express = require('express');
const { body, validationResult } = require('express-validator');
const messageRepository = require('../database/messageRepository');
const auth = require('../middleware/auth');
const { plainText } = require('../utils/sanitize');

const router = express.Router();

router.get('/unread-count', auth, async (req, res) => {
  try {
    const count = await messageRepository.countUnreadForUser(req.user.id);
    res.json({ count });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/conversation/:userId/read', auth, async (req, res) => {
  try {
    const other = parseInt(req.params.userId, 10);
    if (Number.isNaN(other)) {
      return res.status(400).json({ message: 'Invalid user id' });
    }
    await messageRepository.markConversationRead(req.user.id, other);
    res.json({ ok: true });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/', auth, async (req, res) => {
  try {
    const messages = await messageRepository.findForUser(req.user.id);
    res.json(messages);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

router.get('/conversation/:userId', auth, async (req, res) => {
  try {
    const other = parseInt(req.params.userId, 10);
    if (Number.isNaN(other)) {
      return res.status(400).json({ message: 'Invalid user id' });
    }
    const messages = await messageRepository.findConversation(req.user.id, other);
    res.json(messages);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

router.post(
  '/',
  auth,
  [
    body('receiver').isInt(),
    body('content').isLength({ min: 1, max: 1000 }).trim(),
    body('listing').optional().isInt(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { receiver, content, listing } = req.body;

      const message = await messageRepository.create({
        senderId: req.user.id,
        receiverId: Number(receiver),
        listingId: listing != null ? Number(listing) : null,
        content: plainText(content, 1000),
      });

      const io = req.app.get('io');
      if (io) {
        io.to(String(receiver)).emit('message:new', { message });
      }

      res.json(message);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  }
);

router.put('/:id/read', auth, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      return res.status(404).json({ message: 'Message not found' });
    }

    const ok = await messageRepository.markRead(id, req.user.id);
    if (!ok) {
      return res.status(404).json({ message: 'Message not found' });
    }

    const message = await messageRepository.findById(id);
    res.json(message);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
