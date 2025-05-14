const mongoose = require('mongoose');

const chatbotIntentSchema = new mongoose.Schema({
    // Loại ý định (tìm sản phẩm, hỏi về vận chuyển, v.v.)
    type: {
        type: String,
        required: true,
        enum: ['product_search', 'shipping', 'payment', 'return_policy', 'greeting', 'fallback']
    },
    // Các từ khóa hoặc mẫu câu để nhận diện ý định
    patterns: {
        type: [String],
        required: true
    },
    // Các câu trả lời mẫu (sẽ chọn ngẫu nhiên một câu)
    responses: {
        type: [String],
        required: true
    },
    // Có cần truy vấn sản phẩm không
    requiresProductQuery: {
        type: Boolean,
        default: false
    }
});

module.exports = mongoose.model('ChatbotIntent', chatbotIntentSchema);
