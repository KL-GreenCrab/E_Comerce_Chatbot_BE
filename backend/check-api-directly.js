const mongoose = require('mongoose');
const config = require('./config');
const Order = require('./models/Order');

// Hàm kiểm tra API endpoint
async function checkApiEndpoint() {
  try {
    await mongoose.connect(config.MONGODB_URI);
    console.log('Đã kết nối với MongoDB');
    
    // Tính tổng số sản phẩm
    const totalProducts = 22; // Giả định từ hình ảnh
    
    // Tính tổng số đơn hàng
    const totalOrders = await Order.countDocuments();
    
    // Tính số đơn hàng theo trạng thái
    const pendingOrders = await Order.countDocuments({ status: 'pending' });
    const processingOrders = await Order.countDocuments({ status: 'processing' });
    const completedOrders = await Order.countDocuments({ status: 'completed' });
    const cancelledOrders = await Order.countDocuments({ status: 'cancelled' });
    
    // Tính tỷ lệ hoàn thành đơn hàng
    const orderCompletionRate = totalOrders > 0 ? (completedOrders / totalOrders * 100).toFixed(2) : 0;
    
    // Tính tổng doanh thu từ đơn hàng đã hoàn thành
    const completedOrdersData = await Order.find({ status: 'completed' });
    const totalRevenue = completedOrdersData.reduce((sum, order) => sum + order.total, 0);
    
    // Tính tổng số sản phẩm đã bán
    const totalProductsSold = completedOrdersData.reduce((sum, order) => {
      return sum + order.items.reduce((itemSum, item) => itemSum + item.quantity, 0);
    }, 0);
    
    // Tính doanh thu trung bình trên mỗi đơn hàng
    const averageOrderValue = completedOrders > 0 ? (totalRevenue / completedOrders).toFixed(2) : 0;
    
    // Tạo đối tượng response giống như API endpoint
    const response = {
      totalProducts,
      totalOrders,
      ordersByStatus: {
        pending: pendingOrders,
        processing: processingOrders,
        completed: completedOrders,
        cancelled: cancelledOrders
      },
      orderCompletionRate,
      totalRevenue,
      totalProductsSold,
      averageOrderValue
    };
    
    console.log('API Response (mô phỏng):', JSON.stringify(response, null, 2));
    
    // Kiểm tra các giá trị cụ thể
    console.log('\nGiá trị cụ thể:');
    console.log('- totalProductsSold:', totalProductsSold, typeof totalProductsSold);
    console.log('- orderCompletionRate:', orderCompletionRate, typeof orderCompletionRate);
    console.log('- averageOrderValue:', averageOrderValue, typeof averageOrderValue);
    
    // Kiểm tra chi tiết đơn hàng
    console.log('\nChi tiết đơn hàng:');
    completedOrdersData.forEach((order, index) => {
      console.log(`Đơn hàng ${index + 1} (${order._id}):`);
      console.log('- Tổng tiền:', order.total);
      console.log('- Số sản phẩm:', order.items.length);
      console.log('- Chi tiết sản phẩm:');
      order.items.forEach(item => {
        console.log(`  + ${item.name}: ${item.quantity} x ${item.price} = ${item.quantity * item.price}`);
      });
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Đã ngắt kết nối với MongoDB');
  }
}

checkApiEndpoint();
