import pool from './config/database.js';
import jwt from 'jsonwebtoken';

console.log('🔍 Testing API with authentication...');

try {
  // Get user and create token
  const userResult = await pool.query('SELECT id, name, email, role FROM users WHERE email = $1', ['yehezkiel@usu.ac.id']);
  const user = userResult.rows[0];
  
  const token = jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET || 'your_jwt_secret_key_here_make_it_long_and_random',
    { expiresIn: '7d' }
  );
  
  console.log('✅ Token created for:', user.name);
  console.log('🔑 Token:', token.substring(0, 50) + '...');
  
  // Test API calls
  const API_BASE = 'http://localhost:5000/api';
  
  console.log('\n🧪 Testing API endpoints...');
  
  // Test get subscriptions
  const subsResponse = await fetch(`${API_BASE}/courses/my/subscriptions`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  
  if (subsResponse.ok) {
    const subsData = await subsResponse.json();
    console.log('✅ Get subscriptions:', subsData.subscriptions?.length || 0, 'courses');
  } else {
    console.log('❌ Get subscriptions failed:', subsResponse.status);
  }
  
  // Test subscribe
  const coursesResult = await pool.query('SELECT id FROM courses LIMIT 1');
  const courseId = coursesResult.rows[0].id;
  
  console.log(`\n🧪 Testing subscribe to course ${courseId}...`);
  
  const subscribeResponse = await fetch(`${API_BASE}/courses/subscribe`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ course_id: courseId })
  });
  
  if (subscribeResponse.ok) {
    console.log('✅ Subscribe successful');
  } else {
    const errorData = await subscribeResponse.json();
    console.log('❌ Subscribe failed:', subscribeResponse.status, errorData);
  }
  
} catch (error) {
  console.log('❌ Error:', error.message);
}
