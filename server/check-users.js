import pool from './config/database.js';

pool.query('SELECT email, role FROM users LIMIT 5')
  .then(res => {
    console.log('Users in database:');
    res.rows.forEach(row => {
      console.log(`- ${row.email} (${row.role})`);
    });
    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
