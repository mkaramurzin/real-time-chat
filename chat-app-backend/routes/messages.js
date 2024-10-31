const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const { protect } = require('../middleware/authMiddleware');

// Get messages for a chat room with pagination
router.get('/:roomId', protect, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const skip = (page - 1) * limit;

        const messages = await Message.find({ chatRoom: req.params.roomId })
            .sort({ timestamp: -1 })
            .skip(skip)
            .limit(limit)
            .populate('sender', 'username')
            .lean();

        const totalMessages = await Message.countDocuments({ chatRoom: req.params.roomId });
        const hasMore = totalMessages > skip + messages.length;

        res.json({
            messages: messages.reverse(),
            page,
            hasMore
        });
    } catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json({ message: 'Error fetching messages' });
    }
});

module.exports = router; 