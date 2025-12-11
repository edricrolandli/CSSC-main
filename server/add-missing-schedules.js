import pool from './config/database.js';

async function addMissingSchedules() {
  try {
    // Get courses without class_schedules
    const coursesWithoutSchedules = await pool.query(`
      SELECT c.id, c.course_name 
      FROM courses c 
      WHERE NOT EXISTS (
        SELECT 1 FROM class_schedules cs WHERE cs.course_id = c.id
      )
    `);
    
    console.log('Courses without schedules:', coursesWithoutSchedules.rows.length);
    
    // Add default schedules for missing courses
    for (const course of coursesWithoutSchedules.rows) {
      // Random day (1-5 = Monday-Friday), time, and room
      const day = Math.floor(Math.random() * 5) + 1;
      const startHour = Math.floor(Math.random() * 8) + 8; // 8-15
      const endHour = startHour + 2; // 2 hour duration
      const roomId = Math.floor(Math.random() * 6) + 1; // rooms 1-6
      
      await pool.query(`
        INSERT INTO class_schedules 
        (course_id, day_of_week, start_time, end_time, room_id, lecturer_name, semester, academic_year)
        VALUES ($1, $2, $3, $4, $5, 'Dosen', 'Ganjil', '2025/2026')
      `, [
        course.id, 
        day, 
        `${startHour.toString().padStart(2, '0')}:00:00`,
        `${endHour.toString().padStart(2, '0')}:00:00`,
        roomId
      ]);
      
      console.log(`Added schedule for ${course.course_name}`);
    }
    
    console.log('✅ All courses now have schedules');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

addMissingSchedules();