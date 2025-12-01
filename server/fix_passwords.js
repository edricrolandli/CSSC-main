import bcrypt from 'bcryptjs';
import pool from './config/database.js';

console.log('🔧 Fixing password hashes...');

try {
  const users = [
    { email: 'yehezkiel@usu.ac.id', name: 'Yehezkiel', role: 'mahasiswa', phone: '+6281234567890' },
    { email: 'syukron@usu.ac.id', name: 'Muhammad Syukron', role: 'dosen', phone: '+6281234567891' },
    { email: 'alya@usu.ac.id', name: 'Alya Debora', role: 'komting', phone: '+6281234567892' },
    { email: 'taufik@usu.ac.id', name: 'Taufik Akbar', role: 'dosen', phone: '+6281234567893' },
    { email: 'anandhini@usu.ac.id', name: 'Anandhini', role: 'komting', phone: '+6281234567894' }
  ];

  // Clear and re-insert users with proper password hashes
  await pool.query('DELETE FROM users');
  
  for (const user of users) {
    const hashedPassword = await bcrypt.hash('password123', 10);
    await pool.query(
      'INSERT INTO users (name, email, password_hash, role, phone) VALUES ($1, $2, $3, $4, $5)',
      [user.name, user.email, hashedPassword, user.role, user.phone]
    );
    console.log(`✅ Fixed user: ${user.name}`);
  }
  
  console.log('🎉 Password hashes fixed!');
  process.exit(0);
} catch (error) {
  console.log('❌ Error:', error.message);
  process.exit(1);
}
