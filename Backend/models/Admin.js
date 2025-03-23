// models/Admin.js
const mongoose = require('mongoose');

const AdminSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  contactInfo: {
    phone: {
      type: String,
      trim: true
    },
    address: {
      type: String,
      trim: true
    }
  },
  permissions: {
    type: [String],
    enum: [
      'user_management',      // Can manage all users
      'psychologist_management', // Can manage psychologists
      'report_generation',    // Can generate and view reports
      'system_configuration'  // Can modify system settings
    ],
    default: ['user_management']
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active'
  },
  lastLogin: {
    type: Date
  },
  loginHistory: [{
    timestamp: {
      type: Date,
      default: Date.now
    },
    ipAddress: String,
    userAgent: String
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
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
AdminSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Method to check if admin has specific permission
AdminSchema.methods.hasPermission = function(permission) {
  return this.permissions.includes(permission);
};

// Method to update last login
AdminSchema.methods.updateLastLogin = async function(ipAddress, userAgent) {
  this.lastLogin = new Date();
  this.loginHistory.push({
    timestamp: this.lastLogin,
    ipAddress,
    userAgent
  });
  await this.save();
};

module.exports = mongoose.model('Admin', AdminSchema);