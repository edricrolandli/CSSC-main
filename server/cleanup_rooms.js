import pool from './config/database.js';

console.log('🧹 Cleaning up rooms...\n');

try {
  // Delete unwanted rooms
  const roomsToDelete = ['GL 1', 'Lab 2', 'Lab 3'];
  
  for (const roomName of roomsToDelete) {
    const result = await pool.query(
      'DELETE FROM rooms WHERE name = $1 RETURNING name',
      [roomName]
    );
    
    if (result.rows.length > 0) {
      console.log(`✅ Deleted: ${roomName}`);
    } else {
      console.log(`⚠️  Not found: ${roomName}`);
    }
  }
  
  console.log('\n📋 Remaining rooms:');
  const allRooms = await pool.query('SELECT id, name, building FROM rooms ORDER BY name');
  allRooms.rows.forEach(room => {
    console.log(`   ${room.id}. ${room.name} (${room.building})`);
  });
  
  console.log(`\n✅ Total rooms: ${allRooms.rows.length}`);
  console.log('✅ Cleanup completed!');
  process.exit(0);
  
} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}
