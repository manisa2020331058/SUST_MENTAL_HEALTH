const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const Message = require('../models/Message');

// send a message
router.post('/', protect, async (req, res) => {
  try {
    const { recipient, content } = req.body;
    if (!recipient || !content) {
      return res.status(400).json({ message: 'recipient + content required' });
    }
    const message = await Message.create({
      sender:    req.user._id,
      recipient,
      content,
      timestamp: Date.now()
    });
    res.status(201).json(message);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// get conversation with one user
router.get('/:otherId', protect, async (req, res) => {
  try {
    const me = req.user._id.toString();
    const them = req.params.otherId;
    const msgs = await Message.find({
      $or: [
        { sender: me, recipient: them },
        { sender: them, recipient: me }
      ]
    }).sort({ timestamp: 1 });
    res.json(msgs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// mark as read
router.put('/read/:fromId', protect, async (req, res) => {
  try {
    await Message.updateMany(
      { sender: req.params.fromId, recipient: req.user._id, read: false },
      { read: true }
    );
    res.json({ message: 'marked read' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// psychologist: get *all* messages so we can group by student
router.get('/psychologist/all', protect, async (req, res) => {
  try {
    const psychId = req.user._id;
    const msgs = await Message.find({
      $or: [{ sender: psychId }, { recipient: psychId }]
    })
      .sort({ timestamp: 1 })
      .populate('sender', 'name')
      .populate('recipient', 'name');
    res.json(msgs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;