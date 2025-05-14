const express = require('express');
const router = express.Router();
const chatbotService = require('../services/chatbotService');

// Simple test endpoint
router.get('/test', (req, res) => {
    res.json({ message: 'Chatbot API is working!' });
});

// Endpoint nhận tin nhắn từ người dùng
router.post('/message', async (req, res) => {
    try {
        console.log('Received message request:', req.body);

        const { message } = req.body;

        if (!message || typeof message !== 'string') {
            console.error('Invalid message format:', req.body);
            return res.status(400).json({ message: 'Invalid message format' });
        }

        console.log('Processing message:', message);
        const response = await chatbotService.processMessage(message);
        console.log('Response generated:', response);

        res.json(response);
    } catch (error) {
        console.error('Chatbot error:', error);
        res.status(500).json({ message: 'Error processing message', error: error.message });
    }
});

// Endpoint để khởi tạo dữ liệu chatbot (chỉ chạy một lần)
router.post('/init', async (req, res) => {
    try {
        const ChatbotIntent = require('../models/ChatbotIntent');
        const intents = require('../data/chatbotIntents');

        // Xóa dữ liệu cũ
        await ChatbotIntent.deleteMany({});

        // Thêm dữ liệu mới
        await ChatbotIntent.insertMany(intents);

        res.json({ message: 'Chatbot data initialized successfully' });
    } catch (error) {
        console.error('Chatbot init error:', error);
        res.status(500).json({ message: 'Error initializing chatbot data', error: error.message });
    }
});

module.exports = router;
