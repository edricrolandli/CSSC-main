import jwt from 'jsonwebtoken';
import pool from './config/database.js';

console.log('🧪 Testing schedule endpoint...\n');

try {
  // Get a user
  const userResult = await pool.query('SELECT id FROM users WHERE email = $1', ['yehezkiel@usu.ac.id']);
  const user = userResult.rows[0];
  
  if (!user) {
    console.log('❌ User not found');
    process.exit(1);
  }
  
  console.log(`✅ Found user: ${user.id}`);
  
  // Generate token
  const token = jwt.sign(
    { id: user.id, email: 'yehezkiel@usu.ac.id', role: 'mahasiswa', name: 'Yehezkiel' },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
  
  console.log(`✅ Generated token`);
  
  // Test the endpoint
  console.log('\n🔍 Testing GET /api/courses/schedules/my...');
  
  const response = await fetch('http://localhost:5000/api/courses/schedules/my', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  
  console.log(`Status: ${response.status}`);
  
  if (!response.ok) {
    const errorData = await response.json();
    console.log('❌ Error:', errorData);
  } else {
    const data = await response.json();
    console.log(`✅ Success! Found ${data.total} schedules`);
    if (data.schedules.length > 0) {
      console.log('\n📅 Sample schedules:');
      data.schedules.slice(0, 3).forEach(schedule => {
        console.log(`   - ${schedule.course_name} (${schedule.day_of_week}) ${schedule.start_time}-${schedule.end_time} @ ${schedule.room_code}`);
      });
    }
  }
  
  process.exit(0);
  
} catch (error) {
  console.log('❌ Error:', error.message);
  process.exit(1);
}
