import bcrypt from 'bcryptjs';
import pool from '../config/database.js';

async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...');
    
    // Clear existing data
    await pool.query('TRUNCATE TABLE course_subscriptions, schedule_events, courses, rooms, users RESTART IDENTITY CASCADE');
    console.log('🧹 Cleared existing data');
    
    // Insert Rooms
    const roomsData = [
      { name: 'Lab 2', capacity: 30, floor: '2', building: 'Gedung Lab', description: 'Laboratorium Komputer 2' },
      { name: 'Lab 3', capacity: 30, floor: '2', building: 'Gedung Lab', description: 'Laboratorium Komputer 3' },
      { name: 'GL 1', capacity: 50, floor: '1', building: 'Gedung Kuliah', description: 'Gedung Kuliah Lantai 1' },
      { name: 'D-101', capacity: 40, floor: '1', building: 'Gedung D', description: 'Ruang D-101' },
      { name: 'D-103', capacity: 40, floor: '1', building: 'Gedung D', description: 'Ruang D-103' },
      { name: 'D-104', capacity: 40, floor: '1', building: 'Gedung D', description: 'Ruang D-104' }
    ];
    
    const roomsResult = await pool.query(`
      INSERT INTO rooms (name, capacity, floor, building, description)
      VALUES ${roomsData.map((_, i) => `($${i*4+1}, $${i*4+2}, $${i*4+3}, $${i*4+4}, $${i*4+5})`).join(', ')}
      RETURNING id, name
    `, roomsData.flatMap(room => [room.name, room.capacity, room.floor, room.building, room.description]));
    
    console.log('🏫 Rooms created:', roomsResult.rows.map(r => r.name));
    
    // Insert Users
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    const usersData = [
      { name: 'Yehezkiel', email: 'yehezkiel@usu.ac.id', role: 'mahasiswa', phone: '+62812345678' },
      { name: 'Muhammad Syukron Jazila', email: 'syukron@usu.ac.id', role: 'dosen', phone: '+62812345679' },
      { name: 'Alya Debora Panggabean', email: 'alya@usu.ac.id', role: 'komting', phone: '+62812345680' },
      { name: 'Anandhini Medianty Nababan', email: 'anandhini@usu.ac.id', role: 'dosen', phone: '+62812345681' },
      { name: 'Muhammad Dzakwan Attaqiy', email: 'dzakwan@usu.ac.id', role: 'komting', phone: '+62812345682' }
    ];
    
    const usersResult = await pool.query(`
      INSERT INTO users (name, email, password_hash, role, phone)
      VALUES ${usersData.map((_, i) => `($${i*5+1}, $${i*5+2}, $${i*5+3}, $${i*5+4}, $${i*5+5})`).join(', ')}
      RETURNING id, name, role
    `, usersData.flatMap(user => [user.name, user.email, hashedPassword, user.role, user.phone]));
    
    console.log('👥 Users created:', usersResult.rows.map(u => `${u.name} (${u.role})`));
    
    // Initialize all mappings at the beginning
    const roomMap = {};
    const userMap = {};
    const emailToUserMap = {};
    
    // Populate room map
    roomsResult.rows.forEach(room => {
      roomMap[room.name] = room.id;
    });
    
    // Populate user maps
    usersResult.rows.forEach(user => {
      userMap[user.name] = user.id;
      if (user.email) {
        emailToUserMap[user.email] = user.id;
      }
    });
    
    // Insert Courses
    const coursesData = [
      {
        code: 'PW202',
        name: 'Pemrograman Website',
        lecturer_id: usersResult.rows[1].id, // Dosen pertama
        komting_id: usersResult.rows[2].id,  // Komting pertama
        default_day: 3, // Rabu
        default_start_time: '08:00:00',
        default_end_time: '10:30:00',
        default_room_id: roomMap['D-103'],
        semester: 'Ganjil',
        academic_year: '2024/2025'
      },
      {
        code: 'KB202',
        name: 'Kecerdasan Buatan',
        lecturer_id: usersResult.rows[1].id,
        komting_id: usersResult.rows[2].id,
        default_day: 2, // Selasa
        default_start_time: '13:50:00',
        default_end_time: '16:20:00',
        default_room_id: roomMap['D-104'],
        semester: 'Ganjil',
        academic_year: '2024/2025'
      },
      {
        code: 'BD202',
        name: 'Basis Data',
        lecturer_id: usersResult.rows[3].id, // Dosen kedua
        komting_id: usersResult.rows[4].id,  // Komting kedua
        default_day: 3, // Rabu
        default_start_time: '13:50:00',
        default_end_time: '17:10:00',
        default_room_id: roomMap['D-103'],
        semester: 'Ganjil',
        academic_year: '2024/2025'
      },
      {
        code: 'EP202',
        name: 'Etika Profesi',
        lecturer_id: usersResult.rows[3].id,
        komting_id: usersResult.rows[2].id,
        default_day: 4, // Kamis
        default_start_time: '08:00:00',
        default_end_time: '09:40:00',
        default_room_id: roomMap['D-104'],
        semester: 'Ganjil',
        academic_year: '2024/2025'
      },
      {
        code: 'WD202',
        name: 'Wirausaha Digital',
        lecturer_id: usersResult.rows[1].id,
        komting_id: usersResult.rows[4].id,
        default_day: 5, // Jumat
        default_start_time: '08:00:00',
        default_end_time: '09:40:00',
        default_room_id: roomMap['D-104'],
        semester: 'Ganjil',
        academic_year: '2024/2025'
      },
      {
        code: 'SD202',
        name: 'Struktur Data',
        lecturer_id: usersResult.rows[3].id,
        komting_id: usersResult.rows[2].id,
        default_day: 5, // Jumat
        default_start_time: '13:50:00',
        default_end_time: '16:20:00',
        default_room_id: roomMap['D-101'],
        semester: 'Ganjil',
        academic_year: '2024/2025'
      }
    ];
    
    // Insert courses
    const coursesResult = await pool.query(`
      INSERT INTO courses (course_code, name, lecturer_id, komting_id, default_day, 
                          default_start_time, default_end_time, default_room_id, 
                          semester, academic_year)
      VALUES ${coursesData.map((_, i) => 
        `($${i*10+1}, $${i*10+2}, $${i*10+3}, $${i*10+4}, $${i*10+5}, $${i*10+6}, $${i*10+7}, $${i*10+8}, $${i*10+9}, $${i*10+10})`
      ).join(', ')}
      RETURNING id, name, course_code
    `, coursesData.flatMap(course => [
      course.code, course.name, course.lecturer_id, course.komting_id, course.default_day,
      course.default_start_time, course.default_end_time, course.default_room_id,
      course.semester, course.academic_year
    ]));
    
    console.log('📚 Courses created:', coursesResult.rows.map(c => `${c.course_code} - ${c.name}`));
    
    // Create course map
    const courseMap = {};
    coursesResult.rows.forEach(course => {
      courseMap[course.name] = course.id;
    });
    
    // Insert class schedules
    const classSchedules = [
      {
        course_name: 'Pemrograman Website',
        day_of_week: 3, // Rabu
        start_time: '08:00:00',
        end_time: '10:30:00',
        room_code: 'D-103',
        lecturer_name: usersResult.rows[1].name // Menggunakan nama dosen dari data yang sudah ada
      },
      {
        course_name: 'Kecerdasan Buatan',
        day_of_week: 2, // Selasa
        start_time: '13:50:00',
        end_time: '16:20:00',
        room_code: 'D-104',
        lecturer_name: usersResult.rows[1].name
      },
      {
        course_name: 'Basis Data',
        day_of_week: 3, // Rabu
        start_time: '13:50:00',
        end_time: '17:10:00',
        room_code: 'D-103',
        lecturer_name: usersResult.rows[3].name
      },
      {
        course_name: 'Etika Profesi',
        day_of_week: 4, // Kamis
        start_time: '08:00:00',
        end_time: '09:40:00',
        room_code: 'D-104',
        lecturer_name: usersResult.rows[3].name
      },
      {
        course_name: 'Wirausaha Digital',
        day_of_week: 5, // Jumat
        start_time: '08:00:00',
        end_time: '09:40:00',
        room_code: 'D-104',
        lecturer_name: usersResult.rows[1].name
      },
      {
        course_name: 'Struktur Data',
        day_of_week: 5, // Jumat
        start_time: '13:50:00',
        end_time: '16:20:00',
        room_code: 'D-101',
        lecturer_name: usersResult.rows[3].name
      }
    ];
    
    // Insert class schedules
    for (const schedule of classSchedules) {
      await pool.query(
        `INSERT INTO class_schedules 
         (course_id, day_of_week, start_time, end_time, room_id, lecturer_name, semester, academic_year)
         VALUES ($1, $2, $3, $4, $5, $6, 'Ganjil', '2024/2025')`,
        [
          courseMap[schedule.course_name],
          schedule.day_of_week,
          schedule.start_time,
          schedule.end_time,
          roomMap[schedule.room_code],
          schedule.lecturer_name
        ]
      );
    }
    console.log('📅 Class schedules created');
    
    // Subscribe users to courses
    const userEmails = ['yehezkiel@usu.ac.id', 'dzakwan@usu.ac.id', 'alya@usu.ac.id'];
    
    for (const email of userEmails) {
      const userId = emailToUserMap[email];
      if (!userId) {
        console.log(`⚠️ User with email ${email} not found`);
        continue;
      }
      
      // Subscribe to all courses
      for (const courseName in courseMap) {
        try {
          await pool.query(
            `INSERT INTO course_subscriptions (user_id, course_id)
             VALUES ($1, $2)
             ON CONFLICT (user_id, course_id) DO NOTHING`,
            [userId, courseMap[courseName]]
          );
        } catch (error) {
          console.error(`Error subscribing user ${email} to course ${courseName}:`, error);
        }
      }
      console.log(`✅ Subscribed user ${email} to all courses`);
    }
    
    // Create schedule events for this week
    const today = new Date();
    const currentDay = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay;
    const monday = new Date(today);
    monday.setDate(today.getDate() + mondayOffset);
    
    const scheduleEvents = [];
    
    coursesData.forEach(course => {
      const eventDate = new Date(monday);
      eventDate.setDate(monday.getDate() + (course.default_day - 1)); // 1 = Monday
      
      scheduleEvents.push({
        course_id: courseMap[course.name],
        room_id: course.default_room_id,
        event_date: eventDate.toISOString().split('T')[0],
        start_time: course.default_start_time,
        end_time: course.default_end_time,
        status: 'default'
      });
    });
    
    if (scheduleEvents.length > 0) {
      await pool.query(`
        INSERT INTO schedule_events (course_id, room_id, event_date, start_time, end_time, status)
        VALUES ${scheduleEvents.map((_, i) => `($${i*6+1}, $${i*6+2}, $${i*6+3}, $${i*6+4}, $${i*6+5}, $${i*6+6})`).join(', ')}
      `, scheduleEvents.flatMap(event => [
        event.course_id, event.room_id, event.event_date, 
        event.start_time, event.end_time, event.status
      ]));
      
      console.log('📅 Default schedule events created for this week');
    }
    
    console.log('🎉 Database seeding completed successfully!');
    
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run seeding if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedDatabase();
}

export default seedDatabase;
