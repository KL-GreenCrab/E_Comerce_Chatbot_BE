const axios = require('axios');

// Test cases for price range functionality
const priceTestCases = [
    {
        name: 'USD - Under $500',
        message: 'Tôi muốn tìm sản phẩm dưới 500 USD',
        expectedIntent: 'price_range_recommendation'
    },
    {
        name: 'USD - $500 to $1000',
        message: 'Tôi muốn tìm sản phẩm từ 500 đến 1000 USD',
        expectedIntent: 'price_range_recommendation'
    },
    {
        name: 'USD - Over $2000',
        message: 'Tôi muốn tìm sản phẩm trên 2000 USD',
        expectedIntent: 'price_range_recommendation'
    },
    {
        name: 'Vietnamese - Cheap products',
        message: 'Có sản phẩm giá rẻ không?',
        expectedIntent: 'price_range_recommendation'
    },
    {
        name: 'Vietnamese - Premium products',
        message: 'Tôi muốn laptop cao cấp',
        expectedIntent: 'price_range_recommendation'
    },
    {
        name: 'Category + Price',
        message: 'Có điện thoại dưới 800 USD không?',
        expectedIntent: 'price_range_recommendation'
    }
];

async function testPriceRanges() {
    console.log('🔍 Testing Price Range Functionality...\n');
    
    let passedTests = 0;
    let totalTests = priceTestCases.length;
    
    for (const testCase of priceTestCases) {
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
            
            if (data.products && data.products.length > 0) {
                console.log(`Products found: ${data.products.length}`);
                data.products.forEach(product => {
                    console.log(`  - ${product.name}: $${product.price}`);
                });
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
testPriceRanges().catch(console.error);
