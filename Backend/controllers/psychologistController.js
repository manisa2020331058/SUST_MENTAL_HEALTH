// controllers/psychologistController.js
const asyncHandler = require('express-async-handler');
const Psychologist = require('../models/Psychologist');
const Student = require('../models/Student');
const Session = require('../models/Session');
const User = require('../models/User');

// Get Psychologist Profile
exports.getPsychologistProfile = asyncHandler(async (req, res) => {
  const psychologist = await Psychologist.findOne({ user: req.user._id })
    .populate('user', '-password');
  
  if (!psychologist) {
    res.status(404);
    throw new Error('Psychologist profile not found');
  }

  const response = {
    psychologistId: psychologist._id,
    userId: psychologist.user._id,
    personalInfo: psychologist.personalInfo,
    professionalInfo: psychologist.professionalInfo,
    contactInfo: psychologist.contactInfo,
    availabilitySchedule: psychologist.availabilitySchedule,
    status: psychologist.user.status,
    email: psychologist.user.email
  };

  res.json(response);
});

// Get Psychologist's Students
exports.getPsychologistStudents = asyncHandler(async (req, res) => {
  const psychologist = await Psychologist.findOne({ user: req.user._id });
  
  if (!psychologist) {
    res.status(404);
    throw new Error('Psychologist not found');
  }

  const students = await Student.find({ createdBy: req.user._id })
    .populate('user', 'email status');

  const formattedStudents = students.map(student => ({
    studentId: student._id,
    userId: student.user._id,
    personalInfo: student.personalInfo,
    academicInfo: student.academicInfo,
    contactInfo: {
      ...student.contactInfo,
      email: student.user.email
    },
    status: student.user.status,
    mentalHealthHistory: student.mentalHealthHistory,
    createdAt: student.createdAt
  }));

  res.json(formattedStudents);
});

// Update Psychologist Profile
exports.updateProfile = asyncHandler(async (req, res) => {
  const psychologist = await Psychologist.findOne({ user: req.user._id });
  
  if (!psychologist) {
    res.status(404);
    throw new Error('Psychologist not found');
  }

  const { personalInfo, professionalInfo, contactInfo } = req.body;

  if (personalInfo) psychologist.personalInfo = personalInfo;
  if (professionalInfo) psychologist.professionalInfo = professionalInfo;
  if (contactInfo) psychologist.contactInfo = contactInfo;

  await psychologist.save();

  res.json({
    message: 'Profile updated successfully',
    psychologist: {
      psychologistId: psychologist._id,
      personalInfo: psychologist.personalInfo,
      professionalInfo: psychologist.professionalInfo,
      contactInfo: psychologist.contactInfo
    }
  });
});

// Update Availability Schedule
exports.updateAvailability = asyncHandler(async (req, res) => {
  const psychologist = await Psychologist.findOne({ user: req.user._id });
  
  if (!psychologist) {
    res.status(404);
    throw new Error('Psychologist not found');
  }

  const { availabilitySchedule } = req.body;

  // Validate availability schedule
  if (!availabilitySchedule || !Array.isArray(availabilitySchedule)) {
    res.status(400);
    throw new Error('Invalid availability schedule format');
  }

  psychologist.availabilitySchedule = availabilitySchedule;
  await psychologist.save();

  res.json({
    message: 'Availability schedule updated successfully',
    availabilitySchedule: psychologist.availabilitySchedule
  });
});

// Get Upcoming Sessions
exports.getUpcomingSessions = asyncHandler(async (req, res) => {
  const psychologist = await Psychologist.findOne({ user: req.user._id });
  
  if (!psychologist) {
    res.status(404);
    throw new Error('Psychologist not found');
  }

  const sessions = await Session.find({
    psychologist: psychologist._id,
    status: 'scheduled',
    date: { $gte: new Date() }
  }).populate({
    path: 'student',
    populate: {
      path: 'user',
      select: 'email status'
    }
  }).sort({ date: 1 });

  const formattedSessions = sessions.map(session => ({
    sessionId: session._id,
    date: session.date,
    time: session.time,
    type: session.type,
    status: session.status,
    student: {
      id: session.student._id,
      name: session.student.personalInfo.name,
      email: session.student.user.email,
      status: session.student.user.status
    },
    notes: session.notes
  }));

  res.json(formattedSessions);
});

// Get Past Sessions
exports.getPastSessions = asyncHandler(async (req, res) => {
  const psychologist = await Psychologist.findOne({ user: req.user._id });
  
  if (!psychologist) {
    res.status(404);
    throw new Error('Psychologist not found');
  }

  const sessions = await Session.find({
    psychologist: psychologist._id,
    $or: [
      { status: 'completed' },
      { date: { $lt: new Date() } }
    ]
  }).populate({
    path: 'student',
    populate: {
      path: 'user',
      select: 'email status'
    }
  }).sort({ date: -1 });

  const formattedSessions = sessions.map(session => ({
    sessionId: session._id,
    date: session.date,
    time: session.time,
    type: session.type,
    status: session.status,
    student: {
      id: session.student._id,
      name: session.student.personalInfo.name,
      email: session.student.user.email,
      status: session.student.user.status
    },
    notes: session.notes
  }));

  res.json(formattedSessions);
});

// Enroll New Student
exports.enrollStudent = asyncHandler(async (req, res) => {
  const psychologist = await Psychologist.findOne({ user: req.user._id });
  
  if (!psychologist) {
    res.status(404);
    throw new Error('Psychologist not found');
  }

  const { personalInfo, academicInfo, contactInfo } = req.body;

  // Create user account for student
  const user = new User({
    email: contactInfo.email,
    password: Math.random().toString(36).slice(-8), // Generate random password
    role: 'student',
    status: 'active'
  });
  await user.save();

  // Create student profile
  const student = new Student({
    user: user._id,
    personalInfo,
    academicInfo,
    contactInfo,
    createdBy: req.user._id
  });
  await student.save();

  res.status(201).json({
    message: 'Student enrolled successfully',
    student: {
      studentId: student._id,
      userId: user._id,
      personalInfo: student.personalInfo,
      academicInfo: student.academicInfo,
      contactInfo: student.contactInfo
    }
  });
});
