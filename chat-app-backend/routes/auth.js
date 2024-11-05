const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect } = require('../middleware/authMiddleware');

// Register user
router.post('/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        
        const userExists = await User.findOne({ $or: [{ email }, { username }] });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const user = await User.create({
            username,
            email,
            password
        });

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
            expiresIn: '30d'
        });

        res.status(201).json({
            _id: user._id,
            username: user.username,
            email: user.email,
            token
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Login user
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(401).json({ message: 'Invalid username or password' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid username or password' });
        }

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
            expiresIn: '30d'
        });

        res.json({
            user: {
                _id: user._id,
                username: user.username
            },
            token
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Verify token and return user data
router.get('/verify', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password');
        res.json({ user });
    } catch (error) {
        console.error('Token verification error:', error);
        res.status(401).json({ message: 'Invalid token' });
    }
});

module.exports = router;
