// models/StudentChat.js

const mongoose = require('mongoose');

const studentAiChatSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', 
        required: true,
    },
    summary: {
        type: String,
    },
    chatHistory: {
        type: [String], 
        default: [],
    },
}, {
    timestamps: true, // Automatically adds createdAt and updatedAt fields
});

const StudentAiChat = mongoose.model('StudentAiChat', studentAiChatSchema);

module.exports = StudentAiChat;
