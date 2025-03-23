// controllers/studentController.js
const cloudinary = require('cloudinary').v2;
const fs = require('fs');

const asyncHandler = require('express-async-handler');
const Student = require('../models/Student');
const Session = require('../models/Session');
const Message = require('../models/Message');
const Psychologist = require('../models/Psychologist'); // Added Psychologist model

// Cloudinary Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

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
          psychologistId: psychologist._id,     // Psychologist model ID
          userId: psychologist.user._id,        // User model ID of psychologist
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
      })
      .sort({ 'sessionDetails.date': 1 });

    const currentDate = new Date();
    const pastSessions = sessions.filter(session => 
      new Date(session.sessionDetails.date) < currentDate
    );
    const upcomingSessions = sessions.filter(session => 
      new Date(session.sessionDetails.date) >= currentDate
    );

    // Include all relevant IDs in the response
    const responseData = {
      studentProfile: {
        studentId: student._id,           // Student model ID
        userId: student.user._id,         // User model ID
        personalInfo: student.personalInfo || {},
        academicInfo: student.academicInfo || {},
        contactInfo: student.contactInfo || {},
        profilePicture: student.profilePicture,
        status: student.status || 'Active'
      },
      createdBy: psychologistData,        // Contains both psychologist and user IDs
      pastSessions: pastSessions.map(session => ({
        sessionId: session._id,           // Session model ID
        psychologist: {
          psychologistId: session.psychologist._id,  // Psychologist model ID
          userId: session.psychologist.user._id,     // User model ID
          name: session.psychologist.personalInfo?.name,
          email: session.psychologist.user?.email
        },
        sessionDetails: session.sessionDetails,
        status: session.status,
        notes: session.notes,
        feedback: session.feedback
      })),
      upcomingSessions: upcomingSessions.map(session => ({
        sessionId: session._id,           // Session model ID
        psychologist: {
          psychologistId: session.psychologist._id,  // Psychologist model ID
          userId: session.psychologist.user._id,     // User model ID
          name: session.psychologist.personalInfo?.name,
          email: session.psychologist.user?.email
        },
        sessionDetails: session.sessionDetails,
        status: session.status
      }))
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
  // Check if file is uploaded
  if (!req.file) {
    res.status(400);
    throw new Error('No file uploaded');
  }

  // Find student
  const student = await Student.findOne({ user: req.user._id });

  if (!student) {
    res.status(404);
    throw new Error('Student not found');
  }

  try {
    // Cloudinary upload
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: 'sust-mental-health/student-profiles',
      public_id: `${student._id}_profile_pic`,
      overwrite: true,
      transformation: [
        { width: 500, height: 500, crop: "limit" },
        { quality: "auto" }
      ]
    });

    // Update student profile
    student.profilePicture = result.secure_url;
    await student.save();

    // Remove temporary file
    fs.unlinkSync(req.file.path);

    res.json({
      message: 'Profile picture updated successfully',
      profilePicture: result.secure_url
    });
  } catch (error) {
    // Remove temporary file in case of upload error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    console.error('Cloudinary Upload Error:', error);
    res.status(500);
    throw new Error('Failed to upload profile picture');
  }
});

// Create Message to Psychologist
exports.sendMessageToPsychologist = asyncHandler(async (req, res) => {
  // Validate message content
  const { message } = req.body;
  if (!message || message.trim() === '') {
    res.status(400);
    throw new Error('Message content is required');
  }

  // Find student and check assigned psychologist
  const student = await Student.findOne({ user: req.user._id });

  if (!student) {
    res.status(404);
    throw new Error('Student not found');
  }

  if (!student.createdBy) {
    res.status(400);
    throw new Error('No psychologist assigned');
  }

  // Create message
  const newMessage = new Message({
    sender: req.user._id,
    senderModel: 'Student',
    receiver: student.createdBy,
    receiverModel: 'Psychologist',
    content: message.trim()
  });

  await newMessage.save();

  res.status(201).json({
    message: 'Message sent successfully',
    messageDetails: newMessage
  });
});

// Get Messages with Psychologist
exports.getMessagesWithPsychologist = asyncHandler(async (req, res) => {
  // Find student
  const student = await Student.findOne({ user: req.user._id });

  if (!student) {
    res.status(404);
    throw new Error('Student not found');
  }

  // If no psychologist assigned, return empty array
  if (!student.createdBy) {
    return res.json([]);
  }

  // Fetch messages
  const messages = await Message.find({
    $or: [
      { 
        sender: req.user._id, 
        receiver: student.createdBy,
        senderModel: 'Student',
        receiverModel: 'Psychologist'
      },
      { 
        sender: student.createdBy, 
        receiver: req.user._id,
        senderModel: 'Psychologist',
        receiverModel: 'Student'
      }
    ]
  }).sort({ createdAt: 1 });

  res.json(messages);
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