// controllers/studentController.js
const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const { studentProfilePicUpload } = require('../middleware/multerMiddleware');

const asyncHandler = require('express-async-handler');
const Student = require('../models/Student');
const Session = require('../models/Session');
const Message = require('../models/Message');
const User = require('../models/User');
const Psychologist = require('../models/Psychologist'); // Added Psychologist model
const { profile } = require('console');
const path = require('path');


// Get Comprehensive Student Profile
// controllers/studentController.js
exports.getStudentDashboardInfo = asyncHandler(async (req, res) => {
  try {
    // req.user._id is the User model ID from the auth token
    const student = await Student.findOne({ user: req.user._id })
      .populate('user', '-password');

    if (!student) {
      return res.status(404).json({ 
        message: 'Student not found',
        studentProfile: null,
        createdBy: null,
        pastSessions: [],
        upcomingSessions: []
      });
    }

    // Find psychologist using the User ID stored in student.createdBy
    let psychologistData = null;
    if (student.createdBy) {
      // student.createdBy contains the User ID of the psychologist
      const psychologist = await Psychologist.findOne({ user: student.createdBy })
        .populate('user', 'email');
      
      if (psychologist) {
        psychologistData = {
          psychologistId: psychologist._id,
          profileImage: psychologist.personalInfo?.profileImage,
          userId: psychologist.user._id,
          name: psychologist.personalInfo?.name,
          specialization: psychologist.professionalInfo?.specialization,
          email: psychologist.user?.email,
          phoneNumber: psychologist.contactInfo?.phoneNumber,
          officeLocation: psychologist.contactInfo?.officeLocation
        };
      }
    }

    // Get sessions using the Student model ID (student._id)
    const sessions = await Session.find({ student: student._id })
      .populate({
        path: 'psychologist',
        select: 'personalInfo contactInfo user',
        populate: {
          path: 'user',
          select: 'email'
        }
      });

    const currentDate = new Date();
    
    // Map sessions to a consistent format
    const formattedSessions = sessions.map(session => {
      // Extract start time and calculate end time based on duration
      const startTime = session.time || '00:00';
      const duration = session.duration || 60; // Default to 60 minutes
      
      // Calculate end time
      const [hours, minutes] = startTime.split(':').map(Number);
      const endTime = new Date(0, 0, 0, hours, minutes + duration);
      const formattedEndTime = `${String(endTime.getHours()).padStart(2, '0')}:${String(endTime.getMinutes()).padStart(2, '0')}`;
      
      return {
        sessionId: session._id,
        psychologist: {
          psychologistId: session.psychologist?._id,
          userId: session.psychologist?.user?._id,
          name: session.psychologist?.personalInfo?.name,
          email: session.psychologist?.user?.email
        },
        sessionDetails: {
          date: session.date,
          startTime: startTime,
          endTime: formattedEndTime,
          duration: duration,
          type: session.type
        },
        status: session.status,
        notes: session.notes,
        feedback: session.feedback
      };
    });
    
    // Split into past and upcoming sessions
    const pastSessions = formattedSessions.filter(session => 
      new Date(session.sessionDetails.date) < currentDate
    );
    
    const upcomingSessions = formattedSessions.filter(session => 
      new Date(session.sessionDetails.date) >= currentDate
    );

    // Include all relevant IDs in the response
    const responseData = {
      studentProfile: {
        studentId: student._id,
        userId: student.user._id,
        personalInfo: student.personalInfo || {},
        academicInfo: student.academicInfo || {},
        contactInfo: student.contactInfo || {},
        status: student.status || 'Active'
      },
      createdBy: psychologistData,
      pastSessions: pastSessions,
      upcomingSessions: upcomingSessions
    };

    res.json(responseData);
  } catch (error) {
    console.error('Error in getStudentDashboardInfo:', error);
    res.status(500).json({
      message: 'Error fetching dashboard information',
      error: error.message
    });
  }
});
// Update Profile Picture
exports.updateProfilePicture = asyncHandler(async (req, res) => {
  // Check if base64 image is uploaded
  if (!req.body.personalInfo.profileImage) {
    return res.status(400).json({ 
      error: 'No profile image provided' 
    });
  }

  // Find student
  const student = await Student.findOne({ user: req.user._id });

  if (!student) {
    return res.status(404).json({ 
      error: 'Student not found' 
    });
  }

  try {
    // Upload base64 image
    const profilePicPath = studentProfilePicUpload.uploadBase64Image(req.body.personalInfo.profileImage);

    if (!profilePicPath) {
      return res.status(400).json({ 
        error: 'Failed to upload profile picture' 
      });
    }

    // Ensure personalInfo exists before assigning profileImage
    if (!student.personalInfo) {
      student.personalInfo = {}; 
    }
    
    student.personalInfo.profileImage = profilePicPath;
    await student.save();

    // Update user profile image if needed
    const user = await User.findById(student.user);
    if (user) {
      user.profileImage = profilePicPath;
      await user.save();
    }

    res.status(200).json({
      message: 'Profile picture updated successfully',
      profileImage: profilePicPath
    });
  } catch (error) {
    console.error('Profile Picture Upload Error:', error);

    res.status(500).json({ 
      error: 'Failed to upload profile picture',
      details: error.message 
    });
  }
});



