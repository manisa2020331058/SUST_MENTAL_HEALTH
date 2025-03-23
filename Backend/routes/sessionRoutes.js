// routes/sessionRoutes.js
const express = require('express');
const router = express.Router();
const { 
  protect, 
  psychologistOnly, 
  studentOnly 
} = require('../middleware/authMiddleware');
const { checkRole } = require('../middleware/roleMiddleware');
const {
  scheduleSession,
  createSession,
  getStudentSessions,
  getPsychologistSessions,
  updateSessionStatus,
  getSingleSession,
  cancelSession,
  rescheduleSession,
  addSessionNotes
} = require('../controllers/sessionController');

// Schedule a new session (Psychologist only)
router.post('/', protect, psychologistOnly, scheduleSession);

// Create a new session (Psychologist only)
router.post('/create', protect, checkRole(['psychologist']), createSession);

// Get sessions for a specific student (Psychologist only)
router.get('/student/:studentId', protect, psychologistOnly, getStudentSessions);

// Get student's sessions with optional filters
router.get('/student', protect, checkRole(['student']), getStudentSessions);

// Get sessions for a psychologist (Psychologist only)
router.get('/psychologist', protect, psychologistOnly, getPsychologistSessions);

// Get psychologist's sessions with optional filters
router.get('/psychologist/all', protect, checkRole(['psychologist']), getPsychologistSessions);

// Get a single session details
router.get('/:id', protect, getSingleSession);

// Update session status (Psychologist only)
router.put('/:id/status', protect, psychologistOnly, updateSessionStatus);

// Update session status (Psychologist only)
router.patch('/:id/status', protect, checkRole(['psychologist']), updateSessionStatus);

// Cancel a session (Psychologist only)
router.put('/:id/cancel', protect, psychologistOnly, cancelSession);

// Reschedule a session (Psychologist only)
router.put('/:id/reschedule', protect, psychologistOnly, rescheduleSession);

// Add session notes (Psychologist only)
router.patch('/:id/notes', protect, checkRole(['psychologist']), addSessionNotes);

module.exports = router;