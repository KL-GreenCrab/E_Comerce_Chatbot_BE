const axios = require('axios');

// Thông tin đăng nhập admin
const loginData = {
  email: 'admin@example.com',
  password: 'admin123'
};

async function loginAndFetchStats() {
  try {
    // Đăng nhập để lấy token
    console.log('Đang đăng nhập...');
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', loginData);
    const token = loginResponse.data.token;
    
    if (!token) {
      console.error('Không thể lấy token');
      return;
    }
    
    console.log('Đăng nhập thành công, token:', token);
    
    // Lấy thống kê
    console.log('\nĐang lấy thống kê...');
    const statsResponse = await axios.get('http://localhost:5000/api/admin/stats', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('API Response:', JSON.stringify(statsResponse.data, null, 2));
    
    // Kiểm tra các giá trị cụ thể
    const { totalProductsSold, orderCompletionRate, averageOrderValue } = statsResponse.data;
    console.log('\nGiá trị cụ thể:');
    console.log('- totalProductsSold:', totalProductsSold, typeof totalProductsSold);
    console.log('- orderCompletionRate:', orderCompletionRate, typeof orderCompletionRate);
    console.log('- averageOrderValue:', averageOrderValue, typeof averageOrderValue);
  } catch (error) {
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
  }
}

loginAndFetchStats();