// In studentController.js or a separate utility file
exports.verifyPsychologistAssignment = asyncHandler(async (req, res) => {
  const student = await Student.findOne({ user: req.user._id });

  if (!student) {
    return res.status(404).json({ message: 'Student not found' });
  }

  console.log('Student Assigned Psychologist:', student.createdBy);

  // Direct database check
  const directCheck = await Student.findById(student._id)
    .select('assignedPsychologist')
    .populate('assignedPsychologist');

  console.log('Direct Check Result:', directCheck);

  res.json({
    assignedPsychologistId: student.createdBy,
    directCheckResult: directCheck
  });
});

exports.removeProfilePicture = asyncHandler(async (req, res) => {
  try {
    // Find student
    const student = await Student.findOne({ user: req.user._id });

    if (!student) {
      return res.status(404).json({ 
        message: 'Student not found' 
      });
    }

    // Check if there's an existing profile picture
    if (student.personalInfo.profileImage) {
      // Optional: Remove the physical file
      const fullPath = path.join(process.cwd(), student.personalInfo.profileImage);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }

      // Clear profile picture in database
      student.personalInfo.profileImage = null;
      await student.save();
    }

    res.json({
      message: 'Profile picture removed successfully',
      profilePicture: null
    });
  } catch (error) {
    console.error('Remove Profile Picture Error:', error);
    res.status(500).json({ 
      message: 'Failed to remove profile picture',
      error: error.message 
    });
  }
});

// controllers/studentController.js - Add this function

// Get upcoming session notifications
exports.getSessionNotifications = asyncHandler(async (req, res) => {
  try {
    const student = await Student.findOne({ user: req.user._id });
    
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    
    // Get upcoming sessions in the next 24 hours
    const tomorrow = new Date();
    tomorrow.setHours(tomorrow.getHours() + 24); // 24 hours from now
    
    const upcomingSessions = await Session.find({
      student: student._id,
      date: { $gte: new Date(), $lte: tomorrow },
      status: 'scheduled'
    }).populate({
      path: 'psychologist',
      select: 'personalInfo contactInfo'
    }).sort({ date: 1 });
    
    // Format sessions with proper details
    const notifications = upcomingSessions.map(session => {
      // Format date and time for easy display
      const sessionDate = new Date(session.date);
      const formattedDate = sessionDate.toLocaleDateString();
      
      // Calculate time until session
      const now = new Date();
      const hoursUntilSession = Math.floor((sessionDate - now) / (1000 * 60 * 60));
      const minutesUntilSession = Math.floor(((sessionDate - now) % (1000 * 60 * 60)) / (1000 * 60));
      
      return {
        sessionId: session._id,
        title: `Upcoming Session with ${session.psychologist.personalInfo?.name || 'your psychologist'}`,
        date: formattedDate,
        time: session.time,
        type: session.type,
        location: session.psychologist.contactInfo?.officeLocation || 'Online',
        psychologistName: session.psychologist.personalInfo?.name,
        contactInfo: session.psychologist.contactInfo,
        timeUntil: {
          hours: hoursUntilSession,
          minutes: minutesUntilSession,
          text: `${hoursUntilSession} hours and ${minutesUntilSession} minutes`
        }
      };
    });
    
    res.json({
      count: notifications.length,
      notifications
    });
  } catch (error) {
    console.error('Error fetching session notifications:', error);
    res.status(500).json({ 
      message: 'Error fetching session notifications',
      error: error.message
    });
  }
});