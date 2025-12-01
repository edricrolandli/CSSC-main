import pool from './config/database.js';

pool.query('SELECT email, name, role FROM users').then(res => {
  console.log('👥 Users in database:');
  res.rows.forEach(user => {
    console.log(`- ${user.name} (${user.email}) - ${user.role}`);
  });
  process.exit(0);
}).catch(err => {
  console.log('❌ Error:', err.message);
  process.exit(1);
});
