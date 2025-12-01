import bcrypt from 'bcryptjs';
import pool from './config/database.js';

console.log('🔍 Testing login process...');

try {
  // 1. Check if user exists
  const userResult = await pool.query('SELECT * FROM users WHERE email = $1', ['yehezkiel@usu.ac.id']);
  
  if (userResult.rows.length === 0) {
    console.log('❌ User not found');
    process.exit(1);
  }
  
  const user = userResult.rows[0];
  console.log('✅ User found:', user.name);
  console.log('📧 Email:', user.email);
  console.log('🔐 Role:', user.role);
  console.log('🔑 Password hash length:', user.password_hash.length);
  console.log('🔑 Password hash starts with $2a$?:', user.password_hash.startsWith('$2a$'));
  
  // 2. Test password comparison
  const isValid = await bcrypt.compare('password123', user.password_hash);
  console.log('🔓 Password comparison result:', isValid ? '✅ Valid' : '❌ Invalid');
  
  if (!isValid) {
    console.log('🔧 Password hash is invalid, fixing...');
    const newHash = await bcrypt.hash('password123', 10);
    await pool.query('UPDATE users SET password_hash = $1 WHERE email = $2', [newHash, 'yehezkiel@usu.ac.id']);
    console.log('✅ Password hash fixed');
    
    // Test again
    const newValid = await bcrypt.compare('password123', newHash);
    console.log('🔓 New password comparison:', newValid ? '✅ Valid' : '❌ Invalid');
  }
  
  console.log('🎉 Login test completed!');
  process.exit(0);
} catch (error) {
  console.log('❌ Error:', error.message);
  process.exit(1);
}
