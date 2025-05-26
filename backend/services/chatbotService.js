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
