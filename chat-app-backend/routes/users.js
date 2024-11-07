const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect } = require('../middleware/authMiddleware');

router.get('/search', protect, async (req, res) => {
    try {
        const { term } = req.query;
        
        if (!term || term.length < 2) {
            return res.status(400).json({ message: 'Search term must be at least 2 characters' });
        }

        const users = await User.find({
            username: { 
                $regex: term, 
                $options: 'i' 
            },
            _id: { $ne: req.user._id }
        })
        .select('username _id')
        .limit(10);
        
        res.json(users);
    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({ message: 'Error searching users' });
    }
});

module.exports = router; 