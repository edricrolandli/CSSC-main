import pool from './config/database.js';

const insertData = async () => {
  try {
    console.log('🚀 Inserting schedule data...\n');
    
    // Insert rooms
    console.log('📍 Inserting rooms...');
    const roomCodes = ['D-101', 'D-102', 'D-103', 'D-104', 'D-105', 'D-106'];
    
    for (const roomCode of roomCodes) {
      await pool.query(
        `INSERT INTO rooms (name, building, floor, is_active) 
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (name) DO NOTHING`,
        [roomCode, 'Gedung D', '1', true]
      );
    }
    console.log(`✅ ${roomCodes.length} rooms inserted/updated`);
    
    // Get room IDs
    const roomsResult = await pool.query(
      `SELECT id, name FROM rooms WHERE name LIKE 'D-%' ORDER BY name`
    );
    const roomMap = {};
    roomsResult.rows.forEach(room => {
      roomMap[room.name] = room.id;
    });
    console.log(`✅ Room IDs mapped: ${Object.keys(roomMap).join(', ')}`);
    
    // Get course IDs
    const coursesResult = await pool.query(
      `SELECT id, name FROM courses`
    );
    const courseMap = {};
    coursesResult.rows.forEach(course => {
      courseMap[course.name] = course.id;
    });
    console.log(`✅ Course IDs mapped: ${Object.keys(courseMap).join(', ')}`);
    
    // Schedule data
    const schedules = [
      {
        course: 'Pemrograman Website',
        day: 3,
        start: '08:00',
        end: '10:30',
        room: 'D-103',
        lecturer: 'Dr. Dewi Sartika Br Ginting, S.Kom, M.Kom & Nurrahmadayeni M.Kom'
      },
      {
        course: 'Kecerdasan Buatan',
        day: 2,
        start: '13:50',
        end: '16:20',
        room: 'D-104',
        lecturer: 'Dr. Amalia, ST, MT & Dr. Pauzi Ibrahim Nainggolan, S.Komp., M.Sc'
      },
      {
        course: 'Basis Data',
        day: 3,
        start: '13:50',
        end: '17:10',
        room: 'D-103',
        lecturer: 'Insidini Fawwaz M.Kom & Dr. Dewi Sartika Br Ginting, S.Kom, M.Kom'
      },
      {
        course: 'Etika Profesi',
        day: 4,
        start: '08:00',
        end: '09:40',
        room: 'D-104',
        lecturer: 'Dr. Eng. Ade Candra & Dr.Ir. Elviawaty Muisa Zamzami, ST, MT'
      },
      {
        course: 'Wirausaha Digital',
        day: 5,
        start: '08:00',
        end: '09:40',
        room: 'D-104',
        lecturer: 'Dr. T. Henny Febriana Harumy S.Kom, M.Kom. & Dr. Fauzan Nurahmadi, S.Kom, M.Cs'
      },
      {
        course: 'Struktur Data',
        day: 5,
        start: '13:50',
        end: '16:20',
        room: 'D-101',
        lecturer: 'Insidini, S.Kom, M.Kom & Anandhini Medianty Nababan S. Kom., M. T'
      }
    ];
    
    console.log('\n📅 Inserting class schedules...');
    for (const schedule of schedules) {
      const courseId = courseMap[schedule.course];
      const roomId = roomMap[schedule.room];
      
      if (!courseId || !roomId) {
        console.log(`⚠️  Skipping ${schedule.course} - missing course or room`);
        continue;
      }
      
      await pool.query(
        `INSERT INTO class_schedules (course_id, day_of_week, start_time, end_time, room_id, lecturer_name, semester, academic_year)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT DO NOTHING`,
        [courseId, schedule.day, schedule.start, schedule.end, roomId, schedule.lecturer, 'Ganjil', '2025/2026']
      );
      console.log(`✅ ${schedule.course} (${schedule.room}) ${schedule.start}-${schedule.end}`);
    }
    
    // Verify data
    console.log('\n📋 Verifying inserted data...');
    const verifyResult = await pool.query(`
      SELECT 
        cs.id,
        c.name as course,
        cs.day_of_week,
        cs.start_time,
        cs.end_time,
        r.name as room,
        cs.lecturer_name
      FROM class_schedules cs
      JOIN courses c ON cs.course_id = c.id
      JOIN rooms r ON cs.room_id = r.id
      WHERE cs.semester = 'Ganjil' AND cs.academic_year = '2025/2026'
      ORDER BY cs.day_of_week, cs.start_time
    `);
    
    console.log(`\n✅ Total schedules in database: ${verifyResult.rows.length}`);
    verifyResult.rows.forEach(row => {
      const dayNames = ['', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
      console.log(`   ${dayNames[row.day_of_week]} | ${row.course} | ${row.start_time}-${row.end_time} @ ${row.room}`);
    });
    
    console.log('\n🎉 Data insertion completed successfully!');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

insertData();
