const ChatbotIntent = require('../models/ChatbotIntent');
const Product = require('../models/Product');

// Hàm xử lý tin nhắn từ người dùng
async function processMessage(message) {
    console.log('Processing message:', message);

    try {
        // Chuyển đổi tin nhắn thành chữ thường để dễ so sánh
        const normalizedMessage = message.toLowerCase();

        // Tìm intent phù hợp
        const intent = await findMatchingIntent(normalizedMessage);
        console.log('Found matching intent:', intent.type);

        // Nếu intent yêu cầu truy vấn sản phẩm
        if (intent.requiresProductQuery) {
            // Trích xuất từ khóa tìm kiếm
            const keywords = extractKeywords(normalizedMessage);
            console.log('Extracted keywords:', keywords);

            // Tìm sản phẩm phù hợp
            const products = await findProducts(keywords);
            console.log('Found products:', products.length);

            // Tạo phản hồi với sản phẩm
            const response = createProductResponse(intent, products);
            console.log('Created product response');
            return response;
        }

        // Trả về phản hồi thông thường
        const response = {
            text: getRandomResponse(intent.responses),
            intent: intent.type
        };
        console.log('Created regular response');
        return response;
    } catch (error) {
        console.error('Error processing message:', error);
        return {
            text: 'Xin lỗi, tôi đang gặp sự cố xử lý tin nhắn của bạn. Vui lòng thử lại sau.',
            intent: 'error'
        };
    }
}

// Tìm intent phù hợp với tin nhắn
async function findMatchingIntent(message) {
    // Lấy tất cả intent từ database
    const intents = await ChatbotIntent.find();

    // Tìm intent có pattern khớp với tin nhắn
    for (const intent of intents) {
        for (const pattern of intent.patterns) {
            if (message.includes(pattern)) {
                return intent;
            }
        }
    }

    // Nếu không tìm thấy, trả về intent fallback
    return await ChatbotIntent.findOne({ type: 'fallback' });
}

// Trích xuất từ khóa tìm kiếm từ tin nhắn
function extractKeywords(message) {
    // Loại bỏ các từ không cần thiết
    const stopWords = ['tôi', 'muốn', 'cần', 'tìm', 'kiếm', 'mua', 'một', 'cái', 'chiếc', 'đang', 'giúp', 'cho', 'xin'];

    let keywords = message.split(' ').filter(word => !stopWords.includes(word));

    // Nếu còn quá ít từ khóa, sử dụng toàn bộ tin nhắn
    if (keywords.length < 2) {
        keywords = message.split(' ');
    }

    return keywords.join(' ');
}

// Tìm sản phẩm phù hợp với từ khóa
async function findProducts(keywords) {
    // Tạo regex để tìm kiếm
    const searchRegex = new RegExp(keywords.split(' ').join('|'), 'i');

    // Tìm kiếm sản phẩm
    const products = await Product.find({
        $or: [
            { name: { $regex: searchRegex } },
            { description: { $regex: searchRegex } },
            { category: { $regex: searchRegex } },
            { brand: { $regex: searchRegex } }
        ]
    }).limit(3);

    return products;
}

// Tạo phản hồi với sản phẩm
function createProductResponse(intent, products) {
    if (products.length === 0) {
        return {
            text: 'Xin lỗi, tôi không tìm thấy sản phẩm nào phù hợp với yêu cầu của bạn. Bạn có thể mô tả chi tiết hơn không?',
            intent: intent.type,
            products: []
        };
    }

    return {
        text: getRandomResponse(intent.responses),
        intent: intent.type,
        products: products.map(p => ({
            id: p._id,
            name: p.name,
            price: p.price,
            image: p.image,
            url: `/products/${p._id}`
        }))
    };
}

// Lấy ngẫu nhiên một câu trả lời từ danh sách
function getRandomResponse(responses) {
    const randomIndex = Math.floor(Math.random() * responses.length);
    return responses[randomIndex];
}

module.exports = {
    processMessage
};
