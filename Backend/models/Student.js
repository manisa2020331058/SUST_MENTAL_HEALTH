// models/Student.js
const mongoose = require('mongoose');

const StudentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  personalInfo: {
    name: {
      type: String,
      required: true
    },
    gender: {
      type: String,
      enum: ['Male', 'Female', 'Other'],
      required: true
    },
    dateOfBirth: {
      type: Date
    },
    age: {
      type: Number
    }
  },
  contactInfo: {
    email: {
      type: String,
      required: true,
      unique: true
    },
    phoneNumber: {
      type: String,
      required: true
    },
    address: {
      type: String
    },
    communicationPreference: {
      type: String,
      enum: ['Email', 'Phone', 'Both']
    }
  },
  academicInfo: {
    registrationNumber: {
      type: String,
      required: true,
      unique: true
    },
    department: {
      type: String,
      required: true
    },
    session: {
      type: String,
      required: true
    },
    currentYear: {
      type: String,
      enum: ['1st Year', '2nd Year', '3rd Year', '4th Year']
    },
    cgpa: {
      type: Number
    },
    scholarshipStatus: {
      type: String,
      enum: ['None', 'Partial', 'Full']
    }
  },
  mentalHealthProfile: {
    initialAssessmentDate: {
      type: Date
    },
    previousCounseling: {
      type: Boolean,
      default: false
    },
    currentMentalHealthStatus: {
      type: String
    },
    specialNeeds: [String]
  },
  sessions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Session'
  }],
  status: {
    type: String,
    enum: ['Active', 'Inactive', 'Graduated'],
    default: 'Active'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Psychologist'
  },
  profilePicture: {
    type: String, // Store file path or URL
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Student', StudentSchema);