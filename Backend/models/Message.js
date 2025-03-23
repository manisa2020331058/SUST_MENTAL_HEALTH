// models/Message.js
const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'senderModel',
    required: true
  },
  senderModel: {
    type: String,
    enum: ['Student', 'Psychologist'],
    required: true
  },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'receiverModel',
    required: true
  },
  receiverModel: {
    type: String,
    enum: ['Student', 'Psychologist'],
    required: true
  },
  content: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['sent', 'read'],
    default: 'sent'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Message', MessageSchema);