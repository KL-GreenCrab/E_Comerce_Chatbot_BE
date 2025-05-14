const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const mongoose = require('mongoose');
const { auth } = require('../middleware/auth');

// Tạo đơn hàng mới
router.post('/', auth, async (req, res) => {
    try {
        const {
            items,
            total,
            paymentMethod,
            shippingAddress
        } = req.body;

        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ message: 'Giỏ hàng trống' });
        }

        if (!total || total <= 0) {
            return res.status(400).json({ message: 'Tổng tiền không hợp lệ' });
        }

        // Kiểm tra từng item
        for (const item of items) {
            if (!item.productId || !mongoose.Types.ObjectId.isValid(item.productId)) {
                return res.status(400).json({ message: 'productId không hợp lệ', item });
            }
            if (!item.name || !item.image || typeof item.price !== 'number' || typeof item.quantity !== 'number') {
                return res.status(400).json({ message: 'Thiếu thông tin sản phẩm', item });
            }
        }

        // Kiểm tra paymentMethod
        const validMethods = ['credit_card', 'bank_transfer', 'cash_on_delivery'];
        if (!validMethods.includes(paymentMethod)) {
            return res.status(400).json({ message: 'Phương thức thanh toán không hợp lệ' });
        }

        // Kiểm tra shippingAddress
        const requiredAddressFields = ['fullName', 'address', 'city', 'state', 'zipCode', 'phone'];
        for (const field of requiredAddressFields) {
            if (!shippingAddress[field]) {
                return res.status(400).json({ message: `Thiếu trường địa chỉ: ${field}` });
            }
        }

        // Tạo đơn hàng mới
        const order = new Order({
            userId: req.user._id,
            items,
            total,
            paymentMethod,
            shippingAddress,
            status: 'pending'
        });

        // Lưu đơn hàng
        await order.save();

        // Xóa giỏ hàng sau khi đặt hàng thành công
        await Cart.deleteOne({ userId: req.user._id });

        res.status(201).json(order);
    } catch (error) {
        console.error('Error creating order:', error);
        res.status(500).json({ message: 'Error creating order', error: error.message });
    }
});

// Lấy danh sách đơn hàng của user
router.get('/user/:userId', auth, async (req, res) => {
    try {
        // Kiểm tra quyền truy cập
        if (req.user._id !== req.params.userId) {
            return res.status(403).json({ message: 'Không có quyền truy cập' });
        }

        const orders = await Order.find({ userId: req.params.userId })
            .sort({ createdAt: -1 });
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching orders', error: error.message });
    }
});

// Lấy chi tiết một đơn hàng
router.get('/:id', auth, async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Kiểm tra quyền truy cập
        if (order.userId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Không có quyền truy cập' });
        }

        res.json(order);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching order', error: error.message });
    }
});

module.exports = router; 