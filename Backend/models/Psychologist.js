// models/Psychologist.js
const mongoose = require('mongoose');

const PsychologistSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,

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
      type: String, 
      default: '../images/default-avatar.png', // Default image path
     
  },
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
  // Add to models/Psychologist.js

// Add this to your schema
availabilitySchedule: {
  type: [{
    dayOfWeek: {
      type: Number, // 0-6 (Sunday-Saturday)
      required: true,
      min: 0,
      max: 6
    },
    isAvailable: {
      type: Boolean,
      default: true
    },
    slots: [{
      startTime: {
        type: String, // Format: "09:00"
        required: true
      },
      endTime: {
        type: String, // Format: "17:00"
        required: true
      }
    }]
  }],
  default: [
    // Default 9am-5pm Sunday-Thursday
    { dayOfWeek: 0, isAvailable: true, slots: [{ startTime: "09:00", endTime: "17:00" }] }, // Sunday
    { dayOfWeek: 1, isAvailable: true, slots: [{ startTime: "09:00", endTime: "17:00" }] }, // Monday
    { dayOfWeek: 2, isAvailable: true, slots: [{ startTime: "09:00", endTime: "17:00" }] }, // Tuesday
    { dayOfWeek: 3, isAvailable: true, slots: [{ startTime: "09:00", endTime: "17:00" }] }, // Wednesday
    { dayOfWeek: 4, isAvailable: true, slots: [{ startTime: "09:00", endTime: "17:00" }] }, // Thursday
    { dayOfWeek: 5, isAvailable: false, slots: [] }, // Friday
    { dayOfWeek: 6, isAvailable: false, slots: [] }  // Saturday
  ]
},

// Exception dates (holidays, special schedules)
availabilityExceptions: [{
  date: {
    type: Date,
    required: true
  },
  isAvailable: {
    type: Boolean,
    default: false
  },
  slots: [{
    startTime: String,
    endTime: String
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



// Check if psychologist is available at specific date and time
PsychologistSchema.methods.isAvailable = async function(date, time, duration = 60) {
  const requestDate = new Date(date);
  const dayOfWeek = requestDate.getDay();
  const requestTimeStr = time;
  
  // Format date to YYYY-MM-DD for exception checking
  const dateString = requestDate.toISOString().split('T')[0];
  
  // Check if date is an exception
  const exceptionDate = this.availabilityExceptions.find(
    exception => exception.date.toISOString().split('T')[0] === dateString
  );
  
  if (exceptionDate) {
    if (!exceptionDate.isAvailable) return false;
    
    // Check if time is within exception slots
    return exceptionDate.slots.some(slot => 
      requestTimeStr >= slot.startTime && 
      requestTimeStr <= slot.endTime
    );
  }
  
  // Check regular schedule
  const daySchedule = this.availabilitySchedule.find(s => s.dayOfWeek === dayOfWeek);
  if (!daySchedule || !daySchedule.isAvailable) return false;
  
  // Check if time falls within any available slot
  const isInSlot = daySchedule.slots.some(slot => 
    requestTimeStr >= slot.startTime && 
    requestTimeStr <= slot.endTime
  );
  
  if (!isInSlot) return false;
  
  // Now check if there's an existing session at this time
  const Session = mongoose.model('Session');
  
  const hasOverlap = await Session.checkOverlap(
    this._id, 
    date, 
    time, 
    duration
  );
  
  return !hasOverlap;
};

// Get available slots for a specific date
PsychologistSchema.methods.getAvailableTimeSlots = async function(date, slotDuration = 60) {
  const requestDate = new Date(date);
  const dayOfWeek = requestDate.getDay();
  const dateString = requestDate.toISOString().split('T')[0];
  const Session = mongoose.model('Session');
  
  // Get all sessions for this date
  const existingSessions = await Session.find({
    psychologist: this._id,
    date: {
      $gte: new Date(dateString),
      $lt: new Date(new Date(dateString).setDate(new Date(dateString).getDate() + 1))
    },
    status: { $ne: 'cancelled' }
  });
  
  // Check if date is an exception
  const exceptionDate = this.availabilityExceptions.find(
    exception => exception.date.toISOString().split('T')[0] === dateString
  );
  
  if (exceptionDate) {
    if (!exceptionDate.isAvailable) return [];
    return this._generateTimeSlots(exceptionDate.slots, existingSessions, slotDuration, requestDate);
  }
  
  // Use regular schedule
  const daySchedule = this.availabilitySchedule.find(s => s.dayOfWeek === dayOfWeek);
  if (!daySchedule || !daySchedule.isAvailable) return [];
  
  return this._generateTimeSlots(daySchedule.slots, existingSessions, slotDuration, requestDate);
};

// Helper method to generate time slots
PsychologistSchema.methods._generateTimeSlots = function(slots, existingSessions, slotDuration, date) {
  const availableSlots = [];
  
  for (const slot of slots) {
    let [startHour, startMin] = slot.startTime.split(':').map(Number);
    const [endHour, endMin] = slot.endTime.split(':').map(Number);
    
    // Generate slots in increments of slotDuration minutes
    while ((startHour < endHour) || (startHour === endHour && startMin < endMin)) {
      const slotTime = `${String(startHour).padStart(2, '0')}:${String(startMin).padStart(2, '0')}`;
      const slotDate = new Date(date);
      slotDate.setHours(startHour, startMin, 0, 0);
      
      // Check if this slot conflicts with any existing session
      const isBooked = existingSessions.some(session => {
        const sessionDate = new Date(session.date);
        const [sessionHour, sessionMin] = session.time.split(':').map(Number);
        sessionDate.setHours(sessionHour, sessionMin, 0, 0);
        
        const sessionEndTime = new Date(sessionDate.getTime() + session.duration * 60000);
        const slotEndTime = new Date(slotDate.getTime() + slotDuration * 60000);
        
        return (slotDate < sessionEndTime && slotEndTime > sessionDate);
      });
      
      if (!isBooked) {
        availableSlots.push({
          time: slotTime,
          duration: slotDuration,
          available: true
        });
      }
      
      // Move to next time slot
      startMin += slotDuration;
      if (startMin >= 60) {
        startHour += Math.floor(startMin / 60);
        startMin %= 60;
      }
    }
  }
  
  return availableSlots;
};
module.exports = mongoose.model('Psychologist', PsychologistSchema);