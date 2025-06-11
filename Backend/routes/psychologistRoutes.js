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

const Psychologist = require('../models/Psychologist'); // Import Psychologist model
const User = require('../models/User'); // Import User model
const Student = require('../models/Student'); // Import Student model
const Session = require('../models/Session'); // Import Session model

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


// add email route
router.get('/email/:email', protect, psychologistOnly, async (req, res) => {
  const email = req.params.email;
  try {
    const psychologist = await Psychologist.findOne({ 'contactInfo.email': email });
    if (!psychologist) {
      return res.status(404).json({ message: 'Psychologist not found' });
    }
    res.json(psychologist);
  } catch (error) {
    console.error('Error fetching psychologist by email:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// add students route
router.get('/getStudents/:psychologistId', protect, psychologistOnly, async (req, res) => {
  try {
    const psychologistId = req.params.psychologistId;


    if (!psychologistId) {
      return res.status(400).json({ message: 'Psychologist ID is required' });
    }

    // Step 1: Get students created by this psychologist
    const userStudents = await Student.find({createdBy: psychologistId });

    // Step 2: Fetch detailed student info
    const formattedStudents = await Promise.all(
      userStudents.map(async (user, index) => {

        return {
          id: index + 1,
          name: user?.personalInfo?.name || 'Unknown',
          email: user?.contactInfo?.email,
          enrollDate: user?.createdAt?.toISOString().split('T')[0] || 'N/A',
          status: user?.academicInfo?.department || 'N/A',
        };
      })
    );

    res.status(200).json(formattedStudents);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error while fetching students' });
  }
});

// add sessions route
router.get('/getSessions/:psychologistId', protect, psychologistOnly, async (req, res) => {
  try {
    const psychologistId = req.params.psychologistId;

    //console.log('Fetching sessions for psychologist1:', psychologistId);

    if (!psychologistId || psychologistId === 'null') {
      return res.status(400).json({ message: 'Valid psychologist ID is required' });
    }

    const sessions = await Session.find({ psychologist: psychologistId });

    //console.log('Fetched sessions:', sessions.length);
    if (sessions.length === 0) {
      return res.status(404).json({ message: 'No sessions found for this psychologist' });
    }

    const formattedSessions = await Promise.all(
      sessions.map(async (session, index) => {
        // Fetch student name
        const student = await Student.findById(session.student);

        return {
          id: index + 1,
          studentId: session.student.toString(),
          studentName: student?.personalInfo?.name || 'Unknown',
          date: session.date?.toISOString().split('T')[0] || 'N/A',
          time: new Date(`1970-01-01T${session.time}+06:00`).toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
            timeZone: 'Asia/Dhaka'
          }),
          duration: session.duration,
          type: session.type,
          status: session.status
        };
           
      })
    );

    res.status(200).json(formattedSessions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error while fetching sessions' });
  }
});




module.exports = router;
