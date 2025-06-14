// controllers/psychologistController.js
const asyncHandler = require('express-async-handler');
const Psychologist = require('../models/Psychologist');
const Student = require('../models/Student');
const Session = require('../models/Session');
const User = require('../models/User');
const { studentProfilePicUpload } = require('../middleware/multerMiddleware');
const StudentAiChat = require('../models/StudentAiChat');

const { sendBulkEmail, sendIndividualEmails, sendWelcomeEmail ,sendWelcomeEmailToStudent} = require("../config/emailService")

const generateRandomPassword = (length = 8) => {
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*"
  let password = ""

  // Ensure at least one character from each type
  const lowercase = "abcdefghijklmnopqrstuvwxyz"  
  const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
  const numbers = "0123456789"
  const symbols = "!@#$%^&*"

  password += lowercase[Math.floor(Math.random() * lowercase.length)]
  password += uppercase[Math.floor(Math.random() * uppercase.length)]
  password += numbers[Math.floor(Math.random() * numbers.length)]
  password += symbols[Math.floor(Math.random() * symbols.length)]

  // Fill the rest randomly
  for (let i = 4; i < length; i++) {
    password += charset[Math.floor(Math.random() * charset.length)]
  }

  // Shuffle the password
  return password
    .split("")
    .sort(() => Math.random() - 0.5)
    .join("")
}


// Get Psychologist Profile
exports.getPsychologistProfile = asyncHandler(async (req, res) => {
  if (!req.user || !req.user._id) {
    return res.status(400).json({ message: "Invalid user ID" });
  }
  const psychologist = await Psychologist.findOne({ user: req.user._id })
  
    .populate('user', '-password');
  
  if (!psychologist) {
    res.status(404);
    throw new Error('Psychologist profile not found');
  }

  const response = {
    psychologistId: psychologist._id,
    userId: psychologist.user._id,
    personalInfo: psychologist.personalInfo,
    professionalInfo: psychologist.professionalInfo,
    contactInfo: psychologist.contactInfo,
    availabilitySchedule: psychologist.availabilitySchedule,
    status: psychologist.user.status,
    email: psychologist.user.email
  };

  res.json(response);
});

// Get Psychologist's Students
exports.getPsychologistStudents = asyncHandler(async (req, res) => {
  const psychologist = await Psychologist.findOne({ user: req.user._id})
 
  if (!psychologist) {
    res.status(404);
    throw new Error('Psychologist not found');
  }

  const students = await Student.find({ createdBy: req.user._id })
    .populate('user', 'email status');

  const formattedStudents = students.map(student => ({
    studentId: student._id,
    userId: student.user ? student.user._id : null, 
    personalInfo: student.personalInfo,
    academicInfo: student.academicInfo,
    contactInfo: {
      ...student.contactInfo,
      email: student.user ? student.user.email : null // Avoid crashing on null user
    },
    status:  student.user ? student.user.status : null,
    mentalHealthHistory: student.mentalHealthHistory,
    createdAt: student.createdAt
  }));

  res.json(formattedStudents);
});

// Update Psychologist Profile
exports.updateProfile = asyncHandler(async (req, res) => {
  const psychologist = await Psychologist.findOne({ user: req.user._id });
  
  if (!psychologist) {
    res.status(404);
    throw new Error('Psychologist not found');
  }

  const { personalInfo, professionalInfo, contactInfo } = req.body;

  if (personalInfo) psychologist.personalInfo = personalInfo;
  if (professionalInfo) psychologist.professionalInfo = professionalInfo;
  if (contactInfo) psychologist.contactInfo = contactInfo;

  await psychologist.save();

  res.json({
    message: 'Profile updated successfully',
    psychologist: {
      psychologistId: psychologist._id,
      personalInfo: psychologist.personalInfo,
      professionalInfo: psychologist.professionalInfo,
      contactInfo: psychologist.contactInfo
    }
  });
});

// Add these methods to psychologistController.js

