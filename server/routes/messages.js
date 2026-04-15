const express = require('express');
const { body, validationResult } = require('express-validator');
const Message = require('../models/Message');
const auth = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/messages
// @desc    Get user's messages
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const messages = await Message.find({
      $or: [{ sender: req.user.id }, { receiver: req.user.id }]
    })
    .populate('sender', 'username firstName lastName avatar')
    .populate('receiver', 'username firstName lastName avatar')
    .populate('listing', 'title images')
    .sort({ createdAt: -1 });

    res.json(messages);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET /api/messages/conversation/:userId
// @desc    Get conversation with specific user
// @access  Private
router.get('/conversation/:userId', auth, async (req, res) => {
  try {
    const messages = await Message.find({
      $or: [
        { sender: req.user.id, receiver: req.params.userId },
        { sender: req.params.userId, receiver: req.user.id }
      ]
    })
    .populate('sender', 'username firstName lastName avatar')
    .populate('receiver', 'username firstName lastName avatar')
    .populate('listing', 'title images')
    .sort({ createdAt: 1 });

    res.json(messages);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST /api/messages
// @desc    Send message
// @access  Private
router.post('/', auth, [
  body('receiver').isMongoId(),
  body('content').isLength({ min: 1, max: 1000 }).trim(),
  body('listing').optional().isMongoId()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { receiver, content, listing } = req.body;

    const message = new Message({
      sender: req.user.id,
      receiver,
      content,
      listing
    });

    await message.save();
    await message.populate('sender', 'username firstName lastName avatar');
    await message.populate('receiver', 'username firstName lastName avatar');
    if (listing) {
      await message.populate('listing', 'title images');
    }

    res.json(message);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   PUT /api/messages/:id/read
// @desc    Mark message as read
// @access  Private
router.put('/:id/read', auth, async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);

    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Check if user is the receiver
    if (message.receiver.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    message.isRead = true;
    await message.save();

    res.json(message);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;