const ChatbotIntent = require('../models/ChatbotIntent');
const Product = require('../models/Product');

// Simple in-memory session storage (in production, use Redis or database)
const userSessions = new Map();

// Hàm xử lý tin nhắn từ người dùng
async function processMessage(message, sessionId = 'default') {
    console.log('Processing message:', message);

    try {
        // Chuyển đổi tin nhắn thành chữ thường để dễ so sánh
        const normalizedMessage = message.toLowerCase();

        // Lấy hoặc tạo session context
        if (!userSessions.has(sessionId)) {
            userSessions.set(sessionId, { lastCategory: null, lastBrand: null });
        }
        const session = userSessions.get(sessionId);

        // Tìm intent phù hợp
        const intent = await findMatchingIntent(normalizedMessage);
        console.log('Found matching intent:', intent ? intent.type : 'null');

        if (!intent) {
            console.error('No intent found for message:', normalizedMessage);
            return {
                text: 'Xin lỗi, tôi không hiểu ý của bạn. Bạn có thể diễn đạt lại được không?',
                intent: 'fallback'
            };
        }

        // Xử lý theo loại intent
        if (intent.requiresCategoryBrands) {
            // Trích xuất danh mục từ tin nhắn
            const category = extractCategory(normalizedMessage);
            console.log('Extracted category:', category);

            if (!category) {
                return {
                    text: 'Bạn muốn tìm hiểu về loại sản phẩm nào? Chúng tôi có điện thoại, laptop, máy tính bảng và phụ kiện.',
                    intent: intent.type
                };
            }

            // Lưu category vào session
            session.lastCategory = category;

            // Lấy các thương hiệu trong danh mục
            const brands = await getBrandsByCategory(category);
            console.log('Found brands for category:', brands);

            // Tạo phản hồi với thương hiệu
            const response = createCategoryBrandsResponse(intent, category, brands);
            console.log('Created category brands response');
            return response;
        }
        else if (intent.requiresPriceRange || intent.type === 'price_range_recommendation') {
            // Trích xuất khoảng giá từ tin nhắn
            const priceRange = extractPriceRange(normalizedMessage);
            console.log('Extracted price range:', priceRange);

            if (priceRange.min === null && priceRange.max === null) {
                return {
                    text: 'Bạn đang tìm sản phẩm trong tầm giá nào? Vui lòng cho tôi biết khoảng giá cụ thể, ví dụ: "dưới 500 USD" hoặc "từ 500 đến 1000 USD".',
                    intent: intent.type
                };
            }

            // Trích xuất danh mục (nếu có) hoặc sử dụng từ session
            let category = extractCategory(normalizedMessage);
            if (!category && session.lastCategory) {
                category = session.lastCategory;
                console.log('Using category from session:', category);
            }
            console.log('Category for price search:', category);

            // Tìm sản phẩm trong khoảng giá
            const products = await findProductsByPriceRange(priceRange, category);
            console.log('Found products in price range:', products.length);

            // Tạo phản hồi với sản phẩm
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
            const product = await findProductForConsultation(productName);
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
            // Xử lý theo loại intent cụ thể
            if (intent.type === 'brand_recommendation') {
                // Trích xuất thương hiệu từ tin nhắn
                const brand = extractBrand(normalizedMessage);
                console.log('Extracted brand:', brand);

                if (!brand) {
                    return {
                        text: 'Bạn quan tâm đến thương hiệu nào? Chúng tôi có nhiều thương hiệu như Apple, Samsung, Xiaomi, Dell, HP, Asus, và nhiều thương hiệu khác.',
                        intent: intent.type
                    };
                }

                // Trích xuất danh mục (nếu có)
                const category = extractCategory(normalizedMessage);

                // Tìm sản phẩm của thương hiệu
                const products = await findProductsByBrand(brand, category);
                console.log('Found products for brand:', products.length);

                // Tạo phản hồi với sản phẩm
                const response = createProductResponse(intent, products);
                console.log('Created brand product response');
                return response;
            }
            else {
                // Kiểm tra xem có category trong tin nhắn không
                const category = extractCategory(normalizedMessage);
                console.log('Extracted category for product search:', category);

                if (category) {
                    // Nếu có category, tìm sản phẩm theo category
                    const products = await findProductsByCategory(category);
                    console.log('Found products by category:', products.length);

                    // Tạo phản hồi với sản phẩm
                    const response = createProductResponse(intent, products);
                    console.log('Created category product response');
                    return response;
                } else {
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
            }
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
    try {
        // Lấy tất cả intent từ database
        const intents = await ChatbotIntent.find();
        console.log('Found', intents.length, 'intents in database');

        if (intents.length === 0) {
            console.error('No intents found in database! Please run: node scripts/initChatbot.js');
            return null;
        }

        // Kiểm tra đặc biệt: ưu tiên các intent cụ thể
        const category = extractCategory(message);
        const brand = extractBrand(message);
        const priceRange = extractPriceRange(message);
        const productName = extractProductName(message);

        // Ưu tiên product_consultation nếu có tên sản phẩm cụ thể HOẶC từ khóa tư vấn
        const hasProductName = productName !== null;
        const hasConsultationKeywords = /(?:tư vấn|mô tả|thông tin về|chi tiết|thông số|cấu hình|đánh giá|review|có tốt không|có nên mua)/i.test(message);

        console.log('Product consultation detection:', { hasProductName, hasConsultationKeywords, productName });

        if (hasProductName || hasConsultationKeywords) {
            const consultationIntent = intents.find(i => i.type === 'product_consultation');
            if (consultationIntent) {
                console.log('Prioritizing product_consultation due to product name or consultation keywords');
                return consultationIntent;
            }
        }

        // Ưu tiên price_range_recommendation nếu có price range HOẶC có từ khóa giá
        const hasPrice = priceRange.min !== null || priceRange.max !== null;
        const hasPriceKeywords = /(?:giá|price|usd|\$|triệu|tr|đắt|rẻ|tầm|khoảng|từ.*đến)/i.test(message);

        console.log('Price detection:', { hasPrice, hasPriceKeywords, priceRange });

        if (hasPrice || hasPriceKeywords) {
            const priceIntent = intents.find(i => i.type === 'price_range_recommendation');
            if (priceIntent) {
                console.log('Prioritizing price_range_recommendation due to price detection or keywords');
                return priceIntent;
            }
        }

        // Ưu tiên brand_recommendation nếu có brand
        if (brand) {
            const brandIntent = intents.find(i => i.type === 'brand_recommendation');
            if (brandIntent) {
                console.log('Prioritizing brand_recommendation due to brand detection');
                return brandIntent;
            }
        }

        // Ưu tiên category_exploration nếu chỉ có category
        if (category && !brand && !priceRange.min && !priceRange.max) {
            const categoryIntent = intents.find(i => i.type === 'category_exploration');
            if (categoryIntent) {
                console.log('Prioritizing category_exploration due to category detection');
                return categoryIntent;
            }
        }

        // Tính điểm cho mỗi intent dựa trên số lượng pattern khớp
        let bestIntent = null;
        let bestScore = 0;

        for (const intent of intents) {
            let score = 0;
            let matchedPatterns = 0;

            for (const pattern of intent.patterns) {
                if (message.includes(pattern)) {
                    matchedPatterns++;
                    // Tăng điểm dựa trên độ dài của pattern (pattern dài hơn = chính xác hơn)
                    score += pattern.length;
                }
            }

            // Bonus điểm nếu có nhiều pattern khớp
            if (matchedPatterns > 1) {
                score += matchedPatterns * 10;
            }

            // Kiểm tra intent đặc biệt cho category exploration
            if (intent.type === 'category_exploration') {
                const category = extractCategory(message);
                if (category) {
                    score += 50; // Bonus cao cho category exploration khi detect được category
                }
            }

            // Kiểm tra intent đặc biệt cho brand recommendation
            if (intent.type === 'brand_recommendation') {
                const brand = extractBrand(message);
                if (brand) {
                    score += 50; // Bonus cao cho brand recommendation khi detect được brand
                }
            }

            // Kiểm tra intent đặc biệt cho price range
            if (intent.type === 'price_range_recommendation') {
                const priceRange = extractPriceRange(message);
                if (priceRange.min !== null || priceRange.max !== null) {
                    score += 50; // Bonus cao cho price range khi detect được giá
                }
            }

            // Kiểm tra intent đặc biệt cho product consultation
            if (intent.type === 'product_consultation') {
                const productName = extractProductName(message);
                const hasConsultationKeywords = /(?:tư vấn|mô tả|thông tin về|chi tiết|thông số|cấu hình|đánh giá|review|có tốt không|có nên mua)/i.test(message);

                if (productName) {
                    score += 60; // Bonus cao nhất cho product consultation khi detect được tên sản phẩm
                } else if (hasConsultationKeywords) {
                    score += 40; // Bonus trung bình cho từ khóa tư vấn
                }
            }

            if (score > bestScore) {
                bestScore = score;
                bestIntent = intent;
            }
        }

        // Nếu tìm thấy intent với điểm > 0, trả về intent đó
        if (bestIntent && bestScore > 0) {
            return bestIntent;
        }

        // Nếu không tìm thấy, trả về intent fallback
        return await ChatbotIntent.findOne({ type: 'fallback' });
    } catch (error) {
        console.error('Error in findMatchingIntent:', error);
        return await ChatbotIntent.findOne({ type: 'fallback' });
    }
}

// Trích xuất từ khóa tìm kiếm từ tin nhắn
function extractKeywords(message) {
    // Loại bỏ các từ không cần thiết
    const stopWords = [
        'tôi', 'muốn', 'cần', 'tìm', 'kiếm', 'mua', 'một', 'cái', 'chiếc',
        'đang', 'giúp', 'cho', 'xin', 'về', 'của', 'có', 'không', 'xem',
        'được', 'là', 'và', 'hoặc', 'thì', 'sẽ', 'bị', 'bằng', 'trong',
        'ngoài', 'trên', 'dưới', 'với', 'từ', 'đến', 'cho', 'bởi'
    ];

    // Tách từ và loại bỏ stop words
    let keywords = message.toLowerCase().split(' ').filter(word =>
        word.length > 1 && !stopWords.includes(word)
    );

    // Nếu không có từ khóa nào, thử tìm category
    if (keywords.length === 0) {
        const category = extractCategory(message);
        if (category) {
            return category.toLowerCase();
        }
        // Fallback: sử dụng toàn bộ tin nhắn
        return message;
    }

    return keywords.join(' ');
}

// Trích xuất danh mục từ tin nhắn
function extractCategory(message) {
    const categoryMap = {
        // Smartphones - Điện thoại
        'điện thoại': 'Smartphones',
        'smartphone': 'Smartphones',
        'điện thoại di động': 'Smartphones',
        'phone': 'Smartphones',
        'mobile': 'Smartphones',
        'di động': 'Smartphones',
        'smart phone': 'Smartphones',
        'đt': 'Smartphones',
        'fone': 'Smartphones',
        'iphone': 'Smartphones',
        'samsung': 'Smartphones',
        'xiaomi': 'Smartphones',
        'oppo': 'Smartphones',
        'vivo': 'Smartphones',
        'nokia': 'Smartphones',
        'huawei': 'Smartphones',
        'realme': 'Smartphones',

        // Laptops - Máy tính
        'laptop': 'Laptops',
        'máy tính': 'Laptops',
        'máy tính xách tay': 'Laptops',
        'notebook': 'Laptops',
        'máy tính laptop': 'Laptops',
        'lap top': 'Laptops',
        'mt': 'Laptops',
        'computer': 'Laptops',
        'pc': 'Laptops',
        'macbook': 'Laptops',
        'thinkpad': 'Laptops',
        'gaming laptop': 'Laptops',
        'laptop gaming': 'Laptops',

        // Tablets - Máy tính bảng
        'máy tính bảng': 'Tablets',
        'tablet': 'Tablets',
        'ipad': 'Tablets',
        'máy tính bảng': 'Tablets',
        'tab': 'Tablets',
        'surface': 'Tablets',
        'galaxy tab': 'Tablets',

        // Accessories - Phụ kiện
        'phụ kiện': 'Accessories',
        'tai nghe': 'Accessories',
        'headphone': 'Accessories',
        'earphone': 'Accessories',
        'accessories': 'Accessories',
        'airpods': 'Accessories',
        'earpods': 'Accessories',
        'headset': 'Accessories',
        'speaker': 'Accessories',
        'loa': 'Accessories',
        'chuột': 'Accessories',
        'mouse': 'Accessories',
        'bàn phím': 'Accessories',
        'keyboard': 'Accessories',
        'sạc': 'Accessories',
        'charger': 'Accessories',
        'cáp': 'Accessories',
        'cable': 'Accessories',
        'ốp lưng': 'Accessories',
        'case': 'Accessories',
        'bao da': 'Accessories'
    };

    // Tìm kiếm chính xác trước
    for (const [key, value] of Object.entries(categoryMap)) {
        if (message.includes(key)) {
            return value;
        }
    }

    // Tìm kiếm mờ cho các từ khóa phổ biến
    const fuzzyMatches = [
        { patterns: ['phone', 'fone', 'điện thoại', 'đt'], category: 'Smartphones' },
        { patterns: ['laptop', 'máy tính', 'computer', 'pc'], category: 'Laptops' },
        { patterns: ['tablet', 'ipad', 'máy tính bảng'], category: 'Tablets' },
        { patterns: ['tai nghe', 'headphone', 'phụ kiện', 'accessories'], category: 'Accessories' }
    ];

    for (const match of fuzzyMatches) {
        for (const pattern of match.patterns) {
            if (message.includes(pattern)) {
                return match.category;
            }
        }
    }

    return null;
}

// Trích xuất thương hiệu từ tin nhắn
function extractBrand(message) {
    const brandPatterns = [
        { pattern: 'apple', brand: 'Apple' },
        { pattern: 'iphone', brand: 'Apple' },
        { pattern: 'macbook', brand: 'Apple' },
        { pattern: 'ipad', brand: 'Apple' },
        { pattern: 'samsung', brand: 'Samsung' },
        { pattern: 'galaxy', brand: 'Samsung' },
        { pattern: 'xiaomi', brand: 'Xiaomi' },
        { pattern: 'redmi', brand: 'Xiaomi' },
        { pattern: 'oppo', brand: 'OPPO' },
        { pattern: 'vivo', brand: 'Vivo' },
        { pattern: 'nokia', brand: 'Nokia' },
        { pattern: 'sony', brand: 'Sony' },
        { pattern: 'lg', brand: 'LG' },
        { pattern: 'dell', brand: 'Dell' },
        { pattern: 'hp', brand: 'HP' },
        { pattern: 'asus', brand: 'ASUS' },
        { pattern: 'acer', brand: 'Acer' },
        { pattern: 'lenovo', brand: 'Lenovo' },
        { pattern: 'msi', brand: 'MSI' },
        { pattern: 'gigabyte', brand: 'Gigabyte' },
        { pattern: 'jbl', brand: 'JBL' },
        { pattern: 'bose', brand: 'Bose' },
        { pattern: 'sennheiser', brand: 'Sennheiser' },
        { pattern: 'logitech', brand: 'Logitech' },
        { pattern: 'razer', brand: 'Razer' }
    ];

    for (const { pattern, brand } of brandPatterns) {
        if (message.includes(pattern)) {
            return brand;
        }
    }

    return null;
}

// Trích xuất tên sản phẩm từ tin nhắn
function extractProductName(message) {
    // Danh sách các sản phẩm và từ khóa nhận diện
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

        // Samsung Tablet
        { patterns: ['samsung galaxy tab s9 ultra', 'galaxy tab s9 ultra', 'tab s9 ultra'], name: 'Samsung Galaxy Tab S9 Ultra' },
        { patterns: ['samsung galaxy tab', 'galaxy tab'], name: 'Galaxy Tab' },

        // Headphones
        { patterns: ['sony wh-1000xm5', 'wh-1000xm5', 'sony wh1000xm5'], name: 'Sony WH-1000XM5' },
        { patterns: ['bose quietcomfort ultra', 'quietcomfort ultra', 'bose qc ultra'], name: 'Bose QuietComfort Ultra' },
        { patterns: ['apple airpods pro 2', 'airpods pro 2', 'airpods pro'], name: 'Apple AirPods Pro 2' },
        { patterns: ['airpods'], name: 'AirPods' },

        // Generic patterns
        { patterns: ['google pixel 8 pro', 'pixel 8 pro'], name: 'Google Pixel 8 Pro' },
        { patterns: ['oneplus 11', 'oneplus 11 5g'], name: 'OnePlus 11 5G' },
        { patterns: ['xiaomi 14 ultra'], name: 'Xiaomi 14 Ultra' },
        { patterns: ['nothing phone 2'], name: 'Nothing Phone 2' },
        { patterns: ['razer blade 18'], name: 'Razer Blade 18' }
    ];

    // Chuẩn hóa message
    const normalizedMessage = message.toLowerCase().replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();

    // Tìm pattern khớp nhất (ưu tiên pattern dài hơn)
    let bestMatch = null;
    let bestScore = 0;

    for (const productPattern of productPatterns) {
        for (const pattern of productPattern.patterns) {
            if (normalizedMessage.includes(pattern)) {
                const score = pattern.length; // Pattern dài hơn = chính xác hơn
                if (score > bestScore) {
                    bestScore = score;
                    bestMatch = productPattern.name;
                }
            }
        }
    }

    return bestMatch;
}

// Trích xuất khoảng giá từ tin nhắn
function extractPriceRange(message) {
    const priceRange = { min: null, max: null };

    // Chuẩn hóa tin nhắn
    const normalizedMessage = message.toLowerCase().replace(/\s+/g, ' ');
    console.log('Extracting price range from:', normalizedMessage);

    // Các pattern phức tạp hơn để nhận diện giá (USD)
    const patterns = [
        // USD patterns - "từ X đến Y USD" - more flexible
        {
            regex: /từ\s+(\d+)(?:\s*(?:usd|\$|dollar))?\s+đến\s+(\d+)(?:\s*(?:usd|\$|dollar))?/i,
            handler: (match) => {
                priceRange.min = parseInt(match[1]);
                priceRange.max = parseInt(match[2]);
            }
        },
        // Alternative pattern for range
        {
            regex: /(\d+)\s*(?:usd|\$|dollar)?\s*(?:đến|to|-)\s*(\d+)\s*(?:usd|\$|dollar)?/i,
            handler: (match) => {
                priceRange.min = parseInt(match[1]);
                priceRange.max = parseInt(match[2]);
            }
        },
        // "dưới X USD" - more flexible
        {
            regex: /dưới\s+(\d+)(?:\s*(?:usd|\$|dollar))?/i,
            handler: (match) => {
                priceRange.max = parseInt(match[1]);
            }
        },
        // "trên X USD" - more flexible
        {
            regex: /trên\s+(\d+)(?:\s*(?:usd|\$|dollar))?/i,
            handler: (match) => {
                priceRange.min = parseInt(match[1]);
            }
        },
        // "under X" or "below X"
        {
            regex: /(?:under|below)\s+(\d+)/i,
            handler: (match) => {
                priceRange.max = parseInt(match[1]);
            }
        },
        // "over X" or "above X"
        {
            regex: /(?:over|above)\s+(\d+)/i,
            handler: (match) => {
                priceRange.min = parseInt(match[1]);
            }
        },
        // "$X - $Y" format
        {
            regex: /\$(\d+)\s*-\s*\$(\d+)/i,
            handler: (match) => {
                priceRange.min = parseInt(match[1]);
                priceRange.max = parseInt(match[2]);
            }
        },
        // "khoảng X USD"
        {
            regex: /khoảng\s+(\d+)(?:\s*(?:usd|\$))?/i,
            handler: (match) => {
                const price = parseInt(match[1]);
                priceRange.min = price * 0.8;
                priceRange.max = price * 1.2;
            }
        },
        // "trong khoảng X USD"
        {
            regex: /trong\s+khoảng\s+(\d+)(?:\s*(?:usd|\$))?/i,
            handler: (match) => {
                const price = parseInt(match[1]);
                priceRange.min = price * 0.8;
                priceRange.max = price * 1.2;
            }
        },
        // Legacy Vietnamese patterns (for backward compatibility)
        // "từ X đến Y triệu"
        {
            regex: /từ\s+(\d+)(?:\s*(?:triệu|tr))\s+đến\s+(\d+)(?:\s*(?:triệu|tr))/i,
            handler: (match) => {
                priceRange.min = parseInt(match[1]) * 40; // Convert triệu to USD (rough conversion)
                priceRange.max = parseInt(match[2]) * 40;
            }
        },
        // "dưới X triệu"
        {
            regex: /dưới\s+(\d+)(?:\s*(?:triệu|tr))/i,
            handler: (match) => {
                priceRange.max = parseInt(match[1]) * 40; // Convert triệu to USD
            }
        },
        // "trên X triệu"
        {
            regex: /trên\s+(\d+)(?:\s*(?:triệu|tr))/i,
            handler: (match) => {
                priceRange.min = parseInt(match[1]) * 40; // Convert triệu to USD
            }
        },
        // Giá rẻ, bình dân
        {
            regex: /(?:rẻ|bình dân|giá rẻ|phải chăng|tiết kiệm|sinh viên|học sinh)/i,
            handler: () => {
                priceRange.max = 500; // Under $500
            }
        },
        // Cao cấp, đắt
        {
            regex: /(?:cao cấp|đắt|mắc|sang trọng|premium)/i,
            handler: () => {
                priceRange.min = 2000; // Over $2000
            }
        }
    ];

    // Thử từng pattern
    for (const pattern of patterns) {
        const match = normalizedMessage.match(pattern.regex);
        if (match) {
            console.log('Matched pattern:', pattern.regex, 'with result:', match);
            pattern.handler(match);
            break; // Dừng ở pattern đầu tiên khớp
        }
    }

    console.log('Final extracted price range:', priceRange);
    return priceRange;
}

// Tìm sản phẩm phù hợp với từ khóa
async function findProducts(keywords) {
    console.log('Searching products with keywords:', keywords);

    // Kiểm tra xem keywords có phải là category không
    const possibleCategory = extractCategory(keywords);
    if (possibleCategory) {
        console.log('Keywords match category:', possibleCategory);
        return await findProductsByCategory(possibleCategory);
    }

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

    console.log('Found products with regex search:', products.length);
    return products;
}

// Tìm sản phẩm theo thương hiệu và danh mục (nếu có)
async function findProductsByBrand(brand, category = null) {
    const query = { brand: brand };

    if (category) {
        query.category = category;
    }

    const products = await Product.find(query).limit(3);
    return products;
}

// Tìm sản phẩm theo danh mục
async function findProductsByCategory(category) {
    const products = await Product.find({ category: category }).limit(3);
    return products;
}

// Tìm sản phẩm theo khoảng giá và danh mục (nếu có)
async function findProductsByPriceRange(priceRange, category = null) {
    const query = {};

    console.log('Building price query with range:', priceRange);

    // Build price query
    if (priceRange.min !== null && priceRange.max !== null) {
        // Both min and max specified
        query.price = { $gte: priceRange.min, $lte: priceRange.max };
    } else if (priceRange.min !== null) {
        // Only minimum specified
        query.price = { $gte: priceRange.min };
    } else if (priceRange.max !== null) {
        // Only maximum specified
        query.price = { $lte: priceRange.max };
    }

    // Add category filter if specified
    if (category) {
        query.category = category;
    }

    console.log('Final query:', JSON.stringify(query));

    // Find products and sort by price
    const products = await Product.find(query).sort({ price: 1 }).limit(5);

    console.log(`Found ${products.length} products matching price range`);
    if (products.length > 0) {
        console.log('Price range of found products:',
            `$${Math.min(...products.map(p => p.price))} - $${Math.max(...products.map(p => p.price))}`);
    }

    return products;
}

// Tìm sản phẩm để tư vấn dựa trên tên
async function findProductForConsultation(productName) {
    console.log('Searching for product consultation:', productName);

    // Tìm kiếm chính xác trước
    let product = await Product.findOne({
        name: { $regex: new RegExp('^' + productName + '$', 'i') }
    });

    if (product) {
        console.log('Found exact match:', product.name);
        return product;
    }

    // Tìm kiếm mờ - tách từ khóa và tìm
    const keywords = productName.toLowerCase().split(' ').filter(word => word.length > 2);
    console.log('Searching with keywords:', keywords);

    // Tạo regex cho tìm kiếm mờ
    const regexPatterns = keywords.map(keyword => new RegExp(keyword, 'i'));

    // Tìm sản phẩm có chứa tất cả từ khóa
    const products = await Product.find({
        $and: regexPatterns.map(regex => ({ name: { $regex: regex } }))
    }).sort({ name: 1 });

    if (products.length > 0) {
        console.log('Found fuzzy matches:', products.length);
        // Trả về sản phẩm đầu tiên (có thể cải thiện bằng scoring)
        return products[0];
    }

    // Tìm kiếm theo brand nếu không tìm thấy
    const brandKeywords = ['apple', 'samsung', 'dell', 'hp', 'lenovo', 'asus', 'sony', 'bose', 'microsoft'];
    const foundBrand = brandKeywords.find(brand =>
        keywords.some(keyword => keyword.includes(brand))
    );

    if (foundBrand) {
        console.log('Searching by brand:', foundBrand);
        const brandProducts = await Product.find({
            brand: { $regex: new RegExp(foundBrand, 'i') }
        }).limit(1);

        if (brandProducts.length > 0) {
            return brandProducts[0];
        }
    }

    console.log('No product found for consultation');
    return null;
}

// Lấy các thương hiệu theo danh mục
async function getBrandsByCategory(category) {
    const products = await Product.find({ category: category });
    const brands = [...new Set(products.map(p => p.brand))];
    return brands;
}

// Tạo phản hồi với sản phẩm
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

    // Create enhanced response text for price range queries
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

// Tạo phản hồi tư vấn sản phẩm chi tiết
function createProductConsultationResponse(intent, product) {
    console.log('Creating consultation response for:', product.name);

    // Tạo mô tả chi tiết
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

    // Thông số kỹ thuật - Cải thiện cách hiển thị
    if (product.specifications && Object.keys(product.specifications).length > 0) {
        consultationText += `🔧 **Thông số kỹ thuật chi tiết:**\n`;

        // Nhóm các thông số theo loại
        const displaySpecs = product.specifications.Display ? `• **Màn hình:** ${product.specifications.Display}\n` : '';
        const processorSpecs = product.specifications.Processor ? `• **Bộ xử lý:** ${product.specifications.Processor}\n` : '';
        const ramSpecs = product.specifications.RAM ? `• **RAM:** ${product.specifications.RAM}\n` : '';
        const storageSpecs = product.specifications.Storage ? `• **Bộ nhớ:** ${product.specifications.Storage}\n` : '';
        const cameraSpecs = product.specifications.Camera ? `• **Camera:** ${product.specifications.Camera}\n` : '';
        const batterySpecs = product.specifications.Battery ? `• **Pin:** ${product.specifications.Battery}\n` : '';
        const osSpecs = product.specifications.OS ? `• **Hệ điều hành:** ${product.specifications.OS}\n` : '';

        // Thêm các thông số vào response
        consultationText += displaySpecs;
        consultationText += processorSpecs;
        consultationText += ramSpecs;
        consultationText += storageSpecs;
        consultationText += cameraSpecs;
        consultationText += batterySpecs;
        consultationText += osSpecs;

        // Thêm các thông số khác nếu có
        const otherSpecs = Object.entries(product.specifications)
            .filter(([key]) => !['Display', 'Processor', 'RAM', 'Storage', 'Camera', 'Battery', 'OS'].includes(key))
            .map(([key, value]) => `• **${key}:** ${value}\n`)
            .join('');



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

// Lấy lời tư vấn cụ thể theo danh mục
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

// Tạo phản hồi với thương hiệu theo danh mục
function createCategoryBrandsResponse(intent, category, brands) {
    if (brands.length === 0) {
        return {
            text: `Xin lỗi, tôi không tìm thấy thương hiệu nào trong danh mục ${getCategoryDisplayName(category)}. Bạn có thể thử danh mục khác không?`,
            intent: intent.type
        };
    }

    const brandsList = brands.join(', ');
    const categoryDisplayName = getCategoryDisplayName(category);
    const responseText = `${getRandomResponse(intent.responses)} ${brandsList}. Bạn quan tâm đến thương hiệu nào trong danh mục ${categoryDisplayName}?`;

    return {
        text: responseText,
        intent: intent.type,
        category: category,
        brands: brands
    };
}

// Hàm phụ trợ để lấy tên hiển thị của danh mục
function getCategoryDisplayName(category) {
    const categoryNames = {
        'Smartphones': 'điện thoại',
        'Laptops': 'laptop',
        'Tablets': 'máy tính bảng',
        'Accessories': 'phụ kiện'
    };

    return categoryNames[category] || category.toLowerCase();
}

// Lấy ngẫu nhiên một câu trả lời từ danh sách
function getRandomResponse(responses) {
    const randomIndex = Math.floor(Math.random() * responses.length);
    return responses[randomIndex];
}

module.exports = {
    processMessage
};
