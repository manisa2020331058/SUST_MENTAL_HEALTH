// routes/studentRoutes.js
const express = require('express');
const { 
  getStudentDashboardInfo,
  updateProfilePicture,
  sendMessageToPsychologist,
  getMessagesWithPsychologist,
  verifyPsychologistAssignment
} = require('../controllers/studentController');
const { protect, studentOnly } = require('../middleware/authMiddleware');
const upload = require('../middleware/multerMiddleware'); // Multer upload middleware

const router = express.Router();

// Dashboard Info Route
router.get('/dashboard-info', protect, studentOnly, getStudentDashboardInfo);


// routes/studentRoutes.js
router.get('/verify-psychologist', protect, studentOnly, verifyPsychologistAssignment);
// Messaging Routes
router.post('/messages', protect, studentOnly, sendMessageToPsychologist);
router.get('/messages', protect, studentOnly, getMessagesWithPsychologist);

module.exports = router;