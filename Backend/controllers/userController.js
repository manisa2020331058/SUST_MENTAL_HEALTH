// controllers/userController.js
const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const Admin = require('../models/Admin');
const Psychologist = require('../models/Psychologist');
const Student = require('../models/Student');
const jwt = require('jsonwebtoken');

// Generate JWT Token
const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: '30d'
  });
};
//login handeling

exports.loginUser = asyncHandler(async (req, res) => {
  const { email, password, role } = req.body;

  // Validate role is provided
  if (!role) {
    res.status(400);
    throw new Error('Role is required');
  }

  // Find user
  const user = await User.findOne({ email, role });
  if (!user) {
    res.status(401);
    throw new Error('Invalid credentials or role');
  }

  // Check password
  const isMatch = await user.matchPassword(password);
  if (!isMatch) {
    res.status(401);
    throw new Error('Invalid credentials');
  }

  // Check user status
  if (user.status !== 'active') {
    res.status(403);
    throw new Error('User account is not active');
  }

  // Update last login
  user.lastLogin = Date.now();
  await user.save();

  // Generate token
  const token = generateToken(user._id, user.role);

  // Fetch additional profile based on role
  let profile;
  switch(user.role) {
    case 'admin':
      profile = await Admin.findOne({ user: user._id });
      break;
    case 'psychologist':
      profile = await Psychologist.findOne({ user: user._id });
      break;
    case 'student':
      profile = await Student.findOne({ user: user._id });
      break;
  }

  res.json({
    _id: user._id,
    email: user.email,
    role: user.role,
    profile: profile,
    token
  });
});
// Change Password
exports.changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  // Find user
  const user = await User.findById(req.user._id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  // Verify current password
  const isMatch = await user.matchPassword(currentPassword);
  if (!isMatch) {
    res.status(400);
    throw new Error('Current password is incorrect');
  }

  // Update password
  user.password = newPassword;
  await user.save();

  res.json({ message: 'Password updated successfully' });
});

// Get Current User Profile
exports.getCurrentUserProfile = asyncHandler(async (req, res) => {
  let profile;
  switch(req.user.role) {
    case 'admin':
      profile = await Admin.findOne({ user: req.user._id });
      break;
    case 'psychologist':
      profile = await Psychologist.findOne({ user: req.user._id });
      break;
    case 'student':
      profile = await Student.findOne({ user: req.user._id });
      break;
  }

  if (!profile) {
    res.status(404);
    throw new Error('Profile not found');
  }

  res.json(profile);
});