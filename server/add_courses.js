import pool from './config/database.js';

console.log('📚 Adding course data...');

try {
  // Clear existing courses
  await pool.query('DELETE FROM courses');
  console.log('🧹 Cleared existing courses');
  
  // Get user IDs
  const usersResult = await pool.query('SELECT id, name, role FROM users');
  const users = usersResult.rows;
  
  const lecturer = users.find(u => u.name === 'Muhammad Syukron');
  const komting1 = users.find(u => u.name === 'Alya Debora');
  const komting2 = users.find(u => u.name === 'Anandhini');
  
  // Get room IDs
  const roomsResult = await pool.query('SELECT id, name FROM rooms');
  const rooms = roomsResult.rows;
  
  const lab2 = rooms.find(r => r.name === 'Lab 2');
  const lab3 = rooms.find(r => r.name === 'Lab 3');
  const gl1 = rooms.find(r => r.name === 'GL 1');
  const d101 = rooms.find(r => r.name === 'D-101');
  const d103 = rooms.find(r => r.name === 'D-103');
  const d104 = rooms.find(r => r.name === 'D-104');
  
  // Insert courses
  const courses = [
    {
      course_code: 'IF5041',
      name: 'Pemrograman Website',
      description: 'Pemrograman web dengan React dan Node.js',
      lecturer_id: lecturer.id,
      komting_id: komting1.id,
      default_day: 3, // Rabu
      default_start_time: '08:00:00',
      default_end_time: '10:30:00',
      default_room_id: d103.id,
      semester: 'Ganjil 2024/2025',
      academic_year: '2024/2025'
    },
    {
      course_code: 'IF5031',
      name: 'Basis Data',
      description: 'Database design dan SQL',
      lecturer_id: lecturer.id,
      komting_id: komting1.id,
      default_day: 3, // Rabu
      default_start_time: '14:40:00',
      default_end_time: '17:10:00',
      default_room_id: d103.id,
      semester: 'Ganjil 2024/2025',
      academic_year: '2024/2025'
    },
    {
      course_code: 'IF5021',
      name: 'Struktur Data',
      description: 'Data structures dan algorithms',
      lecturer_id: lecturer.id,
      komting_id: komting2.id,
      default_day: 5, // Jumat
      default_start_time: '13:50:00',
      default_end_time: '16:20:00',
      default_room_id: d101.id,
      semester: 'Ganjil 2024/2025',
      academic_year: '2024/2025'
    },
    {
      course_code: 'IF5011',
      name: 'Kecerdasan Buatan',
      description: 'Artificial Intelligence fundamentals',
      lecturer_id: lecturer.id,
      komting_id: komting2.id,
      default_day: 2, // Selasa
      default_start_time: '13:50:00',
      default_end_time: '16:20:00',
      default_room_id: d104.id,
      semester: 'Ganjil 2024/2025',
      academic_year: '2024/2025'
    },
    {
      course_code: 'IF6041',
      name: 'Etika Profesi',
      description: 'Professional ethics in IT',
      lecturer_id: lecturer.id,
      komting_id: komting1.id,
      default_day: 4, // Kamis
      default_start_time: '08:00:00',
      default_end_time: '09:40:00',
      default_room_id: d104.id,
      semester: 'Ganjil 2024/2025',
      academic_year: '2024/2025'
    },
    {
      course_code: 'IF6051',
      name: 'Wirausaha Digital',
      description: 'Digital entrepreneurship',
      lecturer_id: lecturer.id,
      komting_id: komting1.id,
      default_day: 4, // Kamis
      default_start_time: '10:00:00',
      default_end_time: '12:00:00',
      default_room_id: d104.id,
      semester: 'Ganjil 2024/2025',
      academic_year: '2024/2025'
    }
  ];
  
  for (const course of courses) {
    await pool.query(`
      INSERT INTO courses (course_code, name, description, lecturer_id, komting_id, 
                          default_day, default_start_time, default_end_time, default_room_id,
                          semester, academic_year, is_active)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    `, [
      course.course_code, course.name, course.description, course.lecturer_id, course.komting_id,
      course.default_day, course.default_start_time, course.default_end_time, course.default_room_id,
      course.semester, course.academic_year, true
    ]);
  }
  
  console.log('✅ Inserted 6 courses');
  
  // Add subscriptions for Yehezkiel (mahasiswa)
  const yehezkiel = users.find(u => u.name === 'Yehezkiel');
  const coursesResult = await pool.query('SELECT id FROM courses');
  const allCourses = coursesResult.rows;
  
  // Subscribe Yehezkiel to all courses (demo)
  for (const course of allCourses) {
    await pool.query(
      'INSERT INTO course_subscriptions (user_id, course_id) VALUES ($1, $2)',
      [yehezkiel.id, course.id]
    );
  }
  
  console.log('✅ Added course subscriptions for Yehezkiel');
  console.log('🎉 Course setup completed!');
  
  process.exit(0);
} catch (error) {
  console.log('❌ Error:', error.message);
  process.exit(1);
}
