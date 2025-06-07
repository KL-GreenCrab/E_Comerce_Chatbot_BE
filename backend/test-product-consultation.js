const chatbotServiceMock = require('./services/chatbotServiceMock');

async function testProductConsultation() {
    console.log('=== TESTING PRODUCT CONSULTATION FEATURE ===\n');
    
    const testMessages = [
        'Tư vấn về iPhone 15 Pro Max',
        'Cho tôi biết thông tin về Samsung Galaxy S24 Ultra',
        'Mô tả chi tiết Dell XPS 15',
        'Sony WH-1000XM5 có tốt không?',
        'Thông số kỹ thuật iPad Pro 12.9'
    ];
    
    for (let i = 0; i < testMessages.length; i++) {
        const message = testMessages[i];
        console.log(`\n${'='.repeat(60)}`);
        console.log(`Test ${i + 1}: ${message}`);
        console.log('='.repeat(60));
        
        try {
            const result = await chatbotServiceMock.processMessage(message);
            
            console.log('✅ Intent detected:', result.intent);
            console.log('📝 Response length:', result.text.length, 'characters');
            
            if (result.product) {
                console.log('🎯 Product found:', result.product.name);
                console.log('💰 Price: $' + result.product.price);
                console.log('⭐ Rating:', result.product.rating + '/5');
                console.log('📊 Specifications:', Object.keys(result.product.specifications || {}).length, 'items');
                console.log('📦 Stock:', result.product.stock, 'units');
            } else {
                console.log('❌ No product found in response');
            }
            
            // Show first 300 characters of response
            console.log('\n📄 Response preview:');
            console.log(result.text.substring(0, 300) + (result.text.length > 300 ? '...' : ''));
            
        } catch (error) {
            console.error('❌ Error:', error.message);
        }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('🎉 PRODUCT CONSULTATION TEST COMPLETED');
    console.log('='.repeat(60));
}

// Test edge cases
async function testEdgeCases() {
    console.log('\n=== TESTING EDGE CASES ===\n');
    
    const edgeCases = [
        'Tư vấn về sản phẩm không tồn tại',
        'Tư vấn',
        'Cho tôi biết về',
        'iPhone có tốt không?',
        'Macbook thế nào?'
    ];
    
    for (let i = 0; i < edgeCases.length; i++) {
        const message = edgeCases[i];
        console.log(`\nEdge Case ${i + 1}: "${message}"`);
        console.log('-'.repeat(40));
        
        try {
            const result = await chatbotServiceMock.processMessage(message);
            console.log('Intent:', result.intent);
            console.log('Has product:', !!result.product);
            console.log('Response:', result.text.substring(0, 150) + '...');
        } catch (error) {
            console.error('Error:', error.message);
        }
    }
}

// Run tests
async function runAllTests() {
    try {
        await testProductConsultation();
        await testEdgeCases();
        console.log('\n✅ All tests completed successfully!');
    } catch (error) {
        console.error('\n❌ Test failed:', error);
    }
    process.exit(0);
}

runAllTests();
