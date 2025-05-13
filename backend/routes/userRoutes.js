const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const User = require('../models/User');

// Lấy tất cả users
router.get('/', async (req, res) => {
    try {
        const users = await User.find();
        res.json(users);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Lấy user theo ID
router.get('/:id', async (req, res) => {
    try {
        const user = await User.findById(new mongoose.Types.ObjectId(req.params.id));
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json(user);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Cập nhật user
router.put('/:id', async (req, res) => {
    try {
        const user = await User.findById(new mongoose.Types.ObjectId(req.params.id));
        if (!user) return res.status(404).json({ message: 'User not found' });

        Object.assign(user, req.body);
        const updatedUser = await user.save();
        res.json(updatedUser);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Xóa user
router.delete('/:id', async (req, res) => {
    try {
        const user = await User.findById(new mongoose.Types.ObjectId(req.params.id));
        if (!user) return res.status(404).json({ message: 'User not found' });

        await user.deleteOne();
        res.json({ message: 'User deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router; 