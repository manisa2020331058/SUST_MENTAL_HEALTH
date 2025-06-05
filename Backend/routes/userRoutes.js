// routes/userRoutes.js
const express = require('express');
const { 
  loginUser, 
  changePassword,
  getCurrentUserProfile
} = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Public Routes
router.post('/login', loginUser);//api/users/login

// Protected Routes
router.put('/change-password', protect, changePassword);
router.get('/profile', protect, getCurrentUserProfile);

module.exports = router;