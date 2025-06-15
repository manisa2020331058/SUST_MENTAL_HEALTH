// models/Session.js
const mongoose = require('mongoose');

const SessionSchema = new mongoose.Schema({
  psychologist: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Psychologist',
    required: true
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  time: {
    type: String,
    required: true
  },
  duration: {
    type: Number,
    default: 60, // Duration in minutes
    required: true
  },
  type: {
    type: String,
    enum: [
      'critical',
      'followup',
      'initial_consultation',
      'routine_check',
      'crisis_intervention',
      'therapy_session',
      'mental_health_assessment',
      'counseling'
    ],
    default: 'routine_check', // You can change this default if needed
    required: true
  },
  status: {
    type: String,
    enum: ['scheduled', 'completed', 'cancelled', 'no-show'],
    default: 'scheduled'
  },
  description: {
    type: String,
    trim: true
  },
  notes: {
    type: String,
    trim: true,
    default: ''
  },
  cancellationReason: {
    type: String,
    trim: true
  },
  feedback: {
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    comment: {
      type: String,
      trim: true
    },
    submittedAt: Date
  },
  followUpNeeded: {
    type: Boolean,
    default: false
  },
  tags: [{
    type: String,
    trim: true
  }],
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
SessionSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Method to check for overlapping sessions
SessionSchema.statics.checkOverlap = async function(psychologistId, date, time, duration, excludeSessionId = null) {
  const sessionDate = new Date(date);
  const [hours, minutes] = time.split(':').map(Number);
  const sessionStart = new Date(sessionDate.setHours(hours, minutes));
  const sessionEnd = new Date(sessionStart.getTime() + duration * 60000);

  const query = {
    psychologist: psychologistId,
    date: sessionDate,
    status: 'scheduled',
    _id: { $ne: excludeSessionId }
  };

  const overlappingSessions = await this.find(query);

  return overlappingSessions.some(session => {
    const [existingHours, existingMinutes] = session.time.split(':').map(Number);
    const existingStart = new Date(session.date.setHours(existingHours, existingMinutes));
    const existingEnd = new Date(existingStart.getTime() + session.duration * 60000);

    return (sessionStart < existingEnd && sessionEnd > existingStart);
  });
};

// Method to get session duration in formatted string
SessionSchema.methods.getDurationString = function() {
  const hours = Math.floor(this.duration / 60);
  const minutes = this.duration % 60;
  return `${hours}h ${minutes}m`;
};

// Virtual for formatted date and time
SessionSchema.virtual('formattedDateTime').get(function() {
  return `${this.date.toLocaleDateString()} at ${this.time}`;
});

// Ensure virtuals are included in JSON output
SessionSchema.set('toJSON', { virtuals: true });
SessionSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Session', SessionSchema);