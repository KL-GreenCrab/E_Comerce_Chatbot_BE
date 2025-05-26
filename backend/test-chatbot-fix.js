const mongoose = require('mongoose');
const config = require('./config');

// Mock data for testing without MongoDB
const mockIntents = [
    {
        type: 'price_range_recommendation',
        patterns: ['giá', 'tầm giá', 'khoảng giá', 'từ', 'đến', 'usd', '$'],
        responses: [
            'Đây là một số sản phẩm trong tầm giá bạn quan tâm:',
            'Tôi đã tìm thấy những sản phẩm sau trong tầm giá này:'
        ],
        requiresProductQuery: true,
        requiresPriceRange: true
    },
    {
        type: 'fallback',
        patterns: [],
        responses: ['Xin lỗi, tôi không hiểu ý của bạn.'],
        requiresProductQuery: false
    }
];

const mockProducts = [
    { _id: '1', name: 'iPhone 15 Pro Max', price: 1099, category: 'Smartphones', brand: 'Apple', image: 'test.jpg' },
    { _id: '2', name: 'Samsung Galaxy S24 Ultra', price: 1199, category: 'Smartphones', brand: 'Samsung', image: 'test.jpg' },
    { _id: '3', name: 'Dell XPS 15', price: 1999, category: 'Laptops', brand: 'Dell', image: 'test.jpg' },
    { _id: '4', name: 'Sony WH-1000XM5', price: 399, category: 'Accessories', brand: 'Sony', image: 'test.jpg' },
    { _id: '5', name: 'iPad Pro 12.9', price: 1099, category: 'Tablets', brand: 'Apple', image: 'test.jpg' }
];

// Copy the exact functions from chatbotService.js
function extractPriceRange(message) {
    const priceRange = { min: null, max: null };
    const normalizedMessage = message.toLowerCase().replace(/\s+/g, ' ');
    console.log('Extracting price range from:', normalizedMessage);

    const patterns = [
        {
            regex: /từ\s+(\d+)(?:\s*(?:usd|\$|dollar))?\s+đến\s+(\d+)(?:\s*(?:usd|\$|dollar))?/i,
            handler: (match) => {
                priceRange.min = parseInt(match[1]);
                priceRange.max = parseInt(match[2]);
            }
        },
        {
            regex: /dưới\s+(\d+)(?:\s*(?:usd|\$|dollar))?/i,
            handler: (match) => {
                priceRange.max = parseInt(match[1]);
            }
        },
        {
            regex: /trên\s+(\d+)(?:\s*(?:usd|\$|dollar))?/i,
            handler: (match) => {
                priceRange.min = parseInt(match[1]);
            }
        }
    ];

    for (const pattern of patterns) {
        const match = normalizedMessage.match(pattern.regex);
        if (match) {
            console.log('Matched pattern:', pattern.regex, 'with result:', match);
            pattern.handler(match);
            break;
        }
    }

    console.log('Final extracted price range:', priceRange);
    return priceRange;
}

function findMatchingIntent(message) {
    const priceRange = extractPriceRange(message);
    const hasPrice = priceRange.min !== null || priceRange.max !== null;
    const hasPriceKeywords = /(?:giá|price|usd|\$|triệu|tr|đắt|rẻ|tầm|khoảng|từ.*đến)/i.test(message);
    
    console.log('Price detection:', { hasPrice, hasPriceKeywords, priceRange });
    
    if (hasPrice || hasPriceKeywords) {
        const priceIntent = mockIntents.find(i => i.type === 'price_range_recommendation');
        if (priceIntent) {
            console.log('Prioritizing price_range_recommendation due to price detection or keywords');
            return priceIntent;
        }
    }
    
    return mockIntents.find(i => i.type === 'fallback');
}

