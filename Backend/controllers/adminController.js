// controllers/adminController.js
const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const Admin = require('../models/Admin');
const Psychologist = require('../models/Psychologist');
const Student = require('../models/Student');
const { psychologistProfilePicUpload } = require('../middleware/multerMiddleware');
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
  const { email, password, personalInfo, professionalInfo, contactInfo, permissions, role,profileImage } = req.body;
  if (!contactInfo || !contactInfo.email) {
    return res.status(400).json({ error: "Contact information with an email is required" });
  }

  const profilePicPath = personalInfo.profileImage 
  ? psychologistProfilePicUpload.uploadBase64Image(personalInfo.profileImage)
  : null;
 
  // Create user
  const user = new User({
    email:contactInfo.email,
    password:'123456',
    role: 'psychologist',
    status: 'active',
    createdBy: req.user._id, // Admin who created the psychologist
    creatorModel: 'Admin',
    profileImage:profilePicPath
  });
  await user.save();

  // Create psychologist profile with permissions
  const psychologist = new Psychologist({
    user: user._id,
    
    personalInfo: {
      ...personalInfo,
      profileImage: profilePicPath  // Save profile picture path to psychologist
    },
    professionalInfo,
    contactInfo,
    permissions ,// Store permissions in the
    profileImage:profilePicPath,
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
      profileImage:profilePicPath,
      phoneNumber: psychologist.contactInfo.phoneNumber,
      officeLocation: psychologist.contactInfo.officeLocation,
      permissions: psychologist.permissions,
    }
  });
});

// Get Admin Profile
exports.getAdminProfile = asyncHandler(async (req, res) => {
  const admin = await Admin.findOne({ user: req.user._id })
    .populate('user', '-password');

  if (!admin) {
    res.status(404);
    throw new Error('Admin profile not found');
  }

  res.json({
    name: admin.name,
    email: admin.user.email,
    role: admin.user.role,
    permissions: admin.permissions
  });
});

// Get All Users
exports.getAllUsers = asyncHandler(async (req, res) => {
  const users = await User.find({}, '-password');
  
  const formattedUsers = await Promise.all(users.map(async (user) => {
    let profile;
    switch (user.role) {
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

    return {
      _id: user._id,
      email: user.email,
      role: user.role,
      status: user.status,
      name: profile?.name || profile?.personalInfo?.name || 'N/A',
      createdAt: user.createdAt
    };
  }));

  res.json(formattedUsers);
});

// Get All Psychologists
exports.getPsychologists = asyncHandler(async (req, res) => {
  try {
    const psychologists = await Psychologist.find()
      .populate('user', 'email status');

    console.log('Raw Psychologists:', psychologists.map(p => ({
      _id: p._id,
      personalInfoImage: p.personalInfo?.profileImage,
      userEmail: p.user?.email
    })));

    const formattedPsychologists = psychologists.map(psych => {
      try {
        // Ensure user exists
        if (!psych.user) {
          console.error('Psychologist without user:', psych._id);
          return null;
        }

        // Safe access to profileImage
        const profileImagePath = psych.personalInfo?.profileImage 
          ? psych.personalInfo.profileImage.replace(/\\/g, '/')
          : null;

        return {
          _id: psych._id,
          personalInfo: {
            ...psych.personalInfo,
            profileImage: profileImagePath
          },
          professionalInfo: psych.professionalInfo,
          contactInfo: {
            ...psych.contactInfo,
            email: psych.user.email
          },
          status: psych.user.status,
          availabilitySchedule: psych.availabilitySchedule
        };
      } catch (formatError) {
        console.error('Error formatting psychologist:', formatError);
        return null;
      }
    }).filter(p => p !== null); // Remove any null entries

    res.json(formattedPsychologists);
  } catch (error) {
    console.error('Full getPsychologists Error:', error);
    res.status(500).json({
      message: 'Error retrieving psychologists',
      error: error.message,
      stack: error.stack
    });
  }
});

// Update User Status
exports.updateUserStatus = asyncHandler(async (req, res) => {
  const { userId, status } = req.body;

  if (!['active', 'suspended'].includes(status)) {
    res.status(400);
    throw new Error('Invalid status value');
  }

  const user = await User.findById(userId);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  user.status = status;
  await user.save();

  res.json({
    message: 'User status updated successfully',
    user: {
      _id: user._id,
      email: user.email,
      role: user.role,
      status: user.status
    }
  });
});

// Update Admin Permissions
exports.updateAdminPermissions = asyncHandler(async (req, res) => {
  const { adminId, permissions } = req.body;

  const admin = await Admin.findById(adminId);
  if (!admin) {
    res.status(404);
    throw new Error('Admin not found');
  }

  admin.permissions = permissions;
  await admin.save();

  res.json({
    message: 'Admin permissions updated successfully',
    admin: {
      _id: admin._id,
      permissions: admin.permissions
    }
  });
});

// Update Psychologist Profile (Admin only)
exports.updatePsychologistProfile = asyncHandler(async (req, res) => {
  const { psychologistId } = req.params;
  const { personalInfo, professionalInfo, contactInfo, availabilitySchedule, status } = req.body;

  // Find psychologist
  const psychologist = await Psychologist.findById(contactInfo.email);
  
  if (!psychologist) {
    res.status(404);
    throw new Error('Psychologist not found');
  }

  // Update the fields if provided
  if (personalInfo) psychologist.personalInfo = personalInfo;
  if (professionalInfo) psychologist.professionalInfo = professionalInfo;
  if (contactInfo) psychologist.contactInfo = contactInfo;
  if (availabilitySchedule) psychologist.availabilitySchedule = availabilitySchedule;
  if (status) psychologist.status = status;

  // Save the updated profile
  await psychologist.save();

  res.json({
    message: 'Psychologist profile updated successfully',
    psychologist: {
      psychologistId: psychologist._id,
      userId: psychologist.user,
      personalInfo: psychologist.personalInfo,
      professionalInfo: psychologist.professionalInfo,
      contactInfo: psychologist.contactInfo,
      availabilitySchedule: psychologist.availabilitySchedule,
      status: psychologist.status
    }
  });
});