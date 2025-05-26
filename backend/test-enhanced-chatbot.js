const axios = require('axios');

// Test cases for enhanced chatbot
const testCases = [
    // Category exploration tests
    {
        name: 'Category - Điện thoại',
        message: 'Có những loại điện thoại nào?',
        expectedIntent: 'category_exploration'
    },
    {
        name: 'Category - Máy tính',
        message: 'Có máy tính gì không?',
        expectedIntent: 'category_exploration'
    },
    {
        name: 'Category - Laptop',
        message: 'Có laptop nào không?',
        expectedIntent: 'category_exploration'
    },
    {
        name: 'Category - Phụ kiện',
        message: 'Có phụ kiện gì?',
        expectedIntent: 'category_exploration'
    },
    
    // Brand recommendation tests
    {
        name: 'Brand - Apple',
        message: 'Có sản phẩm Apple không?',
        expectedIntent: 'brand_recommendation'
    },
    {
        name: 'Brand - Samsung',
        message: 'Tôi muốn xem sản phẩm Samsung',
        expectedIntent: 'brand_recommendation'
    },
    {
        name: 'Brand - iPhone',
        message: 'Có iPhone nào không?',
        expectedIntent: 'brand_recommendation'
    },
    
    // Price range tests
    {
        name: 'Price - Dưới 5 triệu',
        message: 'Có sản phẩm nào dưới 5 triệu không?',
        expectedIntent: 'price_range_recommendation'
    },
    {
        name: 'Price - Từ 10 đến 15 triệu',
        message: 'Tôi muốn tìm laptop từ 10 đến 15 triệu',
        expectedIntent: 'price_range_recommendation'
    },
    {
        name: 'Price - Giá rẻ',
        message: 'Có điện thoại giá rẻ không?',
        expectedIntent: 'price_range_recommendation'
    },
    {
        name: 'Price - Cao cấp',
        message: 'Tôi muốn laptop cao cấp',
        expectedIntent: 'price_range_recommendation'
    },
    
    // Combined tests
    {
        name: 'Combined - Brand + Category',
        message: 'Có điện thoại Samsung nào không?',
        expectedIntent: 'brand_recommendation'
    },
    {
        name: 'Combined - Category + Price',
        message: 'Có laptop dưới 20 triệu không?',
        expectedIntent: 'price_range_recommendation'
    },
    
    // General product search
    {
        name: 'General Search',
        message: 'Tôi muốn mua điện thoại',
        expectedIntent: 'product_search'
    }
];

async function testChatbot() {
    console.log('🤖 Testing Enhanced Chatbot Intelligence...\n');
    
    let passedTests = 0;
    let totalTests = testCases.length;
    
    for (const testCase of testCases) {
        try {
            console.log(`Testing: ${testCase.name}`);
            console.log(`Message: "${testCase.message}"`);
            
            const response = await axios.post('http://localhost:5000/api/chatbot/message', {
                message: testCase.message
            }, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            const data = response.data;
            console.log(`Response: "${data.text}"`);
            console.log(`Intent: ${data.intent}`);
            
            if (data.category) {
                console.log(`Category: ${data.category}`);
            }
            
            if (data.brands && data.brands.length > 0) {
                console.log(`Brands: ${data.brands.join(', ')}`);
            }
            
            if (data.products && data.products.length > 0) {
                console.log(`Products found: ${data.products.length}`);
            }
            
            // Check if intent matches expected
            if (data.intent === testCase.expectedIntent) {
                console.log('✅ PASSED\n');
                passedTests++;
            } else {
                console.log(`❌ FAILED - Expected: ${testCase.expectedIntent}, Got: ${data.intent}\n`);
            }
            
        } catch (error) {
            console.log(`❌ ERROR: ${error.message}\n`);
        }
        
        // Add delay between requests
        await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log(`\n📊 Test Results: ${passedTests}/${totalTests} tests passed`);
    console.log(`Success rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
}

// Run the tests
testChatbot().catch(console.error);
