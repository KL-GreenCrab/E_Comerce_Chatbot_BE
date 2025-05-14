const intents = [
    {
        type: 'greeting',
        patterns: [
            'xin chào', 'chào bạn', 'hello', 'hi', 'hey', 'chào',
            'bắt đầu', 'giúp tôi', 'tôi cần giúp đỡ'
        ],
        responses: [
            'Xin chào! Tôi có thể giúp gì cho bạn?',
            'Chào bạn! Bạn đang tìm kiếm sản phẩm nào?',
            'Xin chào! Tôi là trợ lý ảo của cửa hàng. Tôi có thể giúp bạn tìm sản phẩm, kiểm tra đơn hàng hoặc trả lời các câu hỏi về chính sách của chúng tôi.'
        ],
        requiresProductQuery: false
    },
    {
        type: 'product_search',
        patterns: [
            'tìm', 'tìm kiếm', 'mua', 'sản phẩm', 'tôi muốn mua',
            'tôi đang tìm', 'có bán', 'bán không', 'tôi cần',
            'tìm giúp tôi', 'tôi muốn tìm', 'tôi đang cần'
        ],
        responses: [
            'Đây là một số sản phẩm phù hợp với yêu cầu của bạn:',
            'Tôi đã tìm thấy những sản phẩm sau đây:',
            'Dựa trên yêu cầu của bạn, đây là các sản phẩm phù hợp:'
        ],
        requiresProductQuery: true
    },
    {
        type: 'shipping',
        patterns: [
            'vận chuyển', 'giao hàng', 'ship', 'thời gian giao',
            'phí vận chuyển', 'phí giao hàng', 'giao trong bao lâu',
            'khi nào nhận được', 'mất bao lâu để nhận'
        ],
        responses: [
            'Chúng tôi giao hàng trong vòng 2-3 ngày làm việc đối với khu vực nội thành và 3-5 ngày đối với các tỉnh thành khác.',
            'Phí vận chuyển của chúng tôi là 30.000đ cho đơn hàng dưới 500.000đ. Miễn phí vận chuyển cho đơn hàng từ 500.000đ trở lên.',
            'Bạn có thể theo dõi đơn hàng của mình trong phần "Đơn hàng của tôi" sau khi đăng nhập.'
        ],
        requiresProductQuery: false
    },
    {
        type: 'payment',
        patterns: [
            'thanh toán', 'trả tiền', 'phương thức thanh toán',
            'tiền mặt', 'thẻ tín dụng', 'chuyển khoản', 'momo',
            'ví điện tử', 'zalopay', 'cod'
        ],
        responses: [
            'Chúng tôi chấp nhận nhiều phương thức thanh toán: tiền mặt khi nhận hàng (COD), thẻ tín dụng/ghi nợ, chuyển khoản ngân hàng và các ví điện tử như MoMo, ZaloPay.',
            'Bạn có thể thanh toán bằng tiền mặt khi nhận hàng hoặc thanh toán trực tuyến qua thẻ, chuyển khoản hoặc ví điện tử.',
            'Để thanh toán, bạn có thể chọn một trong các phương thức: COD, thẻ tín dụng, chuyển khoản ngân hàng hoặc ví điện tử.'
        ],
        requiresProductQuery: false
    },
    {
        type: 'return_policy',
        patterns: [
            'đổi trả', 'trả lại', 'hoàn tiền', 'chính sách đổi trả',
            'đổi sản phẩm', 'trả hàng', 'không vừa ý', 'không hài lòng',
            'lỗi sản phẩm', 'hư hỏng'
        ],
        responses: [
            'Chúng tôi chấp nhận đổi trả trong vòng 7 ngày kể từ ngày nhận hàng nếu sản phẩm còn nguyên vẹn và có hóa đơn mua hàng.',
            'Nếu sản phẩm bị lỗi do nhà sản xuất, chúng tôi sẽ đổi mới hoặc hoàn tiền 100% trong vòng 30 ngày.',
            'Để đổi trả sản phẩm, vui lòng liên hệ với chúng tôi qua số hotline hoặc email support@example.com với thông tin đơn hàng của bạn.'
        ],
        requiresProductQuery: false
    },
    {
        type: 'fallback',
        patterns: [],
        responses: [
            'Xin lỗi, tôi không hiểu ý của bạn. Bạn có thể diễn đạt lại được không?',
            'Tôi chưa được lập trình để hiểu câu hỏi này. Bạn có thể hỏi về sản phẩm, vận chuyển, thanh toán hoặc chính sách đổi trả.',
            'Tôi không chắc mình hiểu đúng ý bạn. Bạn có thể hỏi theo cách khác được không?'
        ],
        requiresProductQuery: false
    }
];

module.exports = intents;
