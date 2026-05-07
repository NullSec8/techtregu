const express = require('express');
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const messageRepository = require('../database/messageRepository');
const auth = require('../middleware/auth');
const { plainText } = require('../utils/sanitize');
const { analyzeContent } = require('../../shared/contentModeration');
const { asyncHandler, AppError } = require('../utils/asyncHandler');

const router = express.Router();

const messageLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  message: { message: 'Too many messages, try again in a minute' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.get('/unread-count', auth, asyncHandler(async (req, res) => {
  const count = await messageRepository.countUnreadForUser(req.user.id);
  res.json({ count });
}));

router.put('/conversation/:userId/read', auth, asyncHandler(async (req, res) => {
  const other = parseInt(req.params.userId, 10);
  if (Number.isNaN(other)) {
    return res.status(400).json({ message: 'Invalid user id' });
  }
  await messageRepository.markConversationRead(req.user.id, other);
  res.json({ ok: true });
}));

router.get('/', auth, asyncHandler(async (req, res) => {
  const messages = await messageRepository.findForUser(req.user.id);
  res.json(messages);
}));

router.get('/conversation/:userId', auth, asyncHandler(async (req, res) => {
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
}));

router.get('/relationship/:userId', auth, asyncHandler(async (req, res) => {
  const other = parseInt(req.params.userId, 10);
  if (Number.isNaN(other)) {
    return res.status(400).json({ message: 'Invalid user id' });
  }
  const rel = await messageRepository.getBlockRelationship(req.user.id, other);
  res.json(rel);
}));

router.get('/blocks', auth, asyncHandler(async (req, res) => {
  const users = await messageRepository.listBlockedUsers(req.user.id);
  res.json(users);
}));

router.post('/blocks/:userId', auth, asyncHandler(async (req, res) => {
  const other = parseInt(req.params.userId, 10);
  if (Number.isNaN(other) || other <= 0) {
    return res.status(400).json({ message: 'Invalid user id' });
  }
  if (other === req.user.id) {
    return res.status(400).json({ message: 'You cannot block yourself' });
  }
  await messageRepository.blockUser(req.user.id, other);
  res.json({ ok: true });
}));

router.delete('/blocks/:userId', auth, asyncHandler(async (req, res) => {
  const other = parseInt(req.params.userId, 10);
  if (Number.isNaN(other)) {
    return res.status(400).json({ message: 'Invalid user id' });
  }
  await messageRepository.unblockUser(req.user.id, other);
  res.json({ ok: true });
}));

router.delete('/conversation/:userId', auth, asyncHandler(async (req, res) => {
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
}));

router.post(
  '/',
  auth,
  messageLimiter,
  [
    body('receiver').isInt(),
    body('content').isLength({ min: 1, max: 1000 }).trim(),
    body('listing').optional().isInt(),
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { receiver, content, listing } = req.body;
    const receiverId = Number(receiver);

    if (receiverId === req.user.id) {
      return res.status(400).json({ message: 'You cannot send a message to yourself' });
    }

    const contentCheck = analyzeContent('', content);
    if (contentCheck.isSuspicious) {
      return res.status(400).json({ message: 'Message content flagged. Please follow community guidelines.' });
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

    const userRepo = require('../database/userRepository');
    const sender = await userRepo.findById(req.user.id);
    const senderName = sender ? `${sender.first_name} ${sender.last_name}`.trim() || sender.username : 'Someone';
    
    if (io) {
      io.to(String(receiverId)).emit('notification', {
        type: 'new_message',
        senderId: req.user.id,
        senderName,
        preview: content.substring(0, 50),
      });
    }

    res.json(message);
  })
);

router.put('/:id/read', auth, asyncHandler(async (req, res) => {
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
}));

module.exports = router;
