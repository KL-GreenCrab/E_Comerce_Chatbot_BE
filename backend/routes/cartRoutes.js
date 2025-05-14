const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Cart = require('../models/Cart');
const { auth } = require('../middleware/auth');

// Lấy giỏ hàng theo userId
router.get('/:userId', auth, async (req, res) => {
    try {
        // Validate that the user is requesting their own cart
        if (req.user._id !== req.params.userId) {
            return res.status(403).json({ message: 'Unauthorized: You can only access your own cart' });
        }

        const userId = new mongoose.Types.ObjectId(req.params.userId);
        const cart = await Cart.findOne({ userId });

        // Log for debugging
        console.log(`Cart for user ${req.params.userId}:`, cart);

        res.json(cart || { userId: req.params.userId, items: [] });
    } catch (err) {
        console.error('Error fetching cart:', err);
        res.status(500).json({ message: err.message });
    }
});

// Thêm hoặc cập nhật sản phẩm trong giỏ hàng
router.post('/:userId', auth, async (req, res) => {
    try {
        // Validate that the user is updating their own cart
        if (req.user._id !== req.params.userId) {
            return res.status(403).json({ message: 'Unauthorized: You can only modify your own cart' });
        }

        const userId = new mongoose.Types.ObjectId(req.params.userId);
        const { productId, name, price, image, quantity } = req.body;

        if (!productId) {
            return res.status(400).json({ message: 'Product ID is required' });
        }

        let cart = await Cart.findOne({ userId });
        if (!cart) {
            cart = new Cart({ userId, items: [] });
        }

        const itemIndex = cart.items.findIndex(item =>
            item.productId.toString() === productId
        );

        if (itemIndex > -1) {
            cart.items[itemIndex].quantity += quantity;
            // Ensure quantity is at least 1
            if (cart.items[itemIndex].quantity < 1) {
                cart.items[itemIndex].quantity = 1;
            }
        } else {
            // Only add the item if it doesn't exist and quantity is positive
            if (quantity > 0) {
                cart.items.push({
                    productId: new mongoose.Types.ObjectId(productId),
                    name: name || 'Unknown Product',
                    price: price || 0,
                    image: image || '',
                    quantity: Math.max(1, quantity) // Ensure quantity is at least 1
                });
            }
        }

        await cart.save();
        console.log(`Updated cart for user ${req.params.userId}:`, cart);
        res.json(cart);
    } catch (err) {
        console.error('Error updating cart:', err);
        res.status(500).json({ message: err.message });
    }
});

// Xóa sản phẩm khỏi giỏ hàng
router.delete('/:userId/:productId', auth, async (req, res) => {
    try {
        // Validate that the user is removing from their own cart
        if (req.user._id !== req.params.userId) {
            return res.status(403).json({ message: 'Unauthorized: You can only modify your own cart' });
        }

        const userId = new mongoose.Types.ObjectId(req.params.userId);
        const productId = new mongoose.Types.ObjectId(req.params.productId);

        const cart = await Cart.findOne({ userId });
        if (!cart) return res.status(404).json({ message: 'Cart not found' });

        cart.items = cart.items.filter(item =>
            item.productId.toString() !== productId.toString()
        );

        await cart.save();
        console.log(`Removed item from cart for user ${req.params.userId}:`, cart);
        res.json(cart);
    } catch (err) {
        console.error('Error removing item from cart:', err);
        res.status(500).json({ message: err.message });
    }
});

// Xóa toàn bộ giỏ hàng
router.delete('/:userId', auth, async (req, res) => {
    try {
        // Validate that the user is clearing their own cart
        if (req.user._id !== req.params.userId) {
            return res.status(403).json({ message: 'Unauthorized: You can only modify your own cart' });
        }

        const userId = new mongoose.Types.ObjectId(req.params.userId);

        // Instead of deleting the cart, just clear the items
        const cart = await Cart.findOne({ userId });
        if (cart) {
            cart.items = [];
            await cart.save();
            console.log(`Cleared cart for user ${req.params.userId}`);
            res.json(cart);
        } else {
            // If cart doesn't exist, create an empty one
            const newCart = new Cart({ userId, items: [] });
            await newCart.save();
            console.log(`Created empty cart for user ${req.params.userId}`);
            res.json(newCart);
        }
    } catch (err) {
        console.error('Error clearing cart:', err);
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;