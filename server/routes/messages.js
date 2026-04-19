const express = require('express');
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const messageRepository = require('../database/messageRepository');
const auth = require('../middleware/auth');
const { plainText } = require('../utils/sanitize');

const router = express.Router();

const messageLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { message: 'Too many messages, try again in a minute' },
  standardHeaders: true,
  legacyHeaders: false,
});

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
    const rel = await messageRepository.getBlockRelationship(req.user.id, other);
    if (rel.blockedByMe || rel.blockedMe) {
      return res.status(403).json({ message: 'This conversation is unavailable because one user has blocked the other.' });
    }
    const messages = await messageRepository.findConversation(req.user.id, other);
    res.json(messages);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

router.get('/relationship/:userId', auth, async (req, res) => {
  try {
    const other = parseInt(req.params.userId, 10);
    if (Number.isNaN(other)) {
      return res.status(400).json({ message: 'Invalid user id' });
    }
    const rel = await messageRepository.getBlockRelationship(req.user.id, other);
    res.json(rel);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/blocks', auth, async (req, res) => {
  try {
    const users = await messageRepository.listBlockedUsers(req.user.id);
    res.json(users);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/blocks/:userId', auth, async (req, res) => {
  try {
    const other = parseInt(req.params.userId, 10);
    if (Number.isNaN(other) || other <= 0) {
      return res.status(400).json({ message: 'Invalid user id' });
    }
    if (other === req.user.id) {
      return res.status(400).json({ message: 'You cannot block yourself' });
    }
    await messageRepository.blockUser(req.user.id, other);
    res.json({ ok: true });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/blocks/:userId', auth, async (req, res) => {
  try {
    const other = parseInt(req.params.userId, 10);
    if (Number.isNaN(other)) {
      return res.status(400).json({ message: 'Invalid user id' });
    }
    await messageRepository.unblockUser(req.user.id, other);
    res.json({ ok: true });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/conversation/:userId', auth, async (req, res) => {
  try {
    const other = parseInt(req.params.userId, 10);
    if (Number.isNaN(other)) {
      return res.status(400).json({ message: 'Invalid user id' });
    }
    const rel = await messageRepository.getBlockRelationship(req.user.id, other);
    if (rel.blockedByMe || rel.blockedMe) {
      return res.status(403).json({ message: 'Cannot delete conversation with blocked user' });
    }
    const myId = Number(req.user.id);
    await messageRepository.deleteConversation(myId, other);
    res.json({ ok: true });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post(
  '/',
  auth,
  messageLimiter,
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
      const receiverId = Number(receiver);

      if (receiverId === req.user.id) {
        return res.status(400).json({ message: 'You cannot send a message to yourself' });
      }

      const rel = await messageRepository.getBlockRelationship(req.user.id, receiverId);
      if (rel.blockedByMe || rel.blockedMe) {
        return res.status(403).json({ message: 'Cannot send message because one user has blocked the other.' });
      }

      const message = await messageRepository.create({
        senderId: req.user.id,
        receiverId,
        listingId: listing != null ? Number(listing) : null,
        content: plainText(content, 1000),
      });

      const io = req.app.get('io');
      if (io) {
        io.to(String(receiverId)).emit('message:new', { message });
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
