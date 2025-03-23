// controllers/psychologistController.js
const asyncHandler = require('express-async-handler');
const Psychologist = require('../models/Psychologist');
const Student = require('../models/Student');
const Session = require('../models/Session');
const User = require('../models/User');

// Get Psychologist Profile
exports.getPsychologistProfile = asyncHandler(async (req, res) => {
  // Find psychologist using User ID from auth token
  const psychologist = await Psychologist.findOne({ user: req.user._id })
    .populate('user', '-password');
  
  if (!psychologist) {
    res.status(404);
    throw new Error('Psychologist profile not found');
  }

  // Return formatted response with both IDs
  const response = {
    psychologistId: psychologist._id,    // Psychologist model ID
    userId: psychologist.user._id,       // User model ID
    personalInfo: psychologist.personalInfo,
    professionalInfo: psychologist.professionalInfo,
    contactInfo: psychologist.contactInfo,
    availabilitySchedule: psychologist.availabilitySchedule,
    status: psychologist.status
  };

  res.json(response);
});

// Get Psychologist's Students
exports.getPsychologistStudents = asyncHandler(async (req, res) => {
  // First get psychologist document to use its model ID
  const psychologist = await Psychologist.findOne({ user: req.user._id });
  
  if (!psychologist) {
    res.status(404);
    throw new Error('Psychologist not found');
  }

  // Find students where createdBy matches psychologist's User ID
  const students = await Student.find({ createdBy: req.user._id })
    .populate('user', 'email');

  // Format response with both IDs
  const formattedStudents = students.map(student => ({
    studentId: student._id,           // Student model ID
    userId: student.user._id,         // User model ID
    personalInfo: student.personalInfo,
    academicInfo: student.academicInfo,
    contactInfo: student.contactInfo,
    status: student.status
  }));

  res.json(formattedStudents);
});

// Get Psychologist Sessions
exports.getPsychologistSessions = asyncHandler(async (req, res) => {
  // First get psychologist document to use its model ID
  const psychologist = await Psychologist.findOne({ user: req.user._id });
  
  if (!psychologist) {
    res.status(404);
    throw new Error('Psychologist not found');
  }

  // Find sessions using Psychologist model ID
  const sessions = await Session.find({ psychologist: psychologist._id })
    .populate({
      path: 'student',
      select: 'personalInfo academicInfo user',
      populate: {
        path: 'user',
        select: 'email'
      }
    });

  // Format sessions with proper ID structure
  const formattedSessions = sessions.map(session => ({
    sessionId: session._id,
    student: {
      studentId: session.student._id,
      userId: session.student.user._id,
      name: session.student.personalInfo?.name,
      registrationNumber: session.student.academicInfo?.registrationNumber,
      email: session.student.user?.email
    },
    sessionDetails: session.sessionDetails,
    status: session.status,
    notes: session.notes,
    feedback: session.feedback
  }));

  res.json(formattedSessions);
});

// Enroll Student
exports.enrollStudent = asyncHandler(async (req, res) => {
  const { personalInfo, academicInfo, contactInfo } = req.body;

  // Check if student with the same email exists
  const existingStudent = await Student.findOne({ 'contactInfo.email': contactInfo.email });
  if (existingStudent) {
    res.status(400);
    throw new Error('Student with this email already exists');
  }

  // Create new student user
  const user = new User({
    email: contactInfo.email,
    password: 'defaultPassword', // You should implement proper password handling
    role: 'student',
    status: 'active',
    createdBy: req.user._id,     // Store psychologist's User ID
    creatorModel: 'Psychologist'
  });
  await user.save();

  // Create new student profile
  const student = new Student({
    user: user._id,              // Reference to User model ID
    personalInfo,
    academicInfo,
    contactInfo,
    createdBy: req.user._id,     // Store psychologist's User ID
    status: 'Active'
  });
  await student.save();

  // Return both IDs in response
  const response = {
    studentId: student._id,      // Student model ID
    userId: user._id,            // User model ID
    message: 'Student enrolled successfully',
    student: {
      personalInfo: student.personalInfo,
      academicInfo: student.academicInfo,
      contactInfo: student.contactInfo,
      status: student.status
    }
  };

  res.status(201).json(response);
});
