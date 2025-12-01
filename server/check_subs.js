import pool from './config/database.js';

pool.query('SELECT c.course_code, c.name FROM course_subscriptions cs JOIN courses c ON cs.course_id = c.id WHERE cs.user_id = (SELECT id FROM users WHERE email = $1)', ['yehezkiel@usu.ac.id']).then(res => {
  console.log('📋 Yehezkiel subscriptions:');
  res.rows.forEach(row => console.log(`  - ${row.course_code}: ${row.name}`));
  process.exit(0);
}).catch(err => {
  console.log('❌ Error:', err.message);
  process.exit(1);
});
