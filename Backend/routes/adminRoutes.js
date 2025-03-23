// routes/adminRoutes.js
const express = require('express');
const { 
  createInitialAdmin,
  enrollPsychologist,
  getAllUsers,
  updateUserStatus,
  createAdmin,
  updateAdminPermissions,
  hasPermission
} = require('../controllers/adminController');
const { 
  loginUser, 
  changePassword,
  getCurrentUserProfile
} = require('../controllers/userController');
const { protect, adminOnly,checkPermission} = require('../middleware/authMiddleware');

const router = express.Router();

// Authentication Routes
router.post('/create-admin', protect, adminOnly, createAdmin);
router.post('/initial-setup', createInitialAdmin);
router.post('/login', loginUser);
router.put('/change-password', protect, adminOnly, changePassword);
router.get('/profile', protect, adminOnly, getCurrentUserProfile);
//update perission
router.put('/admin-permissions', protect, adminOnly, hasPermission('user_management'), updateAdminPermissions);


// User Management Routes
router.get('/users', protect, adminOnly, getAllUsers);
router.post('/psychologists', protect, adminOnly, hasPermission('psychologist_management'),enrollPsychologist);
router.put('/user-status', protect, adminOnly, updateUserStatus);

module.exports = router;