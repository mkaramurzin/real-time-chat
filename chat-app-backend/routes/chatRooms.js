const express = require('express');
const router = express.Router();
const ChatRoom = require('../models/ChatRoom');
const { protect } = require('../middleware/authMiddleware');
const User = require('../models/User');
const mongoose = require('mongoose');

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
    console.log('=== Starting Accept Invitation Process ===');
    console.log('Room ID:', req.params.roomId);
    console.log('User ID:', req.user._id);
    
    try {
        // 1. Verify room exists
        const chatRoom = await ChatRoom.findById(req.params.roomId);
        console.log('Found chat room:', chatRoom ? 'Yes' : 'No');
        
        if (!chatRoom) {
            console.log('Room not found');
            return res.status(404).json({ message: 'Chat room not found' });
        }

        // 2. Debug current state
        console.log('Current members:', chatRoom.members);
        console.log('Current pending invites:', chatRoom.pendingInvites);
        
        // 3. Update room membership
        const updates = {
            $pull: { pendingInvites: req.user._id },
            $addToSet: { members: req.user._id }
        };

        const updatedRoom = await ChatRoom.findByIdAndUpdate(
            req.params.roomId,
            updates,
            { 
                new: true,
                runValidators: true 
            }
        ).populate('members', 'username')
         .populate('creator', 'username');

        console.log('Room updated:', updatedRoom ? 'Yes' : 'No');

        if (!updatedRoom) {
            console.log('Update failed');
            return res.status(400).json({ message: 'Failed to update room' });
        }

        // 4. Notify all room members about the update
        const io = req.app.get('io');
        updatedRoom.members.forEach(member => {
            io.to(member._id.toString()).emit('room-updated', updatedRoom);
        });

        console.log('=== Accept Invitation Process Completed ===');
        res.json({ room: updatedRoom });

    } catch (error) {
        console.error('Accept Invitation Error:', error);
        res.status(500).json({ 
            message: 'Error accepting invitation',
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

// Create room invitation
router.post('/invite', protect, async (req, res) => {
    try {
        const { usernames, roomName } = req.body;
        console.log('Creating invites for users:', usernames);
        
        // Find all users by their usernames
        const invitedUsers = await User.find({ username: { $in: usernames } });
        console.log('Found users:', invitedUsers.map(u => u.username));
        
        if (invitedUsers.length === 0) {
            return res.status(404).json({ message: 'No valid users found' });
        }

        // Create a new room with all invited users in pendingInvites
        const chatRoom = await ChatRoom.create({
            name: roomName,
            creator: req.user._id,
            members: [req.user._id],
            pendingInvites: invitedUsers.map(user => user._id),
            isPrivate: true
        });

        // Send notifications to all invited users
        const io = req.app.get('io');
        invitedUsers.forEach(user => {
            io.to(user._id.toString()).emit('room-invite', {
                roomId: chatRoom._id,
                roomName: chatRoom.name,
                inviter: req.user.username
            });
        });

        res.status(201).json({ message: 'Invitations sent' });
    } catch (error) {
        console.error('Error creating room invitations:', error);
        res.status(500).json({ message: 'Error sending invitations' });
    }
});

// Add this new route to handle leaving a room
router.post('/:roomId/leave', protect, async (req, res) => {
    try {
        const chatRoom = await ChatRoom.findById(req.params.roomId);
        
        if (!chatRoom) {
            return res.status(404).json({ message: 'Chat room not found' });
        }

        // Remove user from members array
        const updatedRoom = await ChatRoom.findByIdAndUpdate(
            req.params.roomId,
            { $pull: { members: req.user._id } },
            { 
                new: true,
                runValidators: true 
            }
        ).populate('members', 'username')
         .populate('creator', 'username');

        if (!updatedRoom) {
            return res.status(400).json({ message: 'Failed to leave room' });
        }

        // Notify all room members about the update
        const io = req.app.get('io');
        updatedRoom.members.forEach(member => {
            io.to(member._id.toString()).emit('room-updated', updatedRoom);
        });
        
        // Also notify the leaving user
        io.to(req.user._id.toString()).emit('room-left', updatedRoom._id);

        res.json({ message: 'Successfully left the room' });
    } catch (error) {
        console.error('Error leaving room:', error);
        res.status(500).json({ message: 'Error leaving room' });
    }
});

module.exports = router; 