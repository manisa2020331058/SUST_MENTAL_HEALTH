// controllers/sessionController.js
const asyncHandler = require('express-async-handler');
const Session = require('../models/Session');
const Student = require('../models/Student');
const Psychologist = require('../models/Psychologist');

// Create a new session
exports.createSession = asyncHandler(async (req, res) => {
  const { studentId, date, startTime } = req.body;

  // Calculate end time (2 hours after start time)
  const startDateTime = new Date(`${date}T${startTime}`);
  const endDateTime = new Date(startDateTime.getTime() + (2 * 60 * 60 * 1000));
  const endTime = endDateTime.toTimeString().slice(0, 5);

  // Check for overlapping sessions
  const hasOverlap = await Session.checkOverlap(
    req.user._id,
    date,
    startTime,
    endTime
  );

  if (hasOverlap) {
    return res.status(400).json({
      message: 'This time slot overlaps with an existing session'
    });
  }

  const session = await Session.create({
    psychologist: req.user._id,
    student: studentId,
    sessionDetails: {
      date,
      startTime,
      endTime,
      duration: 2
    }
  });

  await session.populate([
    { path: 'student', select: 'personalInfo academicInfo' },
    { path: 'psychologist', select: 'personalInfo' }
  ]);

  res.status(201).json(session);
});

// Get all sessions for a psychologist
exports.getPsychologistSessions = asyncHandler(async (req, res) => {
  const { status, timeframe } = req.query;
  const query = { psychologist: req.user._id };

  // Filter by status if provided
  if (status) {
    query.status = status;
  }

  // Filter by timeframe
  const currentDate = new Date();
  if (timeframe === 'upcoming') {
    query['sessionDetails.date'] = { $gte: currentDate };
  } else if (timeframe === 'past') {
    query['sessionDetails.date'] = { $lt: currentDate };
  }

  const sessions = await Session.find(query)
    .populate('student', 'personalInfo academicInfo contactInfo')
    .sort({ 'sessionDetails.date': 1, 'sessionDetails.startTime': 1 });

  // Group sessions by date
  const groupedSessions = sessions.reduce((acc, session) => {
    const date = session.sessionDetails.date.toISOString().split('T')[0];
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(session);
    return acc;
  }, {});

  res.json(groupedSessions);
});

// Get all sessions for a student
exports.getStudentSessions = asyncHandler(async (req, res) => {
  const { status, timeframe } = req.query;
  const query = { student: req.user._id };

  // Filter by status if provided
  if (status) {
    query.status = status;
  }

  // Filter by timeframe
  const currentDate = new Date();
  if (timeframe === 'upcoming') {
    query['sessionDetails.date'] = { $gte: currentDate };
  } else if (timeframe === 'past') {
    query['sessionDetails.date'] = { $lt: currentDate };
  }

  const sessions = await Session.find(query)
    .populate('psychologist', 'personalInfo contactInfo')
    .sort({ 'sessionDetails.date': 1, 'sessionDetails.startTime': 1 });

  res.json(sessions);
});

// Update session status
exports.updateSessionStatus = asyncHandler(async (req, res) => {
  const { status, feedback } = req.body;
  const session = await Session.findById(req.params.id);

  if (!session) {
    res.status(404);
    throw new Error('Session not found');
  }

  session.status = status;
  if (feedback) {
    session.feedback = feedback;
  }

  const updatedSession = await session.save();
  res.json(updatedSession);
});

// Add session notes
exports.addSessionNotes = asyncHandler(async (req, res) => {
  const { notes } = req.body;
  const session = await Session.findById(req.params.id);

  if (!session) {
    res.status(404);
    throw new Error('Session not found');
  }

  session.notes = notes;
  const updatedSession = await session.save();
  res.json(updatedSession);
});

// Schedule Session
exports.scheduleSession = asyncHandler(async (req, res) => {
  const { student, sessionDetails, notes } = req.body;

  // Check if student exists
  const studentExists = await Student.findById(student);
  if (!studentExists) {
    res.status(404);
    throw new Error('Student not found');
  }

  // Check for existing scheduled sessions
  const existingSession = await Session.findOne({
    student,
    'sessionDetails.date': sessionDetails.date,
    'sessionDetails.time': sessionDetails.time,
    status: 'Scheduled'
  });

  if (existingSession) {
    res.status(400);
    throw new Error('Session already scheduled at this time');
  }

  const session = new Session({
    student,
    psychologist: req.user._id,
    sessionDetails,
    notes
  });

  await session.save();

  // Update student's sessions
  await Student.findByIdAndUpdate(student, {
    $push: { sessions: session._id }
  });

  res.status(201).json(session);
});

// Get Sessions for a Student
exports.getStudentSessionsOld = asyncHandler(async (req, res) => {
  const sessions = await Session.find({ 
    student: req.params.studentId 
  }).sort({ 'sessionDetails.date': -1 });

  res.json(sessions);
});

// Get Psychologist Sessions
exports.getPsychologistSessionsOld = asyncHandler(async (req, res) => {
  const sessions = await Session.find({ 
    psychologist: req.user._id 
  })
  .populate('student', 'personalInfo academicInfo')
  .sort({ 'sessionDetails.date': -1 });

  res.json(sessions);
});

// Update Session Status
exports.updateSessionStatusOld = asyncHandler(async (req, res) => {
  const session = await Session.findByIdAndUpdate(
    req.params.id,
    { 
      status: req.body.status,
      notes: req.body.notes
    },
    { new: true }
  );

  if (!session) {
    res.status(404);
    throw new Error('Session not found');
  }

  res.json(session);
});

// Get Single Session
exports.getSingleSession = asyncHandler(async (req, res) => {
  const session = await Session.findById(req.params.id)
    .populate('student', 'personalInfo academicInfo')
    .populate('psychologist', 'personalInfo contactInfo');

  if (!session) {
    res.status(404);
    throw new Error('Session not found');
  }

  res.json(session);
});

// Cancel Session
exports.cancelSession = asyncHandler(async (req, res) => {
  const session = await Session.findByIdAndUpdate(
    req.params.id,
    { 
      status: 'Cancelled',
      cancellationReason: req.body.reason || 'No reason provided'
    },
    { new: true }
  );

  if (!session) {
    res.status(404);
    throw new Error('Session not found');
  }

  res.json(session);
});

// Reschedule Session
exports.rescheduleSession = asyncHandler(async (req, res) => {
  const { date, time, reason } = req.body;

  // Check for conflicts
  const conflictingSession = await Session.findOne({
    student: req.body.studentId,
    'sessionDetails.date': date,
    'sessionDetails.time': time,
    status: 'Scheduled'
  });

  if (conflictingSession) {
    res.status(400);
    throw new Error('A session is already scheduled at this time');
  }

  const session = await Session.findByIdAndUpdate(
    req.params.id,
    { 
      status: 'Rescheduled',
      'sessionDetails.date': date,
      'sessionDetails.time': time,
      rescheduledReason: reason,
      rescheduledAt: new Date()
    },
    { new: true }
  );

  if (!session) {
    res.status(404);
    throw new Error('Session not found');
  }

  res.json(session);
});