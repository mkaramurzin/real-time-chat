const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const socketio = require('socket.io');
const http = require('http');

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = socketio(server, {
    cors: {
        origin: process.env.CLIENT_URL,
        methods: ['GET', 'POST']
    }
});

// Make io instance available to our routes
app.set('io', io);

// Middleware
app.use(cors());
app.use(express.json());

// Database connection
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));

// Socket.io connection handling
io.on('connection', (socket) => {
    console.log('New client connected');

    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });

    socket.on('join room', (roomId) => {
        socket.join(roomId);
        console.log(`User joined room: ${roomId}`);
    });

    socket.on('leave room', (roomId) => {
        socket.leave(roomId);
        console.log(`User left room: ${roomId}`);
    });

    socket.on('message', (messageData) => {
        io.to(messageData.chatRoom).emit('message', messageData);
        console.log(`Message sent to room: ${messageData.chatRoom}`);
    });

    socket.on('auth', (userId) => {
        socket.join(userId);
        console.log(`User ${userId} authenticated`);
    });

    socket.on('accept-invite', async (roomId) => {
        // Handle room acceptance
        const room = await ChatRoom.findById(roomId);
        if (room) {
            io.to(room.creator.toString()).emit('invite-accepted', {
                roomId,
                roomName: room.name
            });
        }
    });
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/chatrooms', require('./routes/chatRooms'));

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

