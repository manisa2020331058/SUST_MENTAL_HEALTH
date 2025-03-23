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
  getSingleSession,
  cancelSession,
  rescheduleSession,
  addSessionNotes
} = require('../controllers/sessionController');

// Psychologist Routes
router.post('/', protect, psychologistOnly, createSession);
router.get('/psychologist/upcoming', protect, psychologistOnly, getUpcomingSessions);
router.get('/psychologist/past', protect, psychologistOnly, getPastSessions);
router.get('/psychologist/all', protect, psychologistOnly, getPsychologistSessions);
router.get('/student/:studentId', protect, psychologistOnly, getStudentSessions);

// Session Management Routes
router.get('/:sessionId', protect, getSingleSession);
router.patch('/:sessionId/status', protect, psychologistOnly, updateSessionStatus);
router.patch('/:sessionId/notes', protect, psychologistOnly, addSessionNotes);
router.post('/:sessionId/cancel', protect, cancelSession);
router.post('/:sessionId/reschedule', protect, psychologistOnly, rescheduleSession);

// Student Routes
router.post('/schedule', protect, studentOnly, scheduleSession);
router.get('/student/upcoming', protect, studentOnly, getUpcomingSessions);
router.get('/student/past', protect, studentOnly, getPastSessions);


module.exports = router;