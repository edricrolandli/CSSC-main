import pool from './config/database.js';

async function createMaterialsTable() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS materials (
          id SERIAL PRIMARY KEY,
          course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
          meeting_number INTEGER NOT NULL CHECK (meeting_number >= 1 AND meeting_number <= 16),
          title VARCHAR(255) NOT NULL,
          file_name VARCHAR(255) NOT NULL,
          file_path VARCHAR(500) NOT NULL,
          file_size BIGINT NOT NULL,
          file_type VARCHAR(50) NOT NULL,
          uploaded_by INTEGER REFERENCES users(id),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_materials_course_meeting ON materials(course_id, meeting_number)
    `);
    
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_materials_course ON materials(course_id)
    `);
    
    console.log('✅ Materials table created successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

createMaterialsTable();