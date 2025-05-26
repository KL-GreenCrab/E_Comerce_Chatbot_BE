const axios = require('axios');

async function testSpecificCase() {
    try {
        console.log('Testing: "Tôi cần xem điện thoại"');
        
        const response = await axios.post('http://localhost:5000/api/chatbot/message', {
            message: 'Tôi cần xem điện thoại'
        }, {
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        const data = response.data;
        console.log('Response:', JSON.stringify(data, null, 2));
        
        if (data.intent === 'category_exploration' && data.brands && data.brands.length > 0) {
            console.log('✅ SUCCESS: Correctly identified as category exploration with brands');
        } else if (data.intent === 'product_search' && data.products && data.products.length > 0) {
            console.log('✅ SUCCESS: Found products for the query');
        } else {
            console.log('❌ ISSUE: No products or brands found');
        }
        
    } catch (error) {
        console.error('Error:', error.message);
        if (error.response) {
            console.error('Response data:', error.response.data);
        }
    }
}

testSpecificCase();
