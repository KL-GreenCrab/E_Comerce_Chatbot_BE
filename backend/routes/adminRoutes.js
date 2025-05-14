const express = require('express');
const router = express.Router();
const { auth, admin } = require('../middleware/auth');
const Product = require('../models/Product');
const Order = require('../models/Order');

// Lấy thống kê dashboard
router.get('/stats', auth, admin, async (req, res) => {
    try {
        const totalProducts = await Product.countDocuments();
        const totalOrders = await Order.countDocuments();

        // Tính tổng doanh thu
        const orders = await Order.find({ status: 'completed' });
        const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);

        // Lấy đơn hàng gần đây
        const recentOrders = await Order.find()
            .sort({ createdAt: -1 })
            .limit(5)
            .populate('userId', 'name email');

        res.json({
            totalProducts,
            totalOrders,
            totalRevenue,
            recentOrders
        });
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        res.status(500).json({ message: 'Error fetching dashboard stats' });
    }
});

// Lấy danh sách đơn hàng
router.get('/orders', auth, admin, async (req, res) => {
    try {
        const orders = await Order.find().populate('userId', 'name email');
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching orders', error: error.message });
    }
});

// Cập nhật trạng thái đơn hàng
router.put('/orders/:id', auth, admin, async (req, res) => {
    try {
        const { status } = req.body;
        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        order.status = status;
        await order.save();

        res.json(order);
    } catch (error) {
        res.status(500).json({ message: 'Error updating order status' });
    }
});

// Thêm sản phẩm mới (admin)
router.post('/add-product', auth, admin, async (req, res) => {
    try {
        const {
            name, brand, category, price, originalPrice,
            image, images, stock,
            description, specifications
        } = req.body;

        if (!name || !brand || !category || !price || !image || !stock || !description) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        const product = new Product({
            name,
            brand,
            category,
            price,
            originalPrice,
            image,
            images,
            stock,
            rating: 0,
            reviews: 0,
            description,
            specifications
        });

        await product.save();
        res.status(201).json(product);
    } catch (error) {
        res.status(500).json({ message: 'Error adding product', error: error.message });
    }
});

// Admin chỉnh sửa thông tin đơn hàng
router.put('/orders/:id', auth, admin, async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }
        Object.assign(order, req.body);
        await order.save();
        res.json(order);
    } catch (error) {
        res.status(500).json({ message: 'Error updating order', error: error.message });
    }
});

module.exports = router; 