// middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Admin = require('../models/Admin');
const asyncHandler = require('express-async-handler');

// Protect routes - verify JWT token
const protect = asyncHandler(async (req, res, next) => {
  let token;
  
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      req.user = await User.findById(decoded.id).select('-password');
      
      if (!req.user) {
        res.status(401);
        throw new Error('Not authorized');
      }
      
      next();
    } catch (error) {
      res.status(401);
      throw new Error('Not authorized');
    }
  }

  if (!token) {
    res.status(401);
    throw new Error('Not authorized, no token');
  }
});

// Admin only middleware
const adminOnly = asyncHandler(async (req, res, next) => {
  if (req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Access denied. Admin only.');
  }
  next();
});

// Psychologist only middleware
const psychologistOnly = asyncHandler(async (req, res, next) => {
  if (req.user.role !== 'psychologist') {
    res.status(403);
    throw new Error('Access denied. Psychologist only.');
  }
  next();
});

// Student only middleware
const studentOnly = asyncHandler(async (req, res, next) => {
  if (req.user.role !== 'student') {
    res.status(403);
    throw new Error('Access denied. Student only.');
  }
  next();
});

// Check specific admin permission
const hasPermission = (requiredPermission) => {
  return asyncHandler(async (req, res, next) => {
    if (req.user.role !== 'admin') {
      res.status(403);
      throw new Error('Access denied. Admin only.');
    }

    const admin = await Admin.findOne({ user: req.user._id });
    if (!admin) {
      res.status(403);
      throw new Error('Admin profile not found.');
    }

    if (!admin.permissions.includes(requiredPermission)) {
      res.status(403);
      throw new Error('You do not have permission to perform this action.');
    }

    next();
  });
};

module.exports = {
  protect,
  adminOnly,
  psychologistOnly,
  studentOnly,
  hasPermission
};