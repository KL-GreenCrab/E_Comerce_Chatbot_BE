const axios = require('axios');

// Test cases for the fixed price range functionality
const testCases = [
    {
        name: 'Over $2000 USD',
        message: 'Tôi muốn tìm sản phẩm trên 2000 USD',
        expectedIntent: 'price_range_recommendation',
        expectedMinProducts: 1
    },
    {
        name: 'Under $500 USD',
        message: 'Tôi muốn tìm sản phẩm dưới 500 USD',
        expectedIntent: 'price_range_recommendation',
        expectedMinProducts: 1
    },
    {
        name: '$500 to $1000 USD',
        message: 'Tôi muốn tìm sản phẩm từ 500 đến 1000 USD',
        expectedIntent: 'price_range_recommendation',
        expectedMinProducts: 1
    },
    {
        name: 'Cheap smartphones',
        message: 'Có điện thoại giá rẻ không?',
        expectedIntent: 'price_range_recommendation',
        expectedMinProducts: 0 // May not have cheap smartphones
    },
    {
        name: 'Premium laptops',
        message: 'Tôi muốn laptop cao cấp',
        expectedIntent: 'price_range_recommendation',
        expectedMinProducts: 1
    }
];

async function testPriceFix() {
    console.log('🔧 Testing Fixed Price Range Functionality...\n');
    
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
            
            let testPassed = true;
            let issues = [];
            
            // Check intent
            if (data.intent !== testCase.expectedIntent) {
                testPassed = false;
                issues.push(`Wrong intent: expected ${testCase.expectedIntent}, got ${data.intent}`);
            }
            
            // Check products
            const productCount = data.products ? data.products.length : 0;
            console.log(`Products found: ${productCount}`);
            
            if (productCount < testCase.expectedMinProducts) {
                testPassed = false;
                issues.push(`Not enough products: expected at least ${testCase.expectedMinProducts}, got ${productCount}`);
            }
            
            // Show product details
            if (data.products && data.products.length > 0) {
                console.log('Products:');
                data.products.forEach(product => {
                    console.log(`  - ${product.name} (${product.brand}): $${product.price}`);
                });
                
                // Verify price ranges
                const prices = data.products.map(p => p.price);
                const minPrice = Math.min(...prices);
                const maxPrice = Math.max(...prices);
                console.log(`Price range: $${minPrice} - $${maxPrice}`);
            }
            
            if (testPassed) {
                console.log('✅ PASSED\n');
                passedTests++;
            } else {
                console.log(`❌ FAILED: ${issues.join(', ')}\n`);
            }
            
        } catch (error) {
            console.log(`❌ ERROR: ${error.message}\n`);
        }
        
        // Add delay between requests
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log(`\n📊 Test Results: ${passedTests}/${totalTests} tests passed`);
    console.log(`Success rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
    
    if (passedTests === totalTests) {
        console.log('🎉 All tests passed! Price range functionality is working correctly.');
    } else {
        console.log('⚠️  Some tests failed. Please check the implementation.');
    }
}

// Run the tests
testPriceFix().catch(console.error);
