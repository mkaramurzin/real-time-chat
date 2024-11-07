const mongoose = require('mongoose');

const chatRoomSchema = new mongoose.Schema({
    participants: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    status: {
        type: String,
        enum: ['pending', 'accepted', 'declined'],
        default: 'pending'
    },
    lastMessage: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Message'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    initiator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
});

// Ensure only 2 participants per chat room
chatRoomSchema.pre('save', function(next) {
    if (this.participants.length !== 2) {
        next(new Error('Chat room must have exactly 2 participants'));
    }
    next();
});

module.exports = mongoose.model('ChatRoom', chatRoomSchema); 