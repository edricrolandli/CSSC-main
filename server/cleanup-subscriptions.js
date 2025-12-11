import pool from './config/database.js';

async function cleanup() {
  try {
    // Clear all old subscriptions
    await pool.query('DELETE FROM user_class_schedules');
    await pool.query('DELETE FROM course_subscriptions');
    
    console.log('✅ Cleared all subscriptions - users start fresh');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

cleanup();