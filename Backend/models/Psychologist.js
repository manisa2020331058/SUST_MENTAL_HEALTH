// models/Psychologist.js
const mongoose = require('mongoose');

const PsychologistSchema = new mongoose.Schema({
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
      enum: ['Male', 'Female', 'Other']
    },
    dateOfBirth: {
      type: Date
    }
  },
  professionalInfo: {
    specialization: {
      type: String,
      required: true
    },
    qualifications: [String],
    yearsOfExperience: {
      type: Number,
      default: 0
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
    officeLocation: {
      type: String
    }
  },
  availabilitySchedule: [{
    day: {
      type: String,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    },
    startTime: {
      type: String
    },
    endTime: {
      type: String
    }
  }],
  sessionsHandled: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive'],
    default: 'Active'
  },
  permissions: {
    studentEnrollment: {
      type: Boolean,
      default: false
    },
    seminarCreation: {
      type: Boolean,
      default: false
    },
    sessionManagement: {
      type: Boolean,
      default: false
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Psychologist', PsychologistSchema);