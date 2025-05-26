const axios = require('axios');

async function testSpecificIssue() {
    console.log('🎯 Testing Specific Price Range Issue...\n');
    
    const testCases = [
        {
            message: 'Tôi muốn tìm sản phẩm từ 500 đến 1000 USD',
            expectedIntent: 'price_range_recommendation',
            expectedMinPrice: 500,
            expectedMaxPrice: 1000
        },
        {
            message: 'Tôi muốn tìm sản phẩm trên 2000 USD',
            expectedIntent: 'price_range_recommendation',
            expectedMinPrice: 2000,
            expectedMaxPrice: null
        },
        {
            message: 'Tôi muốn tìm sản phẩm dưới 500 USD',
            expectedIntent: 'price_range_recommendation',
            expectedMinPrice: null,
            expectedMaxPrice: 500
        }
    ];
    
    for (const testCase of testCases) {
        console.log(`=== Testing: "${testCase.message}" ===`);
        
        try {
            const response = await axios.post('http://localhost:5000/api/chatbot/message', {
                message: testCase.message,
                sessionId: 'test-' + Date.now()
            });
            
            const data = response.data;
            
            console.log(`Response: "${data.text}"`);
            console.log(`Intent: ${data.intent}`);
            console.log(`Products found: ${data.products ? data.products.length : 0}`);
            
            // Check intent
            if (data.intent === testCase.expectedIntent) {
                console.log('✅ Correct intent detected');
            } else {
                console.log(`❌ Wrong intent: expected ${testCase.expectedIntent}, got ${data.intent}`);
            }
            
            // Check products and prices
            if (data.products && data.products.length > 0) {
                console.log('\nProducts found:');
                let allPricesValid = true;
                
                data.products.forEach(product => {
                    console.log(`  - ${product.name} (${product.category}): $${product.price}`);
                    
                    // Validate price range
                    let priceValid = true;
                    if (testCase.expectedMinPrice && product.price < testCase.expectedMinPrice) {
                        priceValid = false;
                        allPricesValid = false;
                    }
                    if (testCase.expectedMaxPrice && product.price > testCase.expectedMaxPrice) {
                        priceValid = false;
                        allPricesValid = false;
                    }
                    
                    if (priceValid) {
                        console.log(`    ✅ Price is within expected range`);
                    } else {
                        console.log(`    ❌ Price is outside expected range`);
                    }
                });
                
                if (allPricesValid) {
                    console.log('\n✅ All product prices are within the requested range');
                } else {
                    console.log('\n❌ Some products have prices outside the requested range');
                }
                
                // Show price statistics
                const prices = data.products.map(p => p.price);
                const minPrice = Math.min(...prices);
                const maxPrice = Math.max(...prices);
                console.log(`Price range of results: $${minPrice} - $${maxPrice}`);
                
            } else {
                console.log('⚠️  No products found - this might be expected for some price ranges');
            }
            
        } catch (error) {
            console.log(`❌ Error: ${error.message}`);
            if (error.response) {
                console.log(`Response status: ${error.response.status}`);
                console.log(`Response data:`, error.response.data);
            }
        }
        
        console.log('\n' + '='.repeat(60) + '\n');
        
        // Wait between requests
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log('🏁 Specific issue testing completed!');
}

testSpecificIssue().catch(console.error);
