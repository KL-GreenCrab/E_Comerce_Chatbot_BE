const jwt = require('jsonwebtoken');
const config = require('../config');

const auth = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({ message: 'Không tìm thấy token xác thực' });
        }

        const decoded = jwt.verify(token, config.jwtSecret);
        req.user = { _id: decoded.userId };
        next();
    } catch (error) {
        console.error('Auth error:', error);
        res.status(401).json({ message: 'Token không hợp lệ' });
    }
};

module.exports = auth; 