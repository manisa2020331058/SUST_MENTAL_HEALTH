// models/Student.js
const mongoose = require('mongoose');

const StudentSchema = new mongoose.Schema({
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
    age: {
      type: Number,
      min: 0
    },
    bloodGroup: {
      type: String,
      enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
    },
    emergencyContact: {
      name: String,
      relationship: String,
      phone: String
    },
    profileImage: { 
      type: String, 
      default: '../images/default-avatar.png', // Default image path
      
    }
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
     
    },
    address: {
      
        type: String,
        required: true
      
    },
    communicationPreference: {
      type: String,
      enum: ['Email', 'Phone', 'Both'],
      default: 'Both'
    }
  },
  academicInfo: {
    registrationNumber: {
      type: String,
      required: [true, 'Registration number is required'],
      unique: true,
      trim: true
    },
    department: {
      type: String,
      required: [true, 'Department is required'],
      trim: true
    },
    program: {
      type: String,
      trim: true
    },
    batch: {
      type: String,
      trim: true
    },
    currentSemester: {
      type: Number,
      min: 1
    },
    academicStatus: {
      type: String,
      enum: ['Regular', 'Irregular', 'Probation'],
      default: 'Regular'
    },
  },
  mentalHealthHistory: {
    previousCounseling: {
      type: Boolean,
      default: false
    },
    diagnosedConditions: [{
      condition: String,
      diagnosedDate: Date,
      medications: [String]
    }],
    familyHistory: {
      type: String,
      trim: true
    },
    stressLevel: {
      type: Number,
      min: 1,
      max: 10
    },
    sleepQuality: {
      type: Number,
      min: 1,
      max: 10
    }
  },
  counselingHistory: {
    assignedPsychologist: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Psychologist'
    },
    startDate: Date,
    totalSessions: {
      type: Number,
      default: 0
    },
    lastSessionDate: Date,
    nextSessionDate: Date,
    primaryConcerns: [String],
    goals: [String],
    progress: {
      type: String,
      enum: ['Initial', 'Ongoing', 'Improved', 'Completed'],
      default: 'Initial'
    }
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Psychologist',
   // required: true
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
StudentSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  
  // Calculate age if dateOfBirth is provided
  if (this.personalInfo.dateOfBirth) {
    const today = new Date();
    const birthDate = new Date(this.personalInfo.dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    this.personalInfo.age = age;
  }
  
  next();
});

// Method to update counseling history
StudentSchema.methods.updateCounselingHistory = async function() {
  const Session = mongoose.model('Session');
  
  const sessions = await Session.find({ 
    student: this._id,
    status: 'completed'
  }).sort({ date: -1 });

  if (sessions.length > 0) {
    this.counselingHistory.totalSessions = sessions.length;
    this.counselingHistory.lastSessionDate = sessions[0].date;
  }

  const upcomingSession = await Session.findOne({
    student: this._id,
    status: 'scheduled',
    date: { $gt: new Date() }
  }).sort({ date: 1 });

  if (upcomingSession) {
    this.counselingHistory.nextSessionDate = upcomingSession.date;
  }

  await this.save();
};

module.exports = mongoose.model('Student', StudentSchema);