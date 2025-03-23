// routes/adminRoutes.js
const express = require('express');
const { 
  createInitialAdmin,
  enrollPsychologist,
  getAllUsers,
  getPsychologists,
  updateUserStatus,
  createAdmin,
  updateAdminPermissions,
  hasPermission,
  updatePsychologistProfile,
  getAdminProfile
} = require('../controllers/adminController');
const { 
  loginUser, 
  changePassword
} = require('../controllers/userController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

const router = express.Router();

// Authentication Routes
router.post('/initial-setup', createInitialAdmin);
router.post('/login', loginUser);

// Admin Management Routes
router.post('/create-admin', protect, adminOnly, hasPermission('user_management'), createAdmin);
router.get('/profile', protect, adminOnly, getAdminProfile);
router.put('/change-password', protect, adminOnly, changePassword);
router.put('/admin-permissions', protect, adminOnly, hasPermission('user_management'), updateAdminPermissions);

// User Management Routes
router.get('/users', protect, adminOnly, hasPermission('user_management'), getAllUsers);
router.put('/user-status', protect, adminOnly, hasPermission('user_management'), updateUserStatus);

// Psychologist Management Routes
router.get('/psychologists', protect, adminOnly, hasPermission('psychologist_management'), getPsychologists);
router.post('/psychologists', protect, adminOnly, hasPermission('psychologist_management'), enrollPsychologist);
router.put(
  '/psychologists/:psychologistId',
  protect,
  adminOnly,
  hasPermission('psychologist_management'),
  updatePsychologistProfile
);

module.exports = router;