import jwt from 'jsonwebtoken';
import pool from './config/database.js';

console.log('🔍 Debug token parsing...');

try {
  // Get user
  const userResult = await pool.query('SELECT id, name, email, role FROM users WHERE email = $1', ['yehezkiel@usu.ac.id']);
  const user = userResult.rows[0];
  
  // Generate token like login does
  const token = jwt.sign(
    { 
      id: user.id, 
      email: user.email, 
      role: user.role,
      name: user.name 
    },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
  
  console.log('✅ Token generated');
  console.log('👤 User ID in token generation:', user.id);
  
  // Parse token like middleware does
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  console.log('🔓 Decoded token:', decoded);
  console.log('🆔 User ID from decoded:', decoded.id);
  
  // Test API call with this token
  console.log('\n🧪 Testing API with correct token...');
  
  const API_BASE = 'http://localhost:5000/api';
  
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
    const errorData = await subsResponse.json();
    console.log('Error details:', errorData);
  }
  
} catch (error) {
  console.log('❌ Error:', error.message);
}