function findProductsByPriceRange(priceRange, category = null) {
    console.log('Building price query with range:', priceRange);
    
    let filteredProducts = mockProducts;
    
    // Filter by price range
    if (priceRange.min !== null && priceRange.max !== null) {
        filteredProducts = filteredProducts.filter(p => p.price >= priceRange.min && p.price <= priceRange.max);
    } else if (priceRange.min !== null) {
        filteredProducts = filteredProducts.filter(p => p.price >= priceRange.min);
    } else if (priceRange.max !== null) {
        filteredProducts = filteredProducts.filter(p => p.price <= priceRange.max);
    }
    
    // Filter by category if specified
    if (category) {
        filteredProducts = filteredProducts.filter(p => p.category === category);
    }
    
    console.log(`Found ${filteredProducts.length} products matching price range`);
    if (filteredProducts.length > 0) {
        console.log('Price range of found products:',
            `$${Math.min(...filteredProducts.map(p => p.price))} - $${Math.max(...filteredProducts.map(p => p.price))}`);
    }
    
    return filteredProducts.slice(0, 5); // Limit to 5 products
}

function createProductResponse(intent, products) {
    if (products.length === 0) {
        return {
            text: 'Xin lỗi, tôi không tìm thấy sản phẩm nào phù hợp với yêu cầu của bạn.',
            intent: intent.type,
            products: []
        };
    }

    const responseText = intent.responses[0];
    return {
        text: responseText,
        intent: intent.type,
        products: products.map(p => ({
            id: p._id,
            name: p.name,
            price: p.price,
            brand: p.brand,
            category: p.category,
            image: p.image,
            url: `/product/${p._id}`
        }))
    };
}

async function testChatbotLogic() {
    console.log('=== TESTING CHATBOT LOGIC WITHOUT MONGODB ===');
    
    const testMessage = 'Tôi muốn tìm sản phẩm từ 1000 đến 2000 USD';
    console.log('Testing message:', testMessage);
    
    // Step 1: Find matching intent
    console.log('\n--- Step 1: Intent Detection ---');
    const intent = findMatchingIntent(testMessage.toLowerCase());
    console.log('Detected intent:', intent.type);
    console.log('Intent properties:', {
        requiresPriceRange: intent.requiresPriceRange,
        requiresProductQuery: intent.requiresProductQuery
    });
    
    // Step 2: Extract price range
    console.log('\n--- Step 2: Price Range Extraction ---');
    const priceRange = extractPriceRange(testMessage.toLowerCase());
    
    // Step 3: Check condition
    console.log('\n--- Step 3: Condition Check ---');
    const condition = priceRange.min === null && priceRange.max === null;
    console.log('Both min and max are null?', condition);
    
    if (condition) {
        console.log('❌ Would return "no price range" message');
        return {
            text: 'Bạn đang tìm sản phẩm trong tầm giá nào?',
            intent: intent.type
        };
    } else {
        console.log('✅ Will proceed to find products');
        
        // Step 4: Find products
        console.log('\n--- Step 4: Find Products ---');
        const products = findProductsByPriceRange(priceRange);
        
        // Step 5: Create response
        console.log('\n--- Step 5: Create Response ---');
        const response = createProductResponse(intent, products);
        
        console.log('\n=== FINAL RESULT ===');
        console.log('Response text:', response.text);
        console.log('Products found:', response.products.length);
        response.products.forEach(p => {
            console.log(`- ${p.name}: $${p.price} (${p.category})`);
        });
        
        // Validate price range
        const allInRange = response.products.every(p => p.price >= 1000 && p.price <= 2000);
        console.log('\n✅ All products within 1000-2000 USD range?', allInRange);
        
        if (!allInRange) {
            console.log('❌ ISSUE: Some products are outside the requested price range!');
            response.products.forEach(p => {
                if (p.price < 1000 || p.price > 2000) {
                    console.log(`  - OUT OF RANGE: ${p.name} ($${p.price})`);
                }
            });
        }
        
        return response;
    }
}

// Run the test
testChatbotLogic().then(() => {
    console.log('\n=== TEST COMPLETED ===');
    process.exit(0);
}).catch(error => {
    console.error('Test error:', error);
    process.exit(1);
});
