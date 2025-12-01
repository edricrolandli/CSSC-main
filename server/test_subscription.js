import pool from './config/database.js';

console.log('🔍 Testing subscription data...');

try {
  // Check user
  const userResult = await pool.query('SELECT id, name, email FROM users WHERE email = $1', ['yehezkiel@usu.ac.id']);
  const user = userResult.rows[0];
  console.log('✅ User found:', user.name, user.email);
  
  // Check courses
  const coursesResult = await pool.query('SELECT id, course_code, name FROM courses');
  console.log('📚 Available courses:');
  coursesResult.rows.forEach(course => {
    console.log(`  - ${course.course_code}: ${course.name}`);
  });
  
  // Check current subscriptions
  const subsResult = await pool.query('SELECT cs.course_id, c.course_code, c.name FROM course_subscriptions cs JOIN courses c ON cs.course_id = c.id WHERE cs.user_id = $1', [user.id]);
  console.log('📋 Current subscriptions:');
  subsResult.rows.forEach(sub => {
    console.log(`  - ${sub.course_code}: ${sub.name}`);
  });
  
  // Test subscription
  const firstCourse = coursesResult.rows[0];
  console.log(`🧪 Testing subscribe to ${firstCourse.course_code}...`);
  
  // Check if already subscribed
  const existingSub = subsResult.rows.find(sub => sub.course_id === firstCourse.id);
  if (existingSub) {
    console.log('⚠️  Already subscribed, testing unsubscribe...');
    await pool.query('DELETE FROM course_subscriptions WHERE user_id = $1 AND course_id = $2', [user.id, firstCourse.id]);
    console.log('✅ Unsubscribed successfully');
  } else {
    console.log('🧪 Testing subscribe...');
    await pool.query('INSERT INTO course_subscriptions (user_id, course_id) VALUES ($1, $2)', [user.id, firstCourse.id]);
    console.log('✅ Subscribed successfully');
  }
  
  console.log('🎉 Subscription test completed!');
} catch (error) {
  console.log('❌ Error:', error.message);
}
