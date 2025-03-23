// controllers/sessionController.js
const asyncHandler = require('express-async-handler');
const Session = require('../models/Session');
const Student = require('../models/Student');
const Psychologist = require('../models/Psychologist');

// Create a new session
exports.createSession = asyncHandler(async (req, res) => {
  const { studentId, date, time, type, description, duration } = req.body;

  // Validate student exists
  const student = await Student.findById(studentId);
  if (!student) {
    res.status(404);
    throw new Error('Student not found');
  }

  // Get psychologist
  const psychologist = await Psychologist.findOne({ user: req.user._id });
  if (!psychologist) {
    res.status(404);
    throw new Error('Psychologist not found');
  }

  const session = await Session.create({
    student: studentId,
    psychologist: psychologist._id,
    date,
    time,
    type,
    description,
    duration,
    status: 'scheduled'
  });

  await session.populate([
    { path: 'student', select: 'personalInfo' },
    { path: 'psychologist', select: 'personalInfo' }
  ]);

  res.status(201).json(session);
});

// Get upcoming sessions for psychologist
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
    select: 'personalInfo contactInfo user',
    populate: { path: 'user', select: 'email status' }
  }).sort({ date: 1, time: 1 });

  res.json(sessions);
});

// Get past sessions for psychologist
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
    select: 'personalInfo contactInfo user',
    populate: { path: 'user', select: 'email status' }
  }).sort({ date: -1, time: -1 });

  res.json(sessions);
});

// Get all sessions for a psychologist with filters
exports.getPsychologistSessions = asyncHandler(async (req, res) => {
  const psychologist = await Psychologist.findOne({ user: req.user._id });
  if (!psychologist) {
    res.status(404);
    throw new Error('Psychologist not found');
  }

  const { status, startDate, endDate } = req.query;
  const query = { psychologist: psychologist._id };

  if (status) query.status = status;
  if (startDate || endDate) {
    query.date = {};
    if (startDate) query.date.$gte = new Date(startDate);
    if (endDate) query.date.$lte = new Date(endDate);
  }

  const sessions = await Session.find(query)
    .populate({
      path: 'student',
      select: 'personalInfo contactInfo user',
      populate: { path: 'user', select: 'email status' }
    })
    .sort({ date: -1, time: -1 });

  res.json(sessions);
});

// Get sessions for a specific student
exports.getStudentSessions = asyncHandler(async (req, res) => {
  const { studentId } = req.params;
  const psychologist = await Psychologist.findOne({ user: req.user._id });
  
  if (!psychologist) {
    res.status(404);
    throw new Error('Psychologist not found');
  }

  const sessions = await Session.find({
    student: studentId,
    psychologist: psychologist._id
  }).sort({ date: -1, time: -1 });

  res.json(sessions);
});

// Get a single session
exports.getSingleSession = asyncHandler(async (req, res) => {
  const session = await Session.findById(req.params.sessionId)
    .populate('student', 'personalInfo contactInfo')
    .populate('psychologist', 'personalInfo contactInfo');

  if (!session) {
    res.status(404);
    throw new Error('Session not found');
  }

  res.json(session);
});

// Update session status
exports.updateSessionStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const session = await Session.findById(req.params.sessionId);

  if (!session) {
    res.status(404);
    throw new Error('Session not found');
  }

  if (!['scheduled', 'completed', 'cancelled', 'no-show'].includes(status)) {
    res.status(400);
    throw new Error('Invalid status');
  }

  session.status = status;
  await session.save();

  res.json(session);
});

// Add session notes
exports.addSessionNotes = asyncHandler(async (req, res) => {
  const { notes } = req.body;
  const session = await Session.findById(req.params.sessionId);

  if (!session) {
    res.status(404);
    throw new Error('Session not found');
  }

  session.notes = notes;
  await session.save();

  res.json(session);
});

// Cancel session
exports.cancelSession = asyncHandler(async (req, res) => {
  const session = await Session.findById(req.params.sessionId);

  if (!session) {
    res.status(404);
    throw new Error('Session not found');
  }

  session.status = 'cancelled';
  session.cancellationReason = req.body.reason;
  await session.save();

  res.json(session);
});

// Reschedule session
exports.rescheduleSession = asyncHandler(async (req, res) => {
  const { date, time } = req.body;
  const session = await Session.findById(req.params.sessionId);

  if (!session) {
    res.status(404);
    throw new Error('Session not found');
  }

  session.date = date;
  session.time = time;
  session.status = 'scheduled';
  await session.save();

  res.json(session);
});

// Schedule a new session (for students)
exports.scheduleSession = asyncHandler(async (req, res) => {
  const { psychologistId, date, time, type, description } = req.body;

  // Find student
  const student = await Student.findOne({ user: req.user._id });
  if (!student) {
    res.status(404);
    throw new Error('Student not found');
  }

  // Find psychologist
  const psychologist = await Psychologist.findById(psychologistId);
  if (!psychologist) {
    res.status(404);
    throw new Error('Psychologist not found');
  }

  // Check if psychologist is available
  const isAvailable = await psychologist.isAvailable(date, time);
  if (!isAvailable) {
    res.status(400);
    throw new Error('Psychologist is not available at this time');
  }

  // Create session
  const session = await Session.create({
    student: student._id,
    psychologist: psychologistId,
    date,
    time,
    type: type || 'individual',
    description,
    duration: 60, // Default duration
    status: 'scheduled'
  });

  await session.populate([
    { path: 'student', select: 'personalInfo' },
    { path: 'psychologist', select: 'personalInfo' }
  ]);

  res.status(201).json(session);
});

