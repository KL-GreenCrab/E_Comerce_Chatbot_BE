const axios = require('axios');

// Comprehensive test for the complete chatbot fix
async function testCompleteFix() {
    console.log('🔧 Testing Complete Chatbot Fix...\n');
    
    const sessionId = 'test-session-' + Date.now();
    
    // Test 1: Category exploration (should save category to session)
    console.log('=== Test 1: Category Exploration ===');
    try {
        const response1 = await axios.post('http://localhost:5000/api/chatbot/message', {
            message: 'Tôi cần xem điện thoại',
            sessionId: sessionId
        });
        
        console.log(`Response: "${response1.data.text}"`);
        console.log(`Intent: ${response1.data.intent}`);
        console.log(`Category: ${response1.data.category}`);
        console.log(`Brands: ${response1.data.brands ? response1.data.brands.join(', ') : 'None'}`);
        
        if (response1.data.intent === 'category_exploration' && response1.data.brands) {
            console.log('✅ Category exploration working correctly\n');
        } else {
            console.log('❌ Category exploration failed\n');
        }
    } catch (error) {
        console.log(`❌ Error in test 1: ${error.message}\n`);
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Test 2: Price range query (should use category from session)
    console.log('=== Test 2: Price Range with Session Context ===');
    try {
        const response2 = await axios.post('http://localhost:5000/api/chatbot/message', {
            message: 'Tôi muốn tìm sản phẩm từ 500 đến 1000 USD',
            sessionId: sessionId
        });
        
        console.log(`Response: "${response2.data.text}"`);
        console.log(`Intent: ${response2.data.intent}`);
        console.log(`Products found: ${response2.data.products ? response2.data.products.length : 0}`);
        
        if (response2.data.products && response2.data.products.length > 0) {
            console.log('Products:');
            response2.data.products.forEach(product => {
                console.log(`  - ${product.name} (${product.category}): $${product.price}`);
                
                // Verify price is in range
                if (product.price >= 500 && product.price <= 1000) {
                    console.log(`    ✅ Price $${product.price} is in range`);
                } else {
                    console.log(`    ❌ Price $${product.price} is NOT in range`);
                }
            });
        }
        
        if (response2.data.intent === 'price_range_recommendation') {
            console.log('✅ Price range intent detected correctly');
        } else {
            console.log(`❌ Wrong intent: expected price_range_recommendation, got ${response2.data.intent}`);
        }
        
        console.log('');
    } catch (error) {
        console.log(`❌ Error in test 2: ${error.message}\n`);
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Test 3: Direct price range queries
    console.log('=== Test 3: Direct Price Range Queries ===');
    
    const priceTests = [
        { message: 'Tôi muốn tìm sản phẩm trên 2000 USD', expectedMin: 2000 },
        { message: 'Tôi muốn tìm sản phẩm dưới 500 USD', expectedMax: 500 },
        { message: 'Có sản phẩm giá rẻ không?', expectedMax: 500 }
    ];
    
    for (const test of priceTests) {
        try {
            console.log(`Testing: "${test.message}"`);
            
            const response = await axios.post('http://localhost:5000/api/chatbot/message', {
                message: test.message,
                sessionId: sessionId + '-price'
            });
            
            console.log(`Intent: ${response.data.intent}`);
            console.log(`Products found: ${response.data.products ? response.data.products.length : 0}`);
            
            if (response.data.products && response.data.products.length > 0) {
                const prices = response.data.products.map(p => p.price);
                const minPrice = Math.min(...prices);
                const maxPrice = Math.max(...prices);
                console.log(`Price range: $${minPrice} - $${maxPrice}`);
                
                // Verify price constraints
                let priceValid = true;
                if (test.expectedMin && minPrice < test.expectedMin) {
                    priceValid = false;
                    console.log(`❌ Min price $${minPrice} is below expected $${test.expectedMin}`);
                }
                if (test.expectedMax && maxPrice > test.expectedMax) {
                    priceValid = false;
                    console.log(`❌ Max price $${maxPrice} is above expected $${test.expectedMax}`);
                }
                
                if (priceValid) {
                    console.log('✅ Price constraints satisfied');
                }
            } else {
                console.log('⚠️  No products found');
            }
            
            console.log('');
            
        } catch (error) {
            console.log(`❌ Error testing "${test.message}": ${error.message}\n`);
        }
        
        await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log('🎯 Complete fix testing finished!');
}

// Run the comprehensive test
testCompleteFix().catch(console.error);
