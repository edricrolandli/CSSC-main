import pool from './config/database.js';

const checkSchema = async () => {
  try {
    console.log('🔍 Checking existing tables...\n');
    
    // Check if rooms table exists
    const roomsCheck = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'rooms'
    `);
    
    if (roomsCheck.rows.length > 0) {
      console.log('✅ Rooms table exists with columns:');
      roomsCheck.rows.forEach(col => {
        console.log(`   - ${col.column_name}: ${col.data_type}`);
      });
    } else {
      console.log('❌ Rooms table does not exist');
    }
    
    // Check if class_schedules table exists
    const schedulesCheck = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'class_schedules'
    `);
    
    if (schedulesCheck.rows.length > 0) {
      console.log('\n✅ Class_schedules table exists with columns:');
      schedulesCheck.rows.forEach(col => {
        console.log(`   - ${col.column_name}: ${col.data_type}`);
      });
    } else {
      console.log('\n❌ Class_schedules table does not exist');
    }
    
    // Check courses
    const coursesCheck = await pool.query('SELECT id, name FROM courses LIMIT 5');
    console.log(`\n✅ Courses in database: ${coursesCheck.rows.length}`);
    coursesCheck.rows.forEach(course => {
      console.log(`   - ${course.name}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    process.exit(0);
  }
};

checkSchema();
