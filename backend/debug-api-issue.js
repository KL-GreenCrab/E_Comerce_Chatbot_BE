const express = require('express');
const cors = require('cors');
const chatbotServiceMock = require('./services/chatbotServiceMock');

const app = express();

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
app.use(express.json());

// Debug endpoint
app.post('/debug-chatbot', async (req, res) => {
    try {
        console.log('=== DEBUG CHATBOT REQUEST ===');
        console.log('Request body:', JSON.stringify(req.body, null, 2));
        console.log('Request headers:', JSON.stringify(req.headers, null, 2));

        const { message } = req.body;
        console.log('Extracted message:', message);
        console.log('Message type:', typeof message);
        console.log('Message length:', message ? message.length : 'N/A');

        if (!message || typeof message !== 'string') {
            console.error('Invalid message format');
            return res.status(400).json({ error: 'Invalid message format' });
        }

        console.log('Processing with mock service...');
        const response = await chatbotServiceMock.processMessage(message, 'debug-session');
        
        console.log('=== MOCK SERVICE RESPONSE ===');
        console.log(JSON.stringify(response, null, 2));

        res.json(response);
    } catch (error) {
        console.error('Debug error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Test endpoint
app.get('/test', (req, res) => {
    res.json({ message: 'Debug server is working!' });
});

const PORT = 5001;
app.listen(PORT, () => {
    console.log(`Debug server is running on port ${PORT}`);
    console.log('Test with: POST http://localhost:5001/debug-chatbot');
    console.log('Body: {"message": "Tôi muốn tìm sản phẩm từ 1000 đến 2000 USD"}');
});
