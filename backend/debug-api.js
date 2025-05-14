const axios = require('axios');

// Lấy token từ tham số dòng lệnh
const token = process.argv[2];

if (!token) {
  console.error('Vui lòng cung cấp token: node debug-api.js <token>');
  process.exit(1);
}

async function fetchStats() {
  try {
    const response = await axios.get('http://localhost:5000/api/admin/stats', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('API Response:', JSON.stringify(response.data, null, 2));
    
    // Kiểm tra các giá trị cụ thể
    const { totalProductsSold, orderCompletionRate, averageOrderValue } = response.data;
    console.log('\nGiá trị cụ thể:');
    console.log('- totalProductsSold:', totalProductsSold, typeof totalProductsSold);
    console.log('- orderCompletionRate:', orderCompletionRate, typeof orderCompletionRate);
    console.log('- averageOrderValue:', averageOrderValue, typeof averageOrderValue);
  } catch (error) {
    console.error('Error fetching stats:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
  }
}

fetchStats();
