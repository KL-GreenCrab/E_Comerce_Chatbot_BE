// Mock version of chatbot service for testing without MongoDB
const mockIntents = [
    {
        type: 'price_range_recommendation',
        patterns: ['giá', 'tầm giá', 'khoảng giá', 'từ', 'đến', 'usd', '$'],
        responses: [
            'Đây là một số sản phẩm trong tầm giá bạn quan tâm:',
            'Tôi đã tìm thấy những sản phẩm sau trong tầm giá này:',
            'Trong tầm giá bạn yêu cầu, chúng tôi có các sản phẩm sau:'
        ],
        requiresProductQuery: true,
        requiresPriceRange: true,
        requiresCategoryBrands: false
    },
    {
        type: 'product_search',
        patterns: ['tìm', 'tìm kiếm', 'mua', 'sản phẩm'],
        responses: [
            'Đây là một số sản phẩm phù hợp với yêu cầu của bạn:',
            'Tôi đã tìm thấy những sản phẩm sau đây:'
        ],
        requiresProductQuery: true,
        requiresPriceRange: false,
        requiresCategoryBrands: false
    },
    {
        type: 'fallback',
        patterns: [],
        responses: ['Xin lỗi, tôi không hiểu ý của bạn. Bạn có thể diễn đạt lại được không?'],
        requiresProductQuery: false,
        requiresPriceRange: false,
        requiresCategoryBrands: false
    }
];

