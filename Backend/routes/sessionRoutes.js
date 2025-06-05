// routes/sessionRoutes.js
const express = require('express');
const router = express.Router();
const { 
  protect, 
  psychologistOnly, 
  studentOnly 
} = require('../middleware/authMiddleware');
const {
  scheduleSession,
  createSession,
  getStudentSessions,
  getPsychologistSessions,
  getUpcomingSessions,
  getPastSessions,
  updateSessionStatus,
  cancelSession,
  rescheduleSession,
  addSessionNotes,
  getAvailableTimeSlots,
  getPsychologistCalendar,


} = require('../controllers/sessionController');

// Psychologist Routes
router.post('/', protect, psychologistOnly, createSession);
router.get('/psychologist/upcoming', protect, psychologistOnly, getUpcomingSessions);
router.get('/psychologist/past', protect, psychologistOnly, getPastSessions);
router.get('/psychologist/all', protect, psychologistOnly, getPsychologistSessions);
router.get('/student/:studentId', protect, psychologistOnly, getStudentSessions);

// Session Management Routes
router.patch('/:sessionId/status', protect, psychologistOnly, updateSessionStatus);
router.patch('/:sessionId/notes', protect, psychologistOnly, addSessionNotes);
router.post('/:sessionId/cancel', protect, cancelSession);
router.post('/:sessionId/reschedule', protect, psychologistOnly, rescheduleSession);

// Student Routes
router.post('/schedule', protect, studentOnly, scheduleSession);
router.get('/student/upcoming', protect, studentOnly, getUpcomingSessions);
router.get('/student/past', protect, studentOnly, getPastSessions);
// Add these routes to sessionRoutes.js

// Get available time slots
router.get('/available-slots', protect, getAvailableTimeSlots);

// Get psychologist calendar
router.get('/psychologist/calendar', protect, psychologistOnly, getPsychologistCalendar);

// New route for bulk updates to availability
//router.put('/psychologist/availability', protect, psychologistOnly, updateAvailability);

// New route for adding availability exceptions
//router.post('/psychologist/availability-exceptions', protect, psychologistOnly, addAvailabilityException);

// Delete availability exception
//router.delete('/psychologist/availability-exceptions/:exceptionId', protect, psychologistOnly, deleteAvailabilityException);

module.exports = router;