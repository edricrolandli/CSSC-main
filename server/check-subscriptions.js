import pool from './config/database.js';

async function checkSubscriptions() {
  try {
    console.log('=== COURSE SUBSCRIPTIONS ===');
    const subs = await pool.query(`
      SELECT cs.*, c.course_name, u.name as user_name 
      FROM course_subscriptions cs
      JOIN courses c ON cs.course_id = c.id
      JOIN users u ON cs.user_id = u.id
      ORDER BY cs.user_id
    `);
    console.table(subs.rows);
    
    console.log('=== USER CLASS SCHEDULES (OLD) ===');
    const oldSubs = await pool.query(`
      SELECT ucs.*, c.course_name, u.name as user_name 
      FROM user_class_schedules ucs
      JOIN class_schedules cls ON ucs.class_schedule_id = cls.id
      JOIN courses c ON cls.course_id = c.id
      JOIN users u ON ucs.user_id = u.id
      ORDER BY ucs.user_id
    `);
    console.table(oldSubs.rows);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkSubscriptions();