const mongoose = require('mongoose');
const config = require('./config');
const Product = require('./models/Product');

// Simplified category extraction for debugging
function extractCategory(message) {
    const categoryMap = {
        'điện thoại': 'Smartphones',
        'smartphone': 'Smartphones',
        'phone': 'Smartphones',
        'laptop': 'Laptops',
        'máy tính': 'Laptops',
        'tablet': 'Tablets',
        'máy tính bảng': 'Tablets',
        'phụ kiện': 'Accessories'
    };

    for (const [key, value] of Object.entries(categoryMap)) {
        if (message.includes(key)) {
            return value;
        }
    }
    return null;
}

async function debugChatbot() {
    try {
        await mongoose.connect(config.MONGODB_URI);
        console.log('Connected to MongoDB');

        const testMessage = 'Tôi cần xem điện thoại';
        console.log(`\nTesting message: "${testMessage}"`);

        // Test category extraction
        const category = extractCategory(testMessage.toLowerCase());
        console.log(`Extracted category: ${category}`);

        if (category) {
            // Test finding products by category
            const products = await Product.find({ category: category }).limit(3);
            console.log(`Found ${products.length} products in category ${category}:`);
            
            products.forEach(product => {
                console.log(`- ${product.name} (${product.brand}) - ${product.price}`);
            });

            // Test finding brands by category
            const brands = await Product.find({ category: category }).distinct('brand');
            console.log(`Brands in ${category}:`, brands);
        }

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

debugChatbot();