// Update availability schedule
exports.updateAvailability = asyncHandler(async (req, res) => {
  const { availabilitySchedule } = req.body;
  
  if (!availabilitySchedule || !Array.isArray(availabilitySchedule)) {
    res.status(400);
    throw new Error('Invalid availability schedule format');
  }
  
  // Validate schedule format
  for (const schedule of availabilitySchedule) {
    if (typeof schedule.dayOfWeek !== 'number' || schedule.dayOfWeek < 0 || schedule.dayOfWeek > 6) {
      res.status(400);
      throw new Error('Invalid day of week');
    }
    
    if (!Array.isArray(schedule.slots)) {
      res.status(400);
      throw new Error('Slots must be an array');
    }
    
    for (const slot of schedule.slots) {
      if (!slot.startTime || !slot.endTime) {
        res.status(400);
        throw new Error('Slots must have startTime and endTime');
      }
      
      // Validate time format
      const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timeRegex.test(slot.startTime) || !timeRegex.test(slot.endTime)) {
        res.status(400);
        throw new Error('Time must be in format HH:MM');
      }
      
      // Ensure startTime is before endTime
      if (slot.startTime >= slot.endTime) {
        res.status(400);
        throw new Error('Start time must be before end time');
      }
    }
  }
  
  const psychologist = await Psychologist.findOne({ user: req.user._id });
  if (!psychologist) {
    res.status(404);
    throw new Error('Psychologist not found');
  }
  
  psychologist.availabilitySchedule = availabilitySchedule;
  await psychologist.save();
  
  res.json({
    message: 'Availability schedule updated successfully',
    availabilitySchedule: psychologist.availabilitySchedule
  });
});

// Add availability exception (e.g., vacation day)
exports.addAvailabilityException = asyncHandler(async (req, res) => {
  const { date, isAvailable, slots } = req.body;
  
  if (!date) {
    res.status(400);
    throw new Error('Date is required');
  }
  
  const psychologist = await Psychologist.findOne({ user: req.user._id });
  if (!psychologist) {
    res.status(404);
    throw new Error('Psychologist not found');
  }
  
  // Check if exception already exists
  const exceptionIndex = psychologist.availabilityExceptions.findIndex(
    exception => exception.date.toISOString().split('T')[0] === new Date(date).toISOString().split('T')[0]
  );
  
  if (exceptionIndex >= 0) {
    // Update existing exception
    psychologist.availabilityExceptions[exceptionIndex] = {
      date: new Date(date),
      isAvailable: isAvailable !== undefined ? isAvailable : false,
      slots: slots || []
    };
  } else {
    // Add new exception
    psychologist.availabilityExceptions.push({
      date: new Date(date),
      isAvailable: isAvailable !== undefined ? isAvailable : false,
      slots: slots || []
    });
  }
  
  await psychologist.save();
  
  res.json({
    message: 'Availability exception added successfully',
    availabilityExceptions: psychologist.availabilityExceptions
  });
});

// Delete availability exception
exports.deleteAvailabilityException = asyncHandler(async (req, res) => {
  const { exceptionId } = req.params;
  
  const psychologist = await Psychologist.findOne({ user: req.user._id });
  if (!psychologist) {
    res.status(404);
    throw new Error('Psychologist not found');
  }
  
  psychologist.availabilityExceptions = psychologist.availabilityExceptions.filter(
    exception => exception._id.toString() !== exceptionId
  );
  
  await psychologist.save();
  
  res.json({
    message: 'Availability exception deleted successfully',
    availabilityExceptions: psychologist.availabilityExceptions
  });
});

// Get Upcoming Sessions
exports.getUpcomingSessions = asyncHandler(async (req, res) => {
  const psychologist = await Psychologist.findOne({ user: req.user._id });
  
  if (!psychologist) {
    res.status(404);
    throw new Error('Psychologist not found');
  }

  const sessions = await Session.find({
    psychologist: psychologist._id,
    status: 'scheduled',
    date: { $gte: new Date() }
  }).populate({
    path: 'student',
    populate: {
      path: 'user',
      select: 'email status'
    }
  }).sort({ date: 1 });

  const formattedSessions = sessions.map(session => ({
    sessionId: session._id,
    date: session.date,
    time: session.time,
    type: session.type,
    status: session.status,
    student: {
      id: session.student._id,
      name: session.student.personalInfo.name,
      email: session.student.user.email,
      status: session.student.user.status
    },
    notes: session.notes
  }));

  res.json(formattedSessions);
});

