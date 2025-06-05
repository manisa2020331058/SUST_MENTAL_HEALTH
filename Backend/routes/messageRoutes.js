const express = require('express');
const router = express.Router();
const { protect, psychologistOnly } = require('../middleware/authMiddleware');
const Message = require('../models/Message');

// Get messages between two users
router.get('/:recipientId', protect, async (req, res) => {
  try {
    const messages = await Message.find({
      $or: [
        { sender: req.user._id, recipient: req.params.recipientId },
        { sender: req.params.recipientId, recipient: req.user._id }
      ]
    }).sort({ timestamp: 1 });
    
    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Mark messages as read
router.put('/read/:senderId', protect, async (req, res) => {
  try {
    await Message.updateMany(
      { sender: req.params.senderId, recipient: req.user._id, read: false },
      { read: true }
    );
    res.json({ message: 'Messages marked as read' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/psychologist/messages', protect, async (req, res) => {
    try {
      // Get the current user's ID (psychologist)
      const psychologistId = req.user._id;
  
      // Find all messages where the psychologist is either sender or recipient
      const messages = await Message.find({
        $or: [
          { sender: psychologistId },
          { recipient: psychologistId }
        ]
      })
      .sort({ createdAt: 1 })
      .populate('sender', 'name email')
      .populate('recipient', 'name email');
      console.log('Found messages:', messages);
      
      res.json(messages);
    } catch (error) {
      console.error('Error fetching psychologist messages:', error);
      res.status(500).json({ message: error.message });
    }
  });
  module.exports = router;