const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const socketio = require('socket.io');
const http = require('http');
const Message = require('./models/Message');
const User = require('./models/User');

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

// MongoDB connection options
const mongoOptions = {
    dbName: 'real-time-chat', // Explicitly specify database name
    useNewUrlParser: true,
    useUnifiedTopology: true,
    autoIndex: true, // Build indexes
    maxPoolSize: 10, // Maintain up to 10 socket connections
    serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
    socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
};

// Database connection with retry logic
const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI, mongoOptions);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
        
        // Handle connection errors after initial connection
        mongoose.connection.on('error', err => {
            console.error('MongoDB connection error:', err);
        });

        mongoose.connection.on('disconnected', () => {
            console.log('MongoDB disconnected. Attempting to reconnect...');
        });

        mongoose.connection.on('reconnected', () => {
            console.log('MongoDB reconnected');
        });

    } catch (error) {
        console.error('MongoDB connection error:', error);
        // Retry connection after 5 seconds
        setTimeout(connectDB, 5000);
    }
};

// Connect to MongoDB before setting up routes and socket handlers
connectDB().then(() => {
    // Socket.io connection handling
    io.on('connection', (socket) => {
        console.log('New client connected');
        let userId;

        socket.on('auth', async (authUserId) => {
            userId = authUserId;
            socket.join(userId);
            
            // Update user status to online in database
            try {
                await User.findByIdAndUpdate(userId, { status: 'online' });
                // Broadcast online status to all connected clients
                io.emit('user_status', { userId, status: 'online' });
            } catch (error) {
                console.error('Error updating user status:', error);
            }
        });

        socket.on('disconnect', async () => {
            if (userId) {
                try {
                    await User.findByIdAndUpdate(userId, { status: 'offline' });
                    // Broadcast offline status to all connected clients
                    io.emit('user_status', { userId, status: 'offline' });
                } catch (error) {
                    console.error('Error updating user status:', error);
                }
            }
            console.log('Client disconnected');
        });

        socket.on('join_room', (roomId) => {
            socket.join(roomId);
            console.log(`User joined room: ${roomId}`);
        });

        socket.on('message', async (messageData) => {
            try {
                const { content, chatRoom, sender } = messageData;
                const message = await Message.create({
                    content,
                    chatRoom,
                    sender
                });

                const populatedMessage = await Message.findById(message._id)
                    .populate('sender', 'username');

                // Emit to all clients in the room EXCEPT the sender
                socket.to(chatRoom).emit('message', populatedMessage);
                
                // Emit a separate event just to the sender with their message
                socket.emit('message_sent', populatedMessage);
            } catch (error) {
                console.error('Error saving message:', error);
                socket.emit('message_error', { error: 'Failed to send message' });
            }
        });

        socket.on('accept-invite', async (roomId) => {
            try {
                const room = await ChatRoom.findById(roomId);
                if (room) {
                    io.to(room.creator.toString()).emit('invite-accepted', {
                        roomId,
                        roomName: room.name
                    });
                }
            } catch (error) {
                console.error('Error handling invite acceptance:', error);
                socket.emit('invite_error', { error: 'Failed to process invite' });
            }
        });
    });

    // Routes
    app.use('/api/auth', require('./routes/auth'));
    app.use('/api/chatrooms', require('./routes/chatRooms'));
    app.use('/api/messages', require('./routes/messages'));
    app.use('/api/users', require('./routes/users'));

    // Start server
    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
});

// Handle process termination
process.on('SIGINT', async () => {
    try {
        await mongoose.connection.close();
        console.log('MongoDB connection closed through app termination');
        process.exit(0);
    } catch (err) {
        console.error('Error during shutdown:', err);
        process.exit(1);
    }
});