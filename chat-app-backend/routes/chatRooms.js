const express = require('express');
const router = express.Router();
const ChatRoom = require('../models/ChatRoom');
const { protect } = require('../middleware/authMiddleware');

// Get user's DM rooms
router.get('/my-chats', protect, async (req, res) => {
    try {
        const chatRooms = await ChatRoom.find({
            participants: req.user._id
        })
        .populate('participants', 'username')
        .populate('lastMessage')
        .sort('-lastMessage.timestamp');
        
        res.json(chatRooms);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching chats' });
    }
});

// Start new DM chat
router.post('/dm', protect, async (req, res) => {
    try {
        const { recipientId } = req.body;
        
        // Check if chat already exists
        const existingChat = await ChatRoom.findOne({
            participants: { 
                $all: [req.user._id, recipientId]
            },
            status: { $ne: 'declined' } // Don't return declined chats
        });

        if (existingChat) {
            return res.json(existingChat);
        }

        // Create new chat room
        const chatRoom = await ChatRoom.create({
            participants: [req.user._id, recipientId],
            initiator: req.user._id,
            status: 'pending'
        });

        const populatedRoom = await ChatRoom.findById(chatRoom._id)
            .populate('participants', 'username');

        // Notify recipient of new chat request
        req.app.get('io').to(recipientId).emit('new-chat-request', populatedRoom);

        res.status(201).json(populatedRoom);
    } catch (error) {
        res.status(500).json({ message: 'Error creating chat' });
    }
});

// Accept DM chat
router.post('/:chatId/accept', protect, async (req, res) => {
    try {
        const chat = await ChatRoom.findOne({
            _id: req.params.chatId,
            participants: req.user._id,
            status: 'pending'
        });

        if (!chat) {
            return res.status(404).json({ message: 'Chat not found or already processed' });
        }

        chat.status = 'accepted';
        await chat.save();

        const populatedChat = await ChatRoom.findById(chat._id)
            .populate('participants', 'username')
            .populate('lastMessage');

        // Notify other participant that chat was accepted
        req.app.get('io').to(chat.participants
            .find(p => p.toString() !== req.user._id.toString())
            .toString())
            .emit('chat-accepted', populatedChat);

        res.json(populatedChat);
    } catch (error) {
        res.status(500).json({ message: 'Error accepting chat' });
    }
});

// Decline DM chat
router.post('/:chatId/decline', protect, async (req, res) => {
    try {
        const chat = await ChatRoom.findOne({
            _id: req.params.chatId,
            participants: req.user._id,
            status: 'pending'
        });

        if (!chat) {
            return res.status(404).json({ message: 'Chat not found or already processed' });
        }

        chat.status = 'declined';
        await chat.save();

        // Notify other participant that chat was declined
        req.app.get('io').to(chat.participants
            .find(p => p.toString() !== req.user._id.toString())
            .toString())
            .emit('chat-declined', chat._id);

        res.json({ message: 'Chat declined successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error declining chat' });
    }
});

// Update the route path to match the frontend request
router.post('/leave/:chatId', protect, async (req, res) => {
    try {
        const chat = await ChatRoom.findOne({
            _id: req.params.chatId,
            participants: req.user._id
        });

        if (!chat) {
            return res.status(404).json({ message: 'Chat not found' });
        }

        // Remove the user from participants
        chat.participants = chat.participants.filter(
            p => p.toString() !== req.user._id.toString()
        );

        await chat.save();

        // Notify other participant
        const otherParticipant = chat.participants[0];
        if (otherParticipant) {
            req.app.get('io').to(otherParticipant.toString())
                .emit('user-left-chat', {
                    chatId: chat._id,
                    userId: req.user._id
                });
        }

        res.json({ message: 'Successfully left the chat' });
    } catch (error) {
        console.error('Error leaving chat:', error);
        res.status(500).json({ message: 'Error leaving chat' });
    }
});

module.exports = router; 