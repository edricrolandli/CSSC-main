import jwt from 'jsonwebtoken';
import pool from './config/database.js';

console.log('🔍 Debug API response...');

try {
  // Get user and token
  const userResult = await pool.query('SELECT id, name, email, role FROM users WHERE email = $1', ['yehezkiel@usu.ac.id']);
  const user = userResult.rows[0];
  
  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
  
  // Test API response directly
  const API_BASE = 'http://localhost:5000/api';
  
  console.log('🧪 Testing /courses/my/subscriptions API...');
  
  const subsResponse = await fetch(`${API_BASE}/courses/my/subscriptions`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  
  if (subsResponse.ok) {
    const subsData = await subsResponse.json();
    console.log('✅ API Response:', JSON.stringify(subsData, null, 2));
    
    if (subsData.subscriptions && subsData.subscriptions.length > 0) {
      console.log('📋 First subscription object:', JSON.stringify(subsData.subscriptions[0], null, 2));
    }
  } else {
    console.log('❌ API failed:', subsResponse.status);
    const errorData = await subsResponse.json();
    console.log('Error:', errorData);
  }
  
} catch (error) {
  console.log('❌ Error:', error.message);
}
