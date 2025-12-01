-- Create Courses Table
CREATE TABLE IF NOT EXISTS courses (
    id SERIAL PRIMARY KEY,
    course_code VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    lecturer_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    komting_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    default_day INTEGER NOT NULL CHECK (default_day BETWEEN 1 AND 7), -- 1=Senin, 7=Minggu
    default_start_time TIME NOT NULL,
    default_end_time TIME NOT NULL,
    default_room_id INTEGER REFERENCES rooms(id) ON DELETE SET NULL,
    semester VARCHAR(50),
    academic_year VARCHAR(20),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_courses_code ON courses(course_code);
CREATE INDEX IF NOT EXISTS idx_courses_lecturer ON courses(lecturer_id);
CREATE INDEX IF NOT EXISTS idx_courses_komting ON courses(komting_id);
CREATE INDEX IF NOT EXISTS idx_courses_active ON courses(is_active);

-- Create trigger for courses table
DROP TRIGGER IF EXISTS update_courses_updated_at ON courses;
CREATE TRIGGER update_courses_updated_at BEFORE UPDATE
    ON courses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
