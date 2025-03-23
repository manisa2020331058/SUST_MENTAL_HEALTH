// models/Psychologist.js
const mongoose = require('mongoose');

const PsychologistSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  personalInfo: {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true
    },
    gender: {
      type: String,
      enum: ['Male', 'Female', 'Other'],
      required: true
    },
    dateOfBirth: {
      type: Date,
      required: true
    },
    bio: {
      type: String,
      trim: true,
      maxLength: 500
    },
    profileImage: {
      type: String
    }
  },
  professionalInfo: {
    specialization: {
      type: String,
      required: [true, 'Specialization is required'],
      trim: true
    },
    qualifications: [{
      degree: {
        type: String,
        required: true
      },
      institution: {
        type: String,
        required: true
      },
      year: {
        type: Number,
        required: true
      }
    }],
    certifications: [{
      name: {
        type: String,
        required: true
      },
      issuingBody: String,
      issueDate: Date,
      expiryDate: Date
    }],
    yearsOfExperience: {
      type: Number,
      default: 0,
      min: 0
    },
    expertise: [{
      type: String,
      trim: true
    }],
    languages: [{
      type: String,
      trim: true
    }]
  },
  contactInfo: {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true
    },
    phoneNumber: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true
    },
    alternatePhone: {
      type: String,
      trim: true
    },
    officeLocation: {
      type: String,
      trim: true
    },
    officeHours: {
      type: String,
      trim: true
    }
  },
  availabilitySchedule: [{
    day: {
      type: String,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      required: true
    },
    slots: [{
      startTime: {
        type: String,
        required: true
      },
      endTime: {
        type: String,
        required: true
      },
      isAvailable: {
        type: Boolean,
        default: true
      }
    }]
  }],
  statistics: {
    totalSessions: {
      type: Number,
      default: 0
    },
    completedSessions: {
      type: Number,
      default: 0
    },
    cancelledSessions: {
      type: Number,
      default: 0
    },
    activeStudents: {
      type: Number,
      default: 0
    },
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    }
  },
  preferences: {
    maxDailySessions: {
      type: Number,
      default: 8
    },
    sessionDuration: {
      type: Number,
      default: 60 // in minutes
    },
    breakBetweenSessions: {
      type: Number,
      default: 15 // in minutes
    },
    notificationPreferences: {
      email: {
        type: Boolean,
        default: true
      },
      sms: {
        type: Boolean,
        default: false
      }
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Update timestamps before saving
PsychologistSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Method to check availability for a specific time slot
PsychologistSchema.methods.isAvailable = function(date, startTime) {
  const dayOfWeek = new Date(date).toLocaleString('en-us', { weekday: 'long' });
  const daySchedule = this.availabilitySchedule.find(schedule => schedule.day === dayOfWeek);
  
  if (!daySchedule) return false;
  
  return daySchedule.slots.some(slot => {
    return slot.startTime === startTime && slot.isAvailable;
  });
};

// Method to update session statistics
PsychologistSchema.methods.updateStatistics = async function() {
  const Session = mongoose.model('Session');
  
  const [totalSessions, completedSessions, cancelledSessions] = await Promise.all([
    Session.countDocuments({ psychologist: this._id }),
    Session.countDocuments({ psychologist: this._id, status: 'completed' }),
    Session.countDocuments({ psychologist: this._id, status: 'cancelled' })
  ]);

  const sessions = await Session.find({ 
    psychologist: this._id,
    status: 'completed',
    'feedback.rating': { $exists: true }
  });

  const averageRating = sessions.length > 0
    ? sessions.reduce((acc, session) => acc + session.feedback.rating, 0) / sessions.length
    : 0;

  this.statistics = {
    totalSessions,
    completedSessions,
    cancelledSessions,
    activeStudents: this.students?.length || 0,
    averageRating
  };

  await this.save();
};

module.exports = mongoose.model('Psychologist', PsychologistSchema);