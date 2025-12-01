import pool from './config/database.js';

console.log('🌱 Manual seeding...');

try {
  // Clear existing data
  await pool.query('TRUNCATE TABLE course_subscriptions, schedule_events, courses, rooms, users RESTART IDENTITY CASCADE');
  console.log('🧹 Cleared existing data');
  
  // Insert Rooms
  await pool.query("INSERT INTO rooms (name, capacity, floor, building, description) VALUES ('Lab 2', 30, '2', 'Gedung Lab', 'Laboratorium Komputer 2')");
  await pool.query("INSERT INTO rooms (name, capacity, floor, building, description) VALUES ('Lab 3', 30, '2', 'Gedung Lab', 'Laboratorium Komputer 3')");
  await pool.query("INSERT INTO rooms (name, capacity, floor, building, description) VALUES ('GL 1', 50, '1', 'Gedung Kuliah', 'Gedung Kuliah Lantai 1')");
  await pool.query("INSERT INTO rooms (name, capacity, floor, building, description) VALUES ('D-101', 40, '1', 'Gedung D', 'Ruang D-101')");
  await pool.query("INSERT INTO rooms (name, capacity, floor, building, description) VALUES ('D-103', 40, '1', 'Gedung D', 'Ruang D-103')");
  await pool.query("INSERT INTO rooms (name, capacity, floor, building, description) VALUES ('D-104', 40, '1', 'Gedung D', 'Ruang D-104')");
  console.log('🏫 Inserted 6 rooms');
  
  // Insert Users
  await pool.query("INSERT INTO users (name, email, password_hash, role, phone) VALUES ('Yehezkiel', 'yehezkiel@usu.ac.id', '$2a$10$dummy_hash', 'mahasiswa', '+6281234567890')");
  await pool.query("INSERT INTO users (name, email, password_hash, role, phone) VALUES ('Muhammad Syukron', 'syukron@usu.ac.id', '$2a$10$dummy_hash', 'dosen', '+6281234567891')");
  await pool.query("INSERT INTO users (name, email, password_hash, role, phone) VALUES ('Alya Debora', 'alya@usu.ac.id', '$2a$10$dummy_hash', 'komting', '+6281234567892')");
  await pool.query("INSERT INTO users (name, email, password_hash, role, phone) VALUES ('Taufik Akbar', 'taufik@usu.ac.id', '$2a$10$dummy_hash', 'dosen', '+6281234567893')");
  await pool.query("INSERT INTO users (name, email, password_hash, role, phone) VALUES ('Anandhini', 'anandhini@usu.ac.id', '$2a$10$dummy_hash', 'komting', '+6281234567894')");
  console.log('👥 Inserted 5 users');
  
  console.log('✅ Manual seeding completed!');
  process.exit(0);
} catch (error) {
  console.log('❌ Error:', error.message);
  process.exit(1);
}
