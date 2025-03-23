// models/Seminar.js
const mongoose = require('mongoose');

const SeminarSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
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
  location: {
    type: String,
    required: true
  },
  maxParticipants: {
    type: Number,
    default: 50
  },
  registeredParticipants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student'
  }],
  conductedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Psychologist',
    required: true
  },
  status: {
    type: String,
    enum: ['Scheduled', 'Ongoing', 'Completed', 'Cancelled'],
    default: 'Scheduled'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Seminar', SeminarSchema);