const mongoose = require('mongoose');
const config = require('./config');
const Product = require('./models/Product');

async function checkProducts() {
    try {
        // Kết nối với MongoDB
        await mongoose.connect(config.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Đếm tổng số sản phẩm
        const totalProducts = await Product.countDocuments();
        console.log(`Total products: ${totalProducts}`);

        // Lấy một vài sản phẩm mẫu
        const sampleProducts = await Product.find().limit(5);
        console.log('\nSample products:');
        sampleProducts.forEach(product => {
            console.log(`- ${product.name} (${product.category}) - ${product.brand}`);
        });

        // Kiểm tra categories
        const categories = await Product.distinct('category');
        console.log('\nAvailable categories:', categories);

        // Kiểm tra brands
        const brands = await Product.distinct('brand');
        console.log('\nAvailable brands:', brands);

        // Kiểm tra sản phẩm điện thoại
        const smartphones = await Product.find({ category: 'Smartphones' }).limit(3);
        console.log('\nSmartphones found:', smartphones.length);
        smartphones.forEach(phone => {
            console.log(`- ${phone.name} - ${phone.brand}`);
        });

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

checkProducts();
