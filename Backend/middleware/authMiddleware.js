// middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const asyncHandler = require('express-async-handler');
const Admin = require('../models/Admin');



const protect = async (req, res, next) => {
  let token;
  if (
    req.headers.authorization && 
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      req.user = await User.findById(decoded.id).select('-password');
      
      if (!req.user) {
        return res.status(401).json({ message: 'Not authorized' });
      }
      
      next();
    } catch (error) {
      res.status(401).json({ message: 'Not authorized' });
    }
  }

  if (!token) {
    res.status(401).json({ message: 'No token, authorization denied' });
  }
};

const adminOnly = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};

const psychologistOnly = (req, res, next) => {
  if (req.user.role !== 'psychologist') {
    return res.status(403).json({ message: 'Psychologist access required' });
  }
  next();
};

const studentOnly = (req, res, next) => {
  if (req.user.role !== 'student') {
    return res.status(403).json({ message: 'Student access required' });
  }
  next();
};
const checkPermission = (permission) => {
  return (req, res, next) => {
    if (!req.user || !req.user.psychologist) {
      return res.status(403).json({ message: "Access denied" });
    }

    if (!req.user.psychologist.permissions[permission]) {
      return res.status(403).json({ message: `You do not have permission for ${permission}` });
    }

    next();
  };


  
};

module.exports = {
  protect,
  adminOnly,
  psychologistOnly,
  studentOnly,
  checkPermission,
  
};