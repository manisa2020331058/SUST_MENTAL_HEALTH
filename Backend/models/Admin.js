// models/Admin.js
const mongoose = require('mongoose');

const AdminSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  contactNumber: {
    type: String
  },
  permissions: {
    type: [String],
    enum: [
      'user_management',  
      'psychologist_management', 
      'report_generation'
    ],
    default: ['user_management']
  },
  lastLogin: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Admin', AdminSchema);