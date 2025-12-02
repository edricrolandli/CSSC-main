import pool from './config/database.js';

console.log('📢 Creating announcements table and inserting sample data...\n');

try {
  // Create announcements table
  console.log('📝 Creating announcements table...');
  await pool.query(`
    CREATE TABLE IF NOT EXISTS announcements (
      id SERIAL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      content TEXT NOT NULL,
      subject VARCHAR(255) NOT NULL,
      author VARCHAR(255) NOT NULL,
      author_role VARCHAR(50),
      date DATE NOT NULL,
      time TIME,
      status VARCHAR(50) DEFAULT 'approved',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
  console.log('✅ Table created');

  // Insert sample announcements
  console.log('\n📝 Inserting sample announcements...');
  
  const announcements = [
    {
      title: 'Perubahan Jadwal Wirausaha Digital',
      content: 'Teman-teman, mata kuliah Wirausaha Digital hari ini dipindah ke hari Kamis minggu depan ya. Mohon infokan ke yang lain.',
      subject: 'Wirausaha Digital',
      author: 'Edric',
      author_role: 'Komting',
      date: '2025-10-31',
      time: '07:21'
    },
    {
      title: 'Kuliah Pengganti Basis Data',
      content: 'Assalamualaikum, perkuliahan Basis Data kita adakan nanti malam pukul 20.00 WIB secara Daring (Zoom). Link akan dibagikan 15 menit sebelum mulai.',
      subject: 'Basis Data',
      author: 'Dr. Dewi Sartika',
      author_role: 'Dosen',
      date: '2025-11-05',
      time: '10:22'
    },
    {
      title: 'Dosen Tidak Hadir',
      content: 'Info dari bapak dosen, hari ini beliau berhalangan hadir karena ada rapat di rektorat. Tugas akan dikirim via Google Classroom.',
      subject: 'Kecerdasan Buatan',
      author: 'Yehezkiel',
      author_role: 'Mahasiswa',
      date: '2025-11-07',
      time: '08:15'
    },
    {
      title: 'Pengumpulan Tugas Struktur Data',
      content: 'Pengumpulan tugas Struktur Data ditutup hari Jumat pukul 23:59. Silakan upload di Google Classroom. Terlambat tidak akan diterima.',
      subject: 'Struktur Data',
      author: 'Anandhini',
      author_role: 'Dosen',
      date: '2025-11-08',
      time: '14:30'
    },
    {
      title: 'Etika Profesi - Diskusi Kasus',
      content: 'Minggu depan kita akan melakukan diskusi kasus tentang etika dalam pengembangan software. Silakan baca materi yang sudah di-upload.',
      subject: 'Etika Profesi',
      author: 'Dr. Ade Gunawan',
      author_role: 'Dosen',
      date: '2025-11-09',
      time: '09:45'
    },
    {
      title: 'Quiz Pemrograman Website',
      content: 'Quiz Pemrograman Website akan dilaksanakan hari Rabu depan pukul 13:00 via Google Forms. Durasi 60 menit.',
      subject: 'Pemrograman Website',
      author: 'Alya',
      author_role: 'Komting',
      date: '2025-11-10',
      time: '11:00'
    }
  ];

  for (const ann of announcements) {
    await pool.query(
      `INSERT INTO announcements (title, content, subject, author, author_role, date, time, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [ann.title, ann.content, ann.subject, ann.author, ann.author_role, ann.date, ann.time, 'approved']
    );
    console.log(`✅ ${ann.subject} - ${ann.title}`);
  }

  // Verify
  console.log('\n📋 Verifying announcements:');
  const result = await pool.query(
    'SELECT id, title, subject, author, date FROM announcements ORDER BY date DESC'
  );
  
  console.log(`\n✅ Total announcements: ${result.rows.length}`);
  result.rows.forEach(row => {
    console.log(`   ${row.id}. [${row.subject}] ${row.title} by ${row.author} (${row.date})`);
  });

  console.log('\n✅ Announcements table created and populated!');
  process.exit(0);

} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}
