// routes/psychologistRoutes.js
const express = require('express');
const { 
  getPsychologistProfile,
  updateProfile,
  updateAvailability,
  getPsychologistStudents,
  getUpcomingSessions,
  getPastSessions,
  enrollStudent
} = require('../controllers/psychologistController');
const { protect, psychologistOnly } = require('../middleware/authMiddleware');

const router = express.Router();

// Profile Routes
router.get('/profile', protect, psychologistOnly, getPsychologistProfile);
router.put('/profile', protect, psychologistOnly, updateProfile);
router.put('/availability', protect, psychologistOnly, updateAvailability);

// Student Routes
router.get('/students', protect, psychologistOnly, getPsychologistStudents);
router.post('/students/enroll', protect, psychologistOnly, enrollStudent);

// Session Routes
router.get('/sessions/upcoming', protect, psychologistOnly, getUpcomingSessions);
router.get('/sessions/past', protect, psychologistOnly, getPastSessions);

module.exports = router;
