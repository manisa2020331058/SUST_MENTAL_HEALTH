// controllers/adminController.js
const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const Admin = require('../models/Admin');
const Psychologist = require('../models/Psychologist');
const Student = require('../models/Student');

// Create Initial Admin (One-time setup)
exports.createInitialAdmin = asyncHandler(async (req, res) => {
  const { email, password, name } = req.body;

  // Check if first admin already exists
  const existingAdmin = await User.findOne({ role: 'admin' });
  if (existingAdmin) {
    res.status(400);
    throw new Error('Initial admin already exists');
  }

  // Create user
  const user = new User({
    email,
    password,
    role: 'admin',
    status: 'active'
  });
  await user.save();

  // Assign all permissions to the first admin
  const admin = new Admin({
    user: user._id,
    name,
    permissions: ['user_management', 'psychologist_management', 'report_generation'] // Full permissions
  });
  await admin.save();

  res.status(201).json({ message: 'Initial admin created successfully' });
});


// Create Additional Admin
exports.createAdmin = asyncHandler(async (req, res) => {
  const { email, password, name } = req.body;

  // Check if the user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    res.status(400);
    throw new Error('User with this email already exists');
  }

  // Create user with admin role
  const user = new User({
    email,
    password,
    role: 'admin',
    status: 'active',
    createdBy: req.user._id,
    creatorModel: 'Admin'
  });
  await user.save();

  // Assign limited permissions by default
  const admin = new Admin({
    user: user._id,
    name,
    permissions: [] // No permissions by default
  });
  await admin.save();

  res.status(201).json({ message: 'New admin created successfully with limited permissions' });
});

exports.hasPermission = (requiredPermission) => {
  return asyncHandler(async (req, res, next) => {
    // Check if the user is an admin
    if (req.user.role !== 'admin') {
      res.status(403);
      throw new Error('Access denied. Only admins can perform this action.');
    }

    // Get admin details
    const admin = await Admin.findOne({ user: req.user._id });

    if (!admin) {
      res.status(403);
      throw new Error('Admin profile not found.');
    }

    // Check if the admin has the required permission
    if (!admin.permissions.includes(requiredPermission)) {
      res.status(403);
      throw new Error('You do not have permission to perform this action.');
    }

    next(); // Proceed to the next middleware
  });
};

// Enroll Psychologist
exports.enrollPsychologist = asyncHandler(async (req, res) => {
  const { email, password, personalInfo, professionalInfo, contactInfo, permissions } = req.body;

  // Check if psychologist already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    res.status(400);
    throw new Error('Psychologist with this email already exists');
  }

  // Create user
  const user = new User({
    email,
    password,
    role: 'psychologist',
    status: 'active',
    createdBy: req.user._id, // Admin who created the psychologist
    creatorModel: 'Admin'
  });
  await user.save();

  // Create psychologist profile with permissions
  const psychologist = new Psychologist({
    user: user._id,
    personalInfo,
    professionalInfo,
    contactInfo,
    permissions // Store permissions in the database
  });
  await psychologist.save();

  res.status(201).json({ 
    message: 'Psychologist enrolled successfully',
    psychologist: {
      name: psychologist.personalInfo.name,
      gender: psychologist.personalInfo.gender,
      dateOfBirth: psychologist.personalInfo.dateOfBirth,
      specialization: psychologist.professionalInfo.specialization,
      qualifications: psychologist.professionalInfo.qualifications,
      yearsOfExperience: psychologist.professionalInfo.yearsOfExperience,
      email: psychologist.contactInfo.email,
      phoneNumber: psychologist.contactInfo.phoneNumber,
      officeLocation: psychologist.contactInfo.officeLocation,
      permissions: psychologist.permissions
    }
  });
});

exports.updateAdminPermissions = asyncHandler(async (req, res) => {
  const { adminId, permissions } = req.body;

  const admin = await Admin.findById(adminId);
  if (!admin) {
    res.status(404);
    throw new Error('Admin not found');
  }

  // Update permissions
  admin.permissions = permissions;
  await admin.save();

  res.json({ message: 'Permissions updated successfully', admin });
});

// Get All Users
exports.getAllUsers = asyncHandler(async (req, res) => {
  const users = await User.find()
    .select('-password')
    .populate({
      path: 'createdBy',
      select: 'name email'
    });
  
  res.json(users);
});

// Update User Status
exports.updateUserStatus = asyncHandler(async (req, res) => {
  const { userId, status } = req.body;

  const user = await User.findByIdAndUpdate(
    userId,
    { status },
    { new: true }
  ).select('-password');

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  res.json(user);
});