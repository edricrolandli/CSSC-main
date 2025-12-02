import pool from './config/database.js';

console.log('🔄 Updating course codes...\n');

const courseUpdates = [
  { name: 'Basis Data', newCode: 'ILK2104' },
  { name: 'Etika Profesi', newCode: 'ILK3102' },
  { name: 'Wirausaha Digital', newCode: 'ILK2108' },
  { name: 'Pemrograman Website', newCode: 'ILK2106' },
  { name: 'Struktur Data', newCode: 'ILK2109' },
  { name: 'Kecerdasan Buatan', newCode: 'ILK3101' }
];

try {
  for (const course of courseUpdates) {
    const result = await pool.query(
      'UPDATE courses SET course_code = $1 WHERE name = $2 RETURNING id, name, course_code',
      [course.newCode, course.name]
    );
    
    if (result.rows.length > 0) {
      const updated = result.rows[0];
      console.log(`✅ ${updated.name}: ${course.newCode}`);
    } else {
      console.log(`⚠️  ${course.name}: NOT FOUND`);
    }
  }
  
  console.log('\n📋 Verifying all courses:');
  const allCourses = await pool.query('SELECT id, name, course_code FROM courses ORDER BY name');
  allCourses.rows.forEach(course => {
    console.log(`   ${course.id}. ${course.name} (${course.course_code})`);
  });
  
  console.log('\n✅ Course codes updated successfully!');
  process.exit(0);
  
} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}
