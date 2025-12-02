import fs from 'fs';
import path from 'path';
import pool from './config/database.js';

const runMigration = async () => {
  try {
    console.log('🚀 Running migration: add_schedule_tables.sql');
    
    const migrationPath = path.join(process.cwd(), 'migrations', 'add_schedule_tables.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');
    
    // Split by semicolon and execute each statement
    const statements = sql.split(';').filter(stmt => stmt.trim());
    
    for (const statement of statements) {
      if (statement.trim()) {
        console.log('📝 Executing:', statement.substring(0, 50) + '...');
        await pool.query(statement);
      }
    }
    
    console.log('✅ Migration completed successfully!');
    
    // Verify data
    console.log('\n📋 Verifying data...');
    
    const roomsResult = await pool.query('SELECT * FROM rooms ORDER BY room_code');
    console.log(`✅ Rooms created: ${roomsResult.rows.length}`);
    roomsResult.rows.forEach(room => {
      console.log(`   - ${room.room_code} (${room.building})`);
    });
    
    const schedulesResult = await pool.query(`
      SELECT cs.id, c.name, cs.day_of_week, cs.start_time, cs.end_time, r.room_code, cs.lecturer_name
      FROM class_schedules cs
      JOIN courses c ON cs.course_id = c.id
      JOIN rooms r ON cs.room_id = r.id
      ORDER BY cs.day_of_week, cs.start_time
    `);
    console.log(`\n✅ Class schedules created: ${schedulesResult.rows.length}`);
    schedulesResult.rows.forEach(schedule => {
      console.log(`   - ${schedule.name} (${schedule.day_of_week}) ${schedule.start_time} - ${schedule.end_time} @ ${schedule.room_code}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
};

runMigration();
