const mongoose = require('mongoose');
const config = require('./config');
const Order = require('./models/Order');

mongoose.connect(config.MONGODB_URI)
  .then(async () => {
    try {
      // Tổng số đơn hàng
      const totalOrders = await Order.countDocuments();
      console.log('Total orders:', totalOrders);
      
      // Đơn hàng theo trạng thái
      const pendingOrders = await Order.countDocuments({ status: 'pending' });
      const processingOrders = await Order.countDocuments({ status: 'processing' });
      const completedOrders = await Order.countDocuments({ status: 'completed' });
      const cancelledOrders = await Order.countDocuments({ status: 'cancelled' });
      
      console.log('Orders by status:');
      console.log({
        pending: pendingOrders,
        processing: processingOrders,
        completed: completedOrders,
        cancelled: cancelledOrders
      });
      
      // Tỷ lệ hoàn thành đơn hàng
      const orderCompletionRate = totalOrders > 0 ? (completedOrders / totalOrders * 100).toFixed(2) : 0;
      console.log('Order completion rate:', orderCompletionRate + '%');
      
      // Đơn hàng đã hoàn thành
      const completedOrdersData = await Order.find({ status: 'completed' });
      console.log('Completed orders:', completedOrdersData.length);
      
      // Tổng doanh thu
      let totalRevenue = 0;
      completedOrdersData.forEach(order => {
        totalRevenue += order.total;
      });
      console.log('Total revenue:', totalRevenue);
      
      // Giá trị đơn hàng trung bình
      const averageOrderValue = completedOrders > 0 ? (totalRevenue / completedOrders).toFixed(2) : 0;
      console.log('Average order value:', averageOrderValue);
      
      // Tổng số sản phẩm đã bán
      let totalProductsSold = 0;
      completedOrdersData.forEach(order => {
        const orderProductCount = order.items.reduce((sum, item) => sum + item.quantity, 0);
        totalProductsSold += orderProductCount;
        console.log(`Order ${order._id}: ${orderProductCount} products, ${order.total} revenue`);
      });
      console.log('Total products sold:', totalProductsSold);
      
      // Chi tiết đơn hàng đầu tiên
      if (completedOrdersData.length > 0) {
        const firstOrder = completedOrdersData[0];
        console.log('First order items:', JSON.stringify(firstOrder.items, null, 2));
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      mongoose.disconnect();
    }
  })
  .catch(err => console.error('Connection error:', err));