// Get Past Sessions
exports.getPastSessions = asyncHandler(async (req, res) => {
  const psychologist = await Psychologist.findOne({ user: req.user._id });
  
  if (!psychologist) {
    res.status(404);
    throw new Error('Psychologist not found');
  }

  const sessions = await Session.find({
    psychologist: psychologist._id,
    $or: [
      { status: 'completed' },
      { date: { $lt: new Date() } }
    ]
  }).populate({
    path: 'student',
    populate: {
      path: 'user',
      select: 'email status'
    }
  }).sort({ date: -1 });

  const formattedSessions = sessions.map(session => ({
    sessionId: session._id,
    date: session.date,
    time: session.time,
    type: session.type,
    status: session.status,
    student: {
      id: session.student._id,
      name: session.student.personalInfo.name,
      email: session.student.user.email,
      status: session.student.user.status
    },
    notes: session.notes
  }));

  res.json(formattedSessions);
});



// Enroll New Student
exports.enrollStudent = asyncHandler(async (req, res) => {
  const psychologist = await Psychologist.findOne({ user: req.user._id });

  if (!psychologist) {
    res.status(404);
    throw new Error('Psychologist not found');
  }

  const { personalInfo, academicInfo, contactInfo,role} = req.body;
  if (!contactInfo || !contactInfo.email) {
    return res.status(400).json({ error: "Contact information with an email is required" });
  }
  
  console.log("Request Body:", req.body);

  const profilePicPath = personalInfo.profileImage
  ? studentProfilePicUpload.uploadBase64Image(personalInfo.profileImage)
  : null;



  // Create user account for student

  const randomPassword = generateRandomPassword(8)
  console.log(`Generated password for ${contactInfo.email}: ${randomPassword}`)


  const user = new User({
    email: contactInfo.email,
    password: randomPassword,
    role: 'student',
    status: 'active',
    createdBy: req.user._id, // Psychologist who created the student
    creatorModel: 'Psychologist',
    profileImage:profilePicPath
  });
  const studentAiChat = new StudentAiChat({
    userId: user._id,
    summary: 'The student name is ' + personalInfo.name + ' Age is ' + personalInfo.age + " His department is " + academicInfo.department,
    chatHistory: []
  });
  await user.save();
  if (!user) {
    throw new Error("User not found, cannot create student");
  }
  // Create student profile
  const student = new Student({
    user: user._id,
    personalInfo:{
      ...personalInfo,
      profileImage:profilePicPath
    },
    academicInfo,
    contactInfo,
    createdBy: req.user._id
  });
  await student.save();

  await studentAiChat.save();

  try {
    await sendWelcomeEmailToStudent({
      recipientEmail: contactInfo.email,
      recipientName: personalInfo.name,
      password: randomPassword,
      registrationNumber: academicInfo.registrationNumber,
    })
    console.log(`Welcome email sent successfully to ${contactInfo.email}`)
  } catch (emailError) {
    console.error("Failed to send welcome email:", emailError)
    // Don't fail the enrollment if email fails, just log it
  }

  res.status(201).json({
    message: 'Student enrolled successfully',
    student: {
      studentId: student._id,
      userId: user._id,
      personalInfo: student.personalInfo,
      academicInfo: student.academicInfo,
      contactInfo: student.contactInfo,
      profileImage:profilePicPath
    }
  });
});

exports.getStudentProfile = asyncHandler(async (req, res) => {
  try {
    const student = await Student.findOne({ user: req.params.studentId }) 
      .populate('personalInfo contactInfo academicInfo user', '-password')
      .lean();

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    const aiChats = await StudentAiChat.find({ userId: req.params.studentId }, 'summary').lean();
    student.aiSummaries = aiChats.map(chat => chat.summary);

    res.json(student);
  } catch (error) {
    console.error('Error fetching student profile:', error);
    res.status(500).json({
      message: 'Error fetching student profile',
      error: error.message
    });
  }
});
