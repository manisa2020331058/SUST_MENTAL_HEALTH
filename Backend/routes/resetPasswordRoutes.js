const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User'); // Central user model

// POST /api/reset-password/reset
router.post('/reset', async (req, res) => {
  const { userId, newPassword } = req.body;

  // Find user
  const user = await User.findById(userId);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }


  // Update password
  user.password = newPassword;
  await user.save();

  res.json({ message: 'Password updated successfully' });
});

module.exports = router;
