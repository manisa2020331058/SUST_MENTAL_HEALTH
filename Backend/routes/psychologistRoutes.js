// routes/psychologistRoutes.js
const express = require('express');
const { 
  getPsychologistProfile,
  updatePsychologistProfile,
  getPsychologistSessions,
  enrollStudent

} = require('../controllers/psychologistController');
const { protect, psychologistOnly } = require('../middleware/authMiddleware');

const router = express.Router();

// Profile Routes
router.route('/profile')
  .get(protect, psychologistOnly, getPsychologistProfile)
  .put(protect, psychologistOnly, updatePsychologistProfile);

// Sessions Route
router.get('/sessions', protect, psychologistOnly, getPsychologistSessions);



module.exports = router;
// Enrollment Route
router.post('/enroll', protect, psychologistOnly, enrollStudent);
