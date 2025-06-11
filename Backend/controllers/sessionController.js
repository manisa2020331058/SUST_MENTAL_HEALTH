
// controllers/sessionController.js
const asyncHandler = require('express-async-handler');
const Session = require('../models/Session');
const Student = require('../models/Student');
const Psychologist = require('../models/Psychologist');

// All other controller functions follow...

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
    select: 'personalInfo academicInfo contactInfo user',
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
    select: 'personalInfo academicInfo contactInfo user',
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
  const notes  = req.body.notes;
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

  // Update student's counseling history
  if (!student.counselingHistory.assignedPsychologist) {
    student.counselingHistory.assignedPsychologist = psychologistId;
    student.counselingHistory.startDate = new Date();
  }
  student.counselingHistory.nextSessionDate = new Date(date);

  await student.save();

  res.status(201).json(session);
});

// Get calendar view for psychologist
exports.getPsychologistCalendar = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  
  if (!startDate || !endDate) {
    res.status(400);
    throw new Error('Start date and end date are required');
  }
  
  const psychologist = await Psychologist.findOne({ user: req.user._id });
  if (!psychologist) {
    res.status(404);
    throw new Error('Psychologist not found');
  }
  
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  // Get all sessions in date range
  const sessions = await Session.find({
    psychologist: psychologist._id,
    date: { $gte: start, $lte: end },
    status: { $ne: 'cancelled' }
  }).populate('student', 'personalInfo');
  
  // Format for calendar view
  const calendarEvents = sessions.map(session => ({
    id: session._id,
    title: `Session with ${session.student?.personalInfo?.name || 'Student'}`,
    start: `${session.date.toISOString().split('T')[0]}T${session.time}`,
    end: (() => {
      const [hours, minutes] = session.time.split(':').map(Number);
      const endTime = new Date(session.date);
      endTime.setHours(hours, minutes, 0, 0);
      endTime.setMinutes(endTime.getMinutes() + session.duration);
      return `${endTime.toISOString().split('T')[0]}T${String(endTime.getHours()).padStart(2, '0')}:${String(endTime.getMinutes()).padStart(2, '0')}`;
    })(),
    studentId: session.student._id,
    status: session.status,
    type: session.type
  }));
  
  res.json(calendarEvents);
});

//  the createSession method to check availability
exports.createSession = asyncHandler(async (req, res) => {
  const { studentId, date, time, type, description, duration = 60 } = req.body;

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

  // Check availability
  const isAvailable = await psychologist.isAvailable(date, time, duration);
  if (!isAvailable) {
    res.status(400);
    throw new Error('This time slot is not available');
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

// In sessionController.js
exports.getAvailableTimeSlots = asyncHandler(async (req, res) => {
  const { psychologistId, date } = req.query;
  
  if (!date) {
    res.status(400);
    throw new Error('Date is required');
  }
  
  // If psychologistId is not provided, use the logged-in user's psychologist record
  let psychologist;
  
  if (psychologistId) {
    psychologist = await Psychologist.findById(psychologistId);
  } else {
    psychologist = await Psychologist.findOne({ user: req.user._id });
  }
  
  if (!psychologist) {
    res.status(404);
    throw new Error('Psychologist not found');
  }
  
  // Get available slots using the psychologist's method
  const availableSlots = await psychologist.getAvailableTimeSlots(date);
  
  res.json({
    psychologistId: psychologist._id,
    date,
    availableSlots
  });
});
// Add session feedback
exports.addSessionFeedback = asyncHandler(async (req, res) => {
  const { rating, comment } = req.body;
  
  if (!rating || rating < 1 || rating > 5) {
    res.status(400);
    throw new Error('Rating is required and must be between 1 and 5');
  }

  const session = await Session.findById(req.params.sessionId);
  if (!session) {
    res.status(404);
    throw new Error('Session not found');
  }

  // Verify student is providing feedback on their own session
  const student = await Student.findOne({ user: req.user._id });
  if (!student || !student._id.equals(session.student)) {
    res.status(403);
    throw new Error('Not authorized to provide feedback for this session');
  }

  session.feedback = {
    rating,
    comment,
    submittedAt: new Date()
  };

  await session.save();
  res.json(session);
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