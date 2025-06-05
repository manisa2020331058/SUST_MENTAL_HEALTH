// models/User.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
    },
    summary: {
        type: String,
        default: '',
    },
    last_10_messages: {
        type: [String],
        default: [],
    },
    allMsg: {
        type: [String],
        default: [],
    },
});

const User = mongoose.model('User', userSchema);
module.exports = User;
