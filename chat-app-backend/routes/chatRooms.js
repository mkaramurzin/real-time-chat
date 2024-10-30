const express = require('express');
const router = express.Router();
const ChatRoom = require('../models/ChatRoom');
const { protect } = require('../middleware/authMiddleware');
const User = require('../models/User');

// Get user's chat rooms
router.get('/my-rooms', protect, async (req, res) => {
    try {
        const chatRooms = await ChatRoom.find({
            members: req.user._id
        }).populate('members', 'username');
        res.json(chatRooms);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching chat rooms' });
    }
});

// Create a new chat room
router.post('/', protect, async (req, res) => {
    try {
        const { name, isPrivate = false } = req.body;
        
        // Check if room with this name already exists
        const existingRoom = await ChatRoom.findOne({ name });
        if (existingRoom) {
            return res.status(400).json({ message: 'A room with this name already exists' });
        }

        const chatRoom = await ChatRoom.create({
            name,
            creator: req.user._id,
            members: [req.user._id],
            isPrivate
        });

        // Populate the creator and members fields
        const populatedRoom = await ChatRoom.findById(chatRoom._id)
            .populate('creator', 'username')
            .populate('members', 'username');

        res.status(201).json(populatedRoom);
    } catch (error) {
        console.error('Error creating chat room:', error);
        res.status(500).json({ message: 'Error creating chat room', error: error.message });
    }
});

// Send invitation to join chat room
router.post('/:roomId/invite', protect, async (req, res) => {
    try {
        const { userId } = req.body;
        const chatRoom = await ChatRoom.findById(req.params.roomId);
        
        if (!chatRoom) {
            return res.status(404).json({ message: 'Chat room not found' });
        }
        
        if (!chatRoom.members.includes(req.user._id)) {
            return res.status(403).json({ message: 'Not authorized to invite' });
        }
        
        if (chatRoom.pendingInvites.includes(userId)) {
            return res.status(400).json({ message: 'Invitation already sent' });
        }
        
        chatRoom.pendingInvites.push(userId);
        await chatRoom.save();
        
        res.json({ message: 'Invitation sent successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error sending invitation' });
    }
});

// Accept chat room invitation
router.post('/:roomId/accept', protect, async (req, res) => {
    try {
        const chatRoom = await ChatRoom.findById(req.params.roomId);
        
        if (!chatRoom) {
            return res.status(404).json({ message: 'Chat room not found' });
        }
        
        if (!chatRoom.pendingInvites.includes(req.user._id)) {
            return res.status(400).json({ message: 'No pending invitation' });
        }
        
        chatRoom.pendingInvites = chatRoom.pendingInvites.filter(
            id => id.toString() !== req.user._id.toString()
        );
        chatRoom.members.push(req.user._id);
        await chatRoom.save();
        
        res.json({ message: 'Invitation accepted' });
    } catch (error) {
        res.status(500).json({ message: 'Error accepting invitation' });
    }
});

// Create room invitation
router.post('/invite', protect, async (req, res) => {
    try {
        const { username, roomName } = req.body;
        
        // Find the user by username
        const invitedUser = await User.findOne({ username });
        if (!invitedUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check if room name already exists
        const existingRoom = await ChatRoom.findOne({ name: roomName });
        if (existingRoom) {
            return res.status(400).json({ message: 'A room with this name already exists' });
        }

        // Create a pending room
        const chatRoom = await ChatRoom.create({
            name: roomName,
            creator: req.user._id,
            members: [req.user._id],
            pendingInvites: [invitedUser._id],
            isPrivate: true
        });

        // Emit socket event for real-time notification
        req.app.get('io').to(invitedUser._id.toString()).emit('room-invite', {
            roomId: chatRoom._id,
            roomName: chatRoom.name,
            inviter: req.user.username
        });

        res.status(201).json({ message: 'Invitation sent' });
    } catch (error) {
        console.error('Error creating room invitation:', error);
        res.status(500).json({ message: 'Error sending invitation' });
    }
});

module.exports = router; 