const express = require('express');
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const messageRepository = require('../database/messageRepository');
const auth = require('../middleware/auth');
const { plainText } = require('../utils/sanitize');
const { analyzeContent } = require('../../shared/contentModeration');
const { asyncHandler } = require('../utils/asyncHandler');

const router = express.Router();
/**
 * @openapi
 * /api/messages:
 *   get:
 *     tags: [Messages]
 *     summary: Get user's messages
 *     description: Returns all conversations and messages for the authenticated user. Requires authentication.
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Array of messages
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Message'
 *       401:
 *         description: Not authenticated
 *
 *   post:
 *     tags: [Messages]
 *     summary: Send a message
 *     description: Send a new message to another user. Requires authentication.
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
 *               - receiver
 *               - content
 *             properties:
 *               receiver:
 *                 type: integer
 *                 description: Recipient user ID
 *               content:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 1000
 *                 description: Message content
 *               listing:
 *                 type: integer
 *                 description: Optional related listing ID
 *     responses:
 *       200:
 *         description: Message sent
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Message'
 *       400:
 *         description: Validation error, self-message, or content flagged
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Blocked user
 *
 * @openapi
 * /api/messages/conversation/{userId}:
 *   get:
 *     tags: [Messages]
 *     summary: Get conversation with a user
 *     description: Get the full message conversation between the authenticated user and another user. Requires authentication.
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The other user's ID
 *     responses:
 *       200:
 *         description: Array of messages in the conversation
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Message'
 *       400:
 *         description: Invalid user ID
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Conversation unavailable (blocked)
 *
 * @openapi
 * /api/messages/{id}/read:
 *   put:
 *     tags: [Messages]
 *     summary: Mark message as read
 *     description: Mark a specific message as read. Only the recipient can mark a message as read. Requires authentication.
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Message ID
 *     responses:
 *       200:
 *         description: Message marked as read
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Message'
 *       401:
 *         description: Not authenticated
 *       404:
 *         description: Message not found
 *
 * @openapi
 * /api/messages/blocks/{userId}:
 *   post:
 *     tags: [Messages]
 *     summary: Block a user
 *     description: Block another user from sending you messages. Requires authentication.
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID to block
 *     responses:
 *       200:
 *         description: User blocked
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *       400:
 *         description: Invalid user ID or cannot block self
 *       401:
 *         description: Not authenticated
 *
 *   delete:
 *     tags: [Messages]
 *     summary: Unblock a user
 *     description: Remove a block on another user. Requires authentication.
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID to unblock
 *     responses:
 *       200:
 *         description: User unblocked
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *       400:
 *         description: Invalid user ID
 *       401:
 *         description: Not authenticated
 *
 * @openapi
 * /api/messages/relationship/{userId}:
 *   get:
 *     tags: [Messages]
 *     summary: Check block relationship
 *     description: Check the block relationship between the authenticated user and another user. Requires authentication.
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The other user's ID
 *     responses:
 *       200:
 *         description: Block relationship status
 *       401:
 *         description: Not authenticated
 *
 * @openapi
 * /api/messages/blocks:
 *   get:
 *     tags: [Messages]
 *     summary: List blocked users
 *     description: Get a list of all users blocked by the authenticated user. Requires authentication.
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: List of blocked users
 *       401:
 *         description: Not authenticated
 *
 * @openapi
 * /api/messages/unread-count:
 *   get:
 *     tags: [Messages]
 *     summary: Get unread message count
 *     description: Get the count of unread messages for the authenticated user. Requires authentication.
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Unread count
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 count:
 *                   type: integer
 *       401:
 *         description: Not authenticated
 *
 * @openapi
 * /api/messages/conversation/{userId}/read:
 *   put:
 *     tags: [Messages]
 *     summary: Mark conversation as read
 *     description: Mark all messages in a conversation as read. Requires authentication.
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The other user's ID
 *     responses:
 *       200:
 *         description: Conversation marked as read
 *       400:
 *         description: Invalid user ID
 *       401:
 *         description: Not authenticated
 *
 * @openapi
 * /api/messages/conversation/{userId}:
 *   delete:
 *     tags: [Messages]
 *     summary: Delete conversation
 *     description: Delete the entire conversation with another user. Requires authentication.
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The other user's ID
 *     responses:
 *       200:
 *         description: Conversation deleted
 *       400:
 *         description: Invalid user ID
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Cannot delete conversation with blocked user
 */

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
      listingId: listing !== null && listing !== undefined ? Number(listing) : null,
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
