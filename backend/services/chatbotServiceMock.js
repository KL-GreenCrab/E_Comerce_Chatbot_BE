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
        type: 'product_consultation',
        patterns: [
            'tư vấn', 'tư vấn sản phẩm', 'tư vấn về', 'cho tôi biết về',
            'thông tin về', 'mô tả', 'mô tả sản phẩm', 'chi tiết sản phẩm',
            'thông số', 'thông số kỹ thuật', 'cấu hình', 'đánh giá',
            'review', 'đánh giá sản phẩm', 'có tốt không', 'có nên mua không',
            'iphone', 'samsung', 'macbook', 'dell', 'hp', 'sony', 'airpods'
        ],
        responses: [
            'Đây là thông tin chi tiết về sản phẩm bạn quan tâm:',
            'Tôi sẽ cung cấp thông tin tư vấn về sản phẩm này:',
            'Dưới đây là mô tả và thông số kỹ thuật của sản phẩm:'
        ],
        requiresProductQuery: true,
        requiresPriceRange: false,
        requiresCategoryBrands: false,
        requiresProductConsultation: true
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
    {
        _id: '1',
        name: 'iPhone 15 Pro Max',
        price: 1099,
        category: 'Smartphones',
        brand: 'Apple',
        image: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569',
        rating: 4.8,
        reviews: 1250,
        stock: 25,
        description: 'iPhone 15 Pro Max với chip A17 Pro mạnh mẽ, camera 48MP chuyên nghiệp và màn hình Super Retina XDR 6.7 inch. Thiết kế titanium cao cấp, bền bỉ và nhẹ hơn thế hệ trước.',
        specifications: {
            'Màn hình': '6.7" Super Retina XDR OLED',
            'Chip': 'A17 Pro',
            'Camera chính': '48MP f/1.78',
            'Camera phụ': '12MP Ultra Wide + 12MP Telephoto',
            'RAM': '8GB',
            'Bộ nhớ': '256GB/512GB/1TB',
            'Pin': 'Lên đến 29 giờ phát video',
            'Hệ điều hành': 'iOS 17',
            'Chất liệu': 'Titanium'
        }
    },
    {
        _id: '2',
        name: 'Samsung Galaxy S24 Ultra',
        price: 1199,
        category: 'Smartphones',
        brand: 'Samsung',
        image: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf',
        rating: 4.7,
        reviews: 980,
        stock: 18,
        description: 'Galaxy S24 Ultra với bút S Pen tích hợp, camera 200MP siêu nét và màn hình Dynamic AMOLED 2X 6.8 inch. Hiệu năng đỉnh cao với chip Snapdragon 8 Gen 3.',
        specifications: {
            'Màn hình': '6.8" Dynamic AMOLED 2X',
            'Chip': 'Snapdragon 8 Gen 3',
            'Camera chính': '200MP f/1.7',
            'Camera phụ': '50MP Telephoto + 12MP Ultra Wide + 10MP Telephoto',
            'RAM': '12GB',
            'Bộ nhớ': '256GB/512GB/1TB',
            'Pin': '5000mAh',
            'Hệ điều hành': 'Android 14, One UI 6.1',
            'Đặc biệt': 'S Pen tích hợp'
        }
    },
    {
        _id: '3',
        name: 'Dell XPS 15',
        price: 1999,
        category: 'Laptops',
        brand: 'Dell',
        image: 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45',
        rating: 4.6,
        reviews: 750,
        stock: 12,
        description: 'Dell XPS 15 với màn hình OLED 4K tuyệt đẹp, hiệu năng mạnh mẽ cho công việc sáng tạo và thiết kế. Laptop cao cấp với chất lượng build premium.',
        specifications: {
            'Màn hình': '15.6" OLED 4K Touch',
            'CPU': 'Intel Core i7-13700H',
            'GPU': 'NVIDIA RTX 4060',
            'RAM': '16GB DDR5',
            'Ổ cứng': '512GB SSD NVMe',
            'Pin': 'Lên đến 13 giờ',
            'Hệ điều hành': 'Windows 11 Pro',
            'Trọng lượng': '2.0kg'
        }
    },
    {
        _id: '4',
        name: 'Sony WH-1000XM5',
        price: 399,
        category: 'Accessories',
        brand: 'Sony',
        image: 'https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb',
        rating: 4.9,
        reviews: 2100,
        stock: 45,
        description: 'Tai nghe chống ồn hàng đầu thế giới với công nghệ V1 processor và 8 microphone. Chất lượng âm thanh Hi-Res và thời lượng pin lên đến 30 giờ.',
        specifications: {
            'Driver': '30mm',
            'Chống ồn': 'Adaptive Noise Canceling',
            'Kết nối': 'Bluetooth 5.2, NFC',
            'Pin': 'Lên đến 30 giờ',
            'Sạc nhanh': '3 phút sạc = 3 giờ nghe',
            'Codec': 'LDAC, SBC, AAC',
            'Trọng lượng': '250g',
            'Màu sắc': 'Đen, Bạc'
        }
    },
    {
        _id: '5',
        name: 'iPad Pro 12.9',
        price: 1099,
        category: 'Tablets',
        brand: 'Apple',
        image: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0',
        rating: 4.8,
        reviews: 890,
        stock: 20,
        description: 'iPad Pro 12.9 inch với chip M2 mạnh mẽ, màn hình Liquid Retina XDR và hỗ trợ Apple Pencil thế hệ 2. Hoàn hảo cho công việc sáng tạo và giải trí.',
        specifications: {
            'Màn hình': '12.9" Liquid Retina XDR',
            'Chip': 'Apple M2',
            'Camera': '12MP Wide + 10MP Ultra Wide',
            'RAM': '8GB/16GB',
            'Bộ nhớ': '128GB/256GB/512GB/1TB/2TB',
            'Pin': 'Lên đến 10 giờ',
            'Kết nối': 'Wi-Fi 6E, 5G (tùy chọn)',
            'Phụ kiện': 'Apple Pencil 2, Magic Keyboard'
        }
    }
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
        else if (intent.requiresProductConsultation) {
            // Xử lý tư vấn sản phẩm cụ thể
            const productName = extractProductName(normalizedMessage);
            console.log('Extracted product name:', productName);

            if (!productName) {
                return {
                    text: 'Bạn muốn tư vấn về sản phẩm nào? Vui lòng cho tôi biết tên sản phẩm cụ thể, ví dụ: "iPhone 15 Pro Max", "MacBook Pro 16", "Samsung Galaxy S24 Ultra".',
                    intent: intent.type
                };
            }

            // Tìm sản phẩm để tư vấn
            const product = findProductForConsultation(productName);
            console.log('Found product for consultation:', product ? product.name : 'null');

            if (!product) {
                return {
                    text: `Xin lỗi, tôi không tìm thấy thông tin về sản phẩm "${productName}". Bạn có thể kiểm tra lại tên sản phẩm hoặc hỏi về sản phẩm khác không?`,
                    intent: intent.type
                };
            }

            // Tạo phản hồi tư vấn chi tiết
            const response = createProductConsultationResponse(intent, product);
            console.log('Created product consultation response');
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
        const productName = extractProductName(message);
        const priceRange = extractPriceRange(message);

        // Ưu tiên product_consultation nếu có tên sản phẩm cụ thể HOẶC từ khóa tư vấn
        const hasProductName = productName !== null;
        const hasConsultationKeywords = /(?:tư vấn|mô tả|thông tin về|chi tiết|thông số|cấu hình|đánh giá|review|có tốt không|có nên mua)/i.test(message);

        console.log('Product consultation detection:', { hasProductName, hasConsultationKeywords, productName });

        if (hasProductName || hasConsultationKeywords) {
            const consultationIntent = mockIntents.find(i => i.type === 'product_consultation');
            if (consultationIntent) {
                console.log('Prioritizing product_consultation due to product name or consultation keywords');
                return consultationIntent;
            }
        }

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

// Extract product name from message
function extractProductName(message) {
    const productPatterns = [
        // iPhone series
        { patterns: ['iphone 15 pro max', 'iphone15promax'], name: 'iPhone 15 Pro Max' },
        { patterns: ['iphone 15 pro', 'iphone15pro'], name: 'iPhone 15 Pro' },
        { patterns: ['iphone 15', 'iphone15'], name: 'iPhone 15' },

        // Samsung Galaxy series
        { patterns: ['samsung galaxy s24 ultra', 'galaxy s24 ultra', 's24 ultra', 'samsung s24 ultra'], name: 'Samsung Galaxy S24 Ultra' },
        { patterns: ['samsung galaxy s24', 'galaxy s24', 's24', 'samsung s24'], name: 'Samsung Galaxy S24' },

        // MacBook series
        { patterns: ['macbook pro 16', 'macbook pro 16 inch'], name: 'MacBook Pro 16' },
        { patterns: ['macbook pro', 'macbook pro m2'], name: 'MacBook Pro' },
        { patterns: ['macbook air', 'macbook air m2'], name: 'MacBook Air' },

        // Dell series
        { patterns: ['dell xps 15', 'xps 15', 'dell xps15'], name: 'Dell XPS 15' },
        { patterns: ['dell xps 13', 'xps 13', 'dell xps13'], name: 'Dell XPS 13' },

        // HP series
        { patterns: ['hp spectre x360', 'spectre x360', 'hp spectre'], name: 'HP Spectre x360' },

        // Lenovo series
        { patterns: ['lenovo thinkpad x1 carbon', 'thinkpad x1 carbon', 'x1 carbon'], name: 'Lenovo ThinkPad X1 Carbon' },
        { patterns: ['lenovo thinkpad', 'thinkpad'], name: 'ThinkPad' },

        // ASUS series
        { patterns: ['asus rog zephyrus g14', 'rog zephyrus g14', 'zephyrus g14'], name: 'ASUS ROG Zephyrus G14' },
        { patterns: ['asus rog', 'rog'], name: 'ASUS ROG' },

        // iPad series
        { patterns: ['ipad pro 12.9', 'ipad pro 12', 'ipad pro'], name: 'iPad Pro 12.9' },
        { patterns: ['ipad air', 'ipad air 5'], name: 'iPad Air' },
        { patterns: ['ipad'], name: 'iPad' },

        // Surface series
        { patterns: ['microsoft surface pro 9', 'surface pro 9', 'surface pro'], name: 'Microsoft Surface Pro 9' },
        { patterns: ['microsoft surface', 'surface'], name: 'Surface' },

        // Headphones
        { patterns: ['sony wh-1000xm5', 'wh-1000xm5', 'sony wh1000xm5'], name: 'Sony WH-1000XM5' },
        { patterns: ['bose quietcomfort ultra', 'quietcomfort ultra', 'bose qc ultra'], name: 'Bose QuietComfort Ultra' },
        { patterns: ['apple airpods pro 2', 'airpods pro 2', 'airpods pro'], name: 'Apple AirPods Pro 2' },
        { patterns: ['airpods'], name: 'AirPods' }
    ];

    const normalizedMessage = message.toLowerCase().replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();

    let bestMatch = null;
    let bestScore = 0;

    for (const productPattern of productPatterns) {
        for (const pattern of productPattern.patterns) {
            if (normalizedMessage.includes(pattern)) {
                const score = pattern.length;
                if (score > bestScore) {
                    bestScore = score;
                    bestMatch = productPattern.name;
                }
            }
        }
    }

    return bestMatch;
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

// Find product for consultation
function findProductForConsultation(productName) {
    console.log('Searching for product consultation:', productName);

    // Tìm kiếm chính xác trước
    let product = mockProducts.find(p =>
        p.name.toLowerCase() === productName.toLowerCase()
    );

    if (product) {
        console.log('Found exact match:', product.name);
        return product;
    }

    // Tìm kiếm mờ - tách từ khóa và tìm
    const keywords = productName.toLowerCase().split(' ').filter(word => word.length > 2);
    console.log('Searching with keywords:', keywords);

    // Tìm sản phẩm có chứa tất cả từ khóa
    const products = mockProducts.filter(product => {
        const productNameLower = product.name.toLowerCase();
        return keywords.every(keyword => productNameLower.includes(keyword));
    });

    if (products.length > 0) {
        console.log('Found fuzzy matches:', products.length);
        return products[0];
    }

    // Tìm kiếm theo brand nếu không tìm thấy
    const brandKeywords = ['apple', 'samsung', 'dell', 'hp', 'lenovo', 'asus', 'sony', 'bose', 'microsoft'];
    const foundBrand = brandKeywords.find(brand =>
        keywords.some(keyword => keyword.includes(brand))
    );

    if (foundBrand) {
        console.log('Searching by brand:', foundBrand);
        const brandProducts = mockProducts.filter(p =>
            p.brand.toLowerCase().includes(foundBrand)
        );

        if (brandProducts.length > 0) {
            return brandProducts[0];
        }
    }

    console.log('No product found for consultation');
    return null;
}

// Create product consultation response
function createProductConsultationResponse(intent, product) {
    console.log('Creating consultation response for:', product.name);

    let consultationText = getRandomResponse(intent.responses) + '\n\n';

    // Thông tin cơ bản
    consultationText += `📱 **${product.name}**\n`;
    consultationText += `💰 **Giá:** $${product.price}`;

    if (product.originalPrice && product.originalPrice > product.price) {
        const discount = Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);
        consultationText += ` (Giảm ${discount}% từ $${product.originalPrice})`;
    }

    consultationText += `\n🏷️ **Thương hiệu:** ${product.brand}\n`;
    consultationText += `📂 **Danh mục:** ${getCategoryDisplayName(product.category)}\n`;

    if (product.rating) {
        consultationText += `⭐ **Đánh giá:** ${product.rating}/5`;
        if (product.reviews) {
            consultationText += ` (${product.reviews} đánh giá)`;
        }
        consultationText += '\n';
    }

    consultationText += `📦 **Tình trạng:** ${product.stock > 0 ? `Còn ${product.stock} sản phẩm` : 'Hết hàng'}\n\n`;

    // Mô tả sản phẩm
    if (product.description) {
        consultationText += `📝 **Mô tả:**\n${product.description}\n\n`;
    }

    // Thông số kỹ thuật
    if (product.specifications && Object.keys(product.specifications).length > 0) {
        consultationText += `🔧 **Thông số kỹ thuật:**\n`;
        for (const [key, value] of Object.entries(product.specifications)) {
            if (value) {
                consultationText += `• **${key}:** ${value}\n`;
            }
        }
        consultationText += '\n';
    }

    // Tư vấn dựa trên loại sản phẩm
    const categoryAdvice = getCategorySpecificAdvice(product.category, product);
    if (categoryAdvice) {
        consultationText += `💡 **Tư vấn:**\n${categoryAdvice}\n\n`;
    }

    // Gợi ý sản phẩm tương tự
    consultationText += `🔍 Bạn có thể xem thêm các sản phẩm ${getCategoryDisplayName(product.category)} khác hoặc hỏi tôi về sản phẩm cụ thể nào đó!`;

    return {
        text: consultationText,
        intent: intent.type,
        product: {
            id: product._id,
            name: product.name,
            price: product.price,
            brand: product.brand,
            category: product.category,
            image: product.image,
            url: `/product/${product._id}`,
            rating: product.rating,
            reviews: product.reviews,
            stock: product.stock,
            description: product.description,
            specifications: product.specifications
        }
    };
}

// Get category specific advice
function getCategorySpecificAdvice(category, product) {
    const advice = {
        'Smartphones': [
            `${product.name} là một lựa chọn tuyệt vời trong phân khúc smartphone.`,
            'Phù hợp cho người dùng cần hiệu năng cao và camera chất lượng.',
            'Thiết kế hiện đại, hệ điều hành mượt mà và thời lượng pin ổn định.',
            'Đặc biệt phù hợp cho công việc, giải trí và chụp ảnh.'
        ],
        'Laptops': [
            `${product.name} mang đến hiệu năng mạnh mẽ cho công việc và học tập.`,
            'Phù hợp cho sinh viên, dân văn phòng và những người cần di động.',
            'Thiết kế mỏng nhẹ, màn hình sắc nét và bàn phím thoải mái.',
            'Thời lượng pin tốt, hỗ trợ đa nhiệm hiệu quả.'
        ],
        'Tablets': [
            `${product.name} là giải pháp hoàn hảo cho giải trí và công việc nhẹ.`,
            'Phù hợp cho việc đọc sách, xem phim, vẽ và ghi chú.',
            'Màn hình lớn, chất lượng hiển thị tốt và thời lượng pin dài.',
            'Hỗ trợ bút cảm ứng và bàn phím rời (tùy model).'
        ],
        'Accessories': [
            `${product.name} sẽ nâng cao trải nghiệm âm thanh của bạn.`,
            'Chất lượng âm thanh tuyệt vời, thiết kế thoải mái.',
            'Phù hợp cho nghe nhạc, xem phim và cuộc gọi.',
            'Tính năng chống ồn và kết nối ổn định.'
        ]
    };

    const categoryAdviceList = advice[category];
    if (categoryAdviceList) {
        return categoryAdviceList.join(' ');
    }

    return `${product.name} là một sản phẩm chất lượng trong danh mục ${getCategoryDisplayName(category)}.`;
}

// Get category display name
function getCategoryDisplayName(category) {
    const categoryNames = {
        'Smartphones': 'Điện thoại thông minh',
        'Laptops': 'Laptop',
        'Tablets': 'Máy tính bảng',
        'Accessories': 'Phụ kiện'
    };
    return categoryNames[category] || category;
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