const mockProducts = [
    { _id: '1', name: 'iPhone 15 Pro Max', price: 1099, category: 'Smartphones', brand: 'Apple', image: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569' },
    { _id: '2', name: 'Samsung Galaxy S24 Ultra', price: 1199, category: 'Smartphones', brand: 'Samsung', image: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf' },
    { _id: '3', name: 'Dell XPS 15', price: 1999, category: 'Laptops', brand: 'Dell', image: 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45' },
    { _id: '4', name: 'Sony WH-1000XM5', price: 399, category: 'Accessories', brand: 'Sony', image: 'https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb' },
    { _id: '5', name: 'iPad Pro 12.9', price: 1099, category: 'Tablets', brand: 'Apple', image: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0' },
    { _id: '6', name: 'MacBook Pro 16', price: 2499, category: 'Laptops', brand: 'Apple', image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8' },
    { _id: '7', name: 'HP Spectre x360', price: 1799, category: 'Laptops', brand: 'HP', image: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed' },
    { _id: '8', name: 'Lenovo ThinkPad X1 Carbon', price: 1899, category: 'Laptops', brand: 'Lenovo', image: 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45' },
    { _id: '9', name: 'Microsoft Surface Pro 9', price: 1299, category: 'Tablets', brand: 'Microsoft', image: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0' },
    { _id: '10', name: 'ASUS ROG Zephyrus G14', price: 1699, category: 'Laptops', brand: 'ASUS', image: 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45' }
];

// Simple in-memory session storage
const userSessions = new Map();

// Main message processing function
async function processMessage(message, sessionId = 'default') {
    console.log('Processing message:', message);

    try {
        const normalizedMessage = message.toLowerCase();

        // Get or create session context
        if (!userSessions.has(sessionId)) {
            userSessions.set(sessionId, { lastCategory: null, lastBrand: null });
        }
        const session = userSessions.get(sessionId);

        // Find matching intent
        const intent = await findMatchingIntent(normalizedMessage);
        console.log('Found matching intent:', intent ? intent.type : 'null');
        
        if (!intent) {
            console.error('No intent found for message:', normalizedMessage);
            return {
                text: 'Xin lỗi, tôi không hiểu ý của bạn. Bạn có thể diễn đạt lại được không?',
                intent: 'fallback'
            };
        }

        // Process based on intent type
        if (intent.requiresCategoryBrands) {
            // Handle category brands logic (simplified)
            return {
                text: 'Chúng tôi có nhiều thương hiệu như Apple, Samsung, Dell, HP, Sony...',
                intent: intent.type
            };
        }
        else if (intent.requiresPriceRange || intent.type === 'price_range_recommendation') {
            // Extract price range
            const priceRange = extractPriceRange(normalizedMessage);
            console.log('Extracted price range:', priceRange);

            if (priceRange.min === null && priceRange.max === null) {
                return {
                    text: 'Bạn đang tìm sản phẩm trong tầm giá nào? Vui lòng cho tôi biết khoảng giá cụ thể, ví dụ: "dưới 500 USD" hoặc "từ 500 đến 1000 USD".',
                    intent: intent.type
                };
            }

            // Extract category if any
            let category = extractCategory(normalizedMessage);
            if (!category && session.lastCategory) {
                category = session.lastCategory;
                console.log('Using category from session:', category);
            }
            console.log('Category for price search:', category);

            // Find products in price range
            const products = await findProductsByPriceRange(priceRange, category);
            console.log('Found products in price range:', products.length);

            // Create response
            const response = createProductResponse(intent, products);
            console.log('Created price range product response');
            return response;
        }
        else if (intent.requiresProductQuery) {
            // Handle general product search
            const keywords = extractKeywords(normalizedMessage);
            console.log('Extracted keywords:', keywords);

            const products = await findProducts(keywords);
            console.log('Found products:', products.length);

            const response = createProductResponse(intent, products);
            console.log('Created product response');
            return response;
        }

        // Return regular response
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

// Find matching intent
async function findMatchingIntent(message) {
    try {
        console.log('Found', mockIntents.length, 'intents in mock data');

        // Check for specific intents
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

        // Score-based matching
        let bestIntent = null;
        let bestScore = 0;

        for (const intent of mockIntents) {
            let score = 0;
            let matchedPatterns = 0;

            for (const pattern of intent.patterns) {
                if (message.includes(pattern)) {
                    matchedPatterns++;
                    score += pattern.length;
                }
            }

            if (matchedPatterns > 1) {
                score += matchedPatterns * 10;
            }

            if (score > bestScore) {
                bestScore = score;
                bestIntent = intent;
            }
        }

        if (bestIntent && bestScore > 0) {
            return bestIntent;
        }

        return mockIntents.find(i => i.type === 'fallback');
    } catch (error) {
        console.error('Error in findMatchingIntent:', error);
        return mockIntents.find(i => i.type === 'fallback');
    }
}

// Extract price range from message
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

// Extract keywords from message
function extractKeywords(message) {
    const stopWords = ['tôi', 'muốn', 'cần', 'tìm', 'kiếm', 'mua', 'một', 'cái', 'chiếc'];
    let keywords = message.toLowerCase().split(' ').filter(word =>
        word.length > 1 && !stopWords.includes(word)
    );
    return keywords.join(' ');
}

// Extract category from message
function extractCategory(message) {
    const categoryMap = {
        'điện thoại': 'Smartphones',
        'smartphone': 'Smartphones',
        'phone': 'Smartphones',
        'laptop': 'Laptops',
        'máy tính': 'Laptops',
        'tablet': 'Tablets',
        'ipad': 'Tablets',
        'phụ kiện': 'Accessories',
        'tai nghe': 'Accessories'
    };

    for (const [key, value] of Object.entries(categoryMap)) {
        if (message.includes(key)) {
            return value;
        }
    }
    return null;
}

// Find products by price range
async function findProductsByPriceRange(priceRange, category = null) {
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
    
    return filteredProducts.slice(0, 5);
}

// Find products by keywords
async function findProducts(keywords) {
    console.log('Searching products with keywords:', keywords);
    
    const searchRegex = new RegExp(keywords.split(' ').join('|'), 'i');
    const filteredProducts = mockProducts.filter(p => 
        searchRegex.test(p.name) || 
        searchRegex.test(p.category) || 
        searchRegex.test(p.brand)
    );
    
    console.log('Found products with regex search:', filteredProducts.length);
    return filteredProducts.slice(0, 3);
}

// Create product response
function createProductResponse(intent, products) {
    if (products.length === 0) {
        let noResultsText = 'Xin lỗi, tôi không tìm thấy sản phẩm nào phù hợp với yêu cầu của bạn.';
        if (intent.type === 'price_range_recommendation') {
            noResultsText += ' Bạn có thể thử tầm giá khác hoặc mở rộng khoảng giá tìm kiếm.';
        } else {
            noResultsText += ' Bạn có thể mô tả chi tiết hơn không?';
        }
        return {
            text: noResultsText,
            intent: intent.type,
            products: []
        };
    }

    let responseText = getRandomResponse(intent.responses);
    if (intent.type === 'price_range_recommendation' && products.length > 0) {
        const minPrice = Math.min(...products.map(p => p.price));
        const maxPrice = Math.max(...products.map(p => p.price));
        responseText += ` (Giá từ $${minPrice} đến $${maxPrice})`;
    }

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

// Get random response
function getRandomResponse(responses) {
    const randomIndex = Math.floor(Math.random() * responses.length);
    return responses[randomIndex];
}

module.exports = {
    processMessage
};
