// routes/studentRoutes.js
const express = require('express');
const studentController = require('../controllers/studentController');
const { protect, studentOnly } = require('../middleware/authMiddleware');
const upload = require('../middleware/multerMiddleware'); // Multer upload middleware
const router = express.Router();

// Dashboard Info Route
router.get('/dashboard-info', protect, studentOnly, studentController.getStudentDashboardInfo);
router.post('/profile-picture', protect, studentOnly, studentController.updateProfilePicture);
router.delete('/profile-picture', protect, studentOnly, studentController.removeProfilePicture);
router.get('/verify-psychologist', protect, studentOnly, studentController.verifyPsychologistAssignment);
// Get student profile


// Add new routes for session notifications
router.get('/session-notifications', protect, studentOnly, studentController.getSessionNotifications);

module.exports = router;