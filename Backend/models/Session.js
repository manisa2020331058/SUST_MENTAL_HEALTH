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
  sessionDetails: {
    date: {
      type: Date,
      required: true
    },
    startTime: {
      type: String,
      required: true
    },
    endTime: {
      type: String,
      required: true
    },
    duration: {
      type: Number,
      default: 2, // Duration in hours
      validate: {
        validator: function(v) {
          return v === 2; // Ensure session duration is exactly 2 hours
        },
        message: 'Session duration must be 2 hours'
      }
    }
  },
  status: {
    type: String,
    enum: ['scheduled', 'completed', 'cancelled'],
    default: 'scheduled'
  },
  notes: {
    type: String
  },
  feedback: {
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    comments: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Method to check for overlapping sessions
SessionSchema.statics.checkOverlap = async function(psychologistId, date, startTime, endTime, excludeSessionId = null) {
  const startDateTime = new Date(`${date}T${startTime}`);
  const endDateTime = new Date(`${date}T${endTime}`);

  const query = {
    psychologist: psychologistId,
    'sessionDetails.date': date,
    status: 'scheduled',
    _id: { $ne: excludeSessionId }, // Exclude current session if updating
    $or: [
      {
        // New session starts during an existing session
        'sessionDetails.startTime': { 
          $lt: endTime 
        },
        'sessionDetails.endTime': { 
          $gt: startTime 
        }
      }
    ]
  };

  const overlappingSessions = await this.find(query);
  return overlappingSessions.length > 0;
};

module.exports = mongoose.model('Session', SessionSchema);