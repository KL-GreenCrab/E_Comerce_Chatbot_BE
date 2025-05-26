const mongoose = require('mongoose');
const config = require('./config');
const Product = require('./models/Product');

async function checkPriceRanges() {
    try {
        await mongoose.connect(config.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Lấy tất cả sản phẩm và phân tích giá
        const products = await Product.find({}, 'name price category brand').sort({ price: 1 });
        
        if (products.length === 0) {
            console.log('No products found in database');
            process.exit(0);
        }

        console.log(`\nAnalyzing ${products.length} products...\n`);

        // Tìm giá min và max
        const prices = products.map(p => p.price);
        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);

        console.log(`Price range: ${formatPrice(minPrice)} - ${formatPrice(maxPrice)}`);

        // Phân tích theo khoảng giá
        const priceRanges = [
            { name: 'Dưới 1 triệu', min: 0, max: 1000000 },
            { name: '1 - 3 triệu', min: 1000000, max: 3000000 },
            { name: '3 - 5 triệu', min: 3000000, max: 5000000 },
            { name: '5 - 10 triệu', min: 5000000, max: 10000000 },
            { name: '10 - 20 triệu', min: 10000000, max: 20000000 },
            { name: '20 - 30 triệu', min: 20000000, max: 30000000 },
            { name: 'Trên 30 triệu', min: 30000000, max: Infinity }
        ];

        console.log('\nProducts by price range:');
        priceRanges.forEach(range => {
            const count = products.filter(p => p.price >= range.min && p.price < range.max).length;
            if (count > 0) {
                console.log(`${range.name}: ${count} products`);
            }
        });

        // Phân tích theo category
        console.log('\nPrice analysis by category:');
        const categories = [...new Set(products.map(p => p.category))];
        
        categories.forEach(category => {
            const categoryProducts = products.filter(p => p.category === category);
            if (categoryProducts.length > 0) {
                const categoryPrices = categoryProducts.map(p => p.price);
                const catMin = Math.min(...categoryPrices);
                const catMax = Math.max(...categoryPrices);
                const catAvg = categoryPrices.reduce((a, b) => a + b, 0) / categoryPrices.length;
                
                console.log(`\n${category} (${categoryProducts.length} products):`);
                console.log(`  Min: ${formatPrice(catMin)}`);
                console.log(`  Max: ${formatPrice(catMax)}`);
                console.log(`  Avg: ${formatPrice(catAvg)}`);
                
                // Hiển thị một vài sản phẩm mẫu
                console.log('  Sample products:');
                categoryProducts.slice(0, 3).forEach(p => {
                    console.log(`    - ${p.name}: ${formatPrice(p.price)}`);
                });
            }
        });

        // Đề xuất khoảng giá phù hợp
        console.log('\n=== RECOMMENDED PRICE RANGES ===');
        
        // Tính toán khoảng giá dựa trên phân phối thực tế
        const sortedPrices = prices.sort((a, b) => a - b);
        const q1 = sortedPrices[Math.floor(sortedPrices.length * 0.25)];
        const q2 = sortedPrices[Math.floor(sortedPrices.length * 0.5)];
        const q3 = sortedPrices[Math.floor(sortedPrices.length * 0.75)];
        
        console.log('Based on actual data distribution:');
        console.log(`1. Dưới ${formatPrice(q1)} (25% of products)`);
        console.log(`2. ${formatPrice(q1)} - ${formatPrice(q2)} (25% of products)`);
        console.log(`3. ${formatPrice(q2)} - ${formatPrice(q3)} (25% of products)`);
        console.log(`4. Trên ${formatPrice(q3)} (25% of products)`);

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

function formatPrice(price) {
    if (price >= 1000000) {
        return `${(price / 1000000).toFixed(1)} triệu`;
    } else if (price >= 1000) {
        return `${(price / 1000).toFixed(0)}k`;
    } else {
        return `${price}đ`;
    }
}

checkPriceRanges();
