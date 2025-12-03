import pool from './config/database.js';

pool.query('SELECT NOW()')
  .then(res => {
    console.log('DB OK:', res.rows[0]);
    process.exit(0);
  })
  .catch(err => {
    console.error('DB Error:', err);
    process.exit(1);
  });
