const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Cart = require('../models/Cart');

// Lấy giỏ hàng theo userId
router.get('/:userId', async (req, res) => {
    try {
        const userId = new mongoose.Types.ObjectId(req.params.userId);
        const cart = await Cart.findOne({ userId });
        res.json(cart || { userId: req.params.userId, items: [] });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Thêm hoặc cập nhật sản phẩm trong giỏ hàng
router.post('/:userId', async (req, res) => {
    try {
        const userId = new mongoose.Types.ObjectId(req.params.userId);
        const { productId, name, price, image, quantity } = req.body;

        let cart = await Cart.findOne({ userId });
        if (!cart) {
            cart = new Cart({ userId, items: [] });
        }

        const itemIndex = cart.items.findIndex(item =>
            item.productId.toString() === productId
        );

        if (itemIndex > -1) {
            cart.items[itemIndex].quantity += quantity;
        } else {
            cart.items.push({
                productId: new mongoose.Types.ObjectId(productId),
                name,
                price,
                image,
                quantity
            });
        }

        await cart.save();
        res.json(cart);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Xóa sản phẩm khỏi giỏ hàng
router.delete('/:userId/:productId', async (req, res) => {
    try {
        const userId = new mongoose.Types.ObjectId(req.params.userId);
        const productId = new mongoose.Types.ObjectId(req.params.productId);

        const cart = await Cart.findOne({ userId });
        if (!cart) return res.status(404).json({ message: 'Cart not found' });

        cart.items = cart.items.filter(item =>
            item.productId.toString() !== productId.toString()
        );

        await cart.save();
        res.json(cart);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Xóa toàn bộ giỏ hàng
router.delete('/:userId', async (req, res) => {
    try {
        const userId = new mongoose.Types.ObjectId(req.params.userId);
        await Cart.deleteOne({ userId });
        res.json({ message: 'Cart deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router; 