-- Create rooms table
CREATE TABLE IF NOT EXISTS rooms (
    id SERIAL PRIMARY KEY,
    room_code VARCHAR(50) UNIQUE NOT NULL,
    building VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create class_schedules table
CREATE TABLE IF NOT EXISTS class_schedules (
    id SERIAL PRIMARY KEY,
    course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL CHECK (day_of_week >= 1 AND day_of_week <= 7),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    room_id INTEGER NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    lecturer_name VARCHAR(255),
    semester VARCHAR(20),
    academic_year VARCHAR(10),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create user_class_schedules table (for tracking which students are enrolled in which schedules)
CREATE TABLE IF NOT EXISTS user_class_schedules (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    class_schedule_id INTEGER NOT NULL REFERENCES class_schedules(id) ON DELETE CASCADE,
    enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, class_schedule_id)
);

-- Insert rooms
INSERT INTO rooms (room_code, building) VALUES
    ('D-101', 'Gedung D'),
    ('D-102', 'Gedung D'),
    ('D-103', 'Gedung D'),
    ('D-104', 'Gedung D'),
    ('D-105', 'Gedung D'),
    ('D-106', 'Gedung D')
ON CONFLICT (room_code) DO NOTHING;

-- Insert class schedules
-- Pemrograman Website: Rabu (3), 08:00 - 10:30, Ruang D-103
INSERT INTO class_schedules (course_id, day_of_week, start_time, end_time, room_id, lecturer_name, semester, academic_year)
SELECT c.id, 3, '08:00'::TIME, '10:30'::TIME, r.id, 'Dr. Dewi Sartika Br Ginting, S.Kom, M.Kom & Nurrahmadayeni M.Kom', 'Ganjil', '2025/2026'
FROM courses c, rooms r
WHERE c.name = 'Pemrograman Website' AND r.room_code = 'D-103'
ON CONFLICT DO NOTHING;

-- Kecerdasan Buatan: Selasa (2), 13:50 - 16:20, Ruang D-104
INSERT INTO class_schedules (course_id, day_of_week, start_time, end_time, room_id, lecturer_name, semester, academic_year)
SELECT c.id, 2, '13:50'::TIME, '16:20'::TIME, r.id, 'Dr. Amalia, ST, MT & Dr. Pauzi Ibrahim Nainggolan, S.Komp., M.Sc', 'Ganjil', '2025/2026'
FROM courses c, rooms r
WHERE c.name = 'Kecerdasan Buatan' AND r.room_code = 'D-104'
ON CONFLICT DO NOTHING;

-- Basis Data: Rabu (3), 13:50 - 17:10, Ruang D-103
INSERT INTO class_schedules (course_id, day_of_week, start_time, end_time, room_id, lecturer_name, semester, academic_year)
SELECT c.id, 3, '13:50'::TIME, '17:10'::TIME, r.id, 'Insidini Fawwaz M.Kom & Dr. Dewi Sartika Br Ginting, S.Kom, M.Kom', 'Ganjil', '2025/2026'
FROM courses c, rooms r
WHERE c.name = 'Basis Data' AND r.room_code = 'D-103'
ON CONFLICT DO NOTHING;

-- Etika Profesi: Kamis (4), 08:00 - 09:40, Ruang D-104
INSERT INTO class_schedules (course_id, day_of_week, start_time, end_time, room_id, lecturer_name, semester, academic_year)
SELECT c.id, 4, '08:00'::TIME, '09:40'::TIME, r.id, 'Dr. Eng. Ade Candra & Dr.Ir. Elviawaty Muisa Zamzami, ST, MT', 'Ganjil', '2025/2026'
FROM courses c, rooms r
WHERE c.name = 'Etika Profesi' AND r.room_code = 'D-104'
ON CONFLICT DO NOTHING;

-- Wirausaha Digital: Jumat (5), 08:00 - 09:40, Ruang D-104
INSERT INTO class_schedules (course_id, day_of_week, start_time, end_time, room_id, lecturer_name, semester, academic_year)
SELECT c.id, 5, '08:00'::TIME, '09:40'::TIME, r.id, 'Dr. T. Henny Febriana Harumy S.Kom, M.Kom. & Dr. Fauzan Nurahmadi, S.Kom, M.Cs', 'Ganjil', '2025/2026'
FROM courses c, rooms r
WHERE c.name = 'Wirausaha Digital' AND r.room_code = 'D-104'
ON CONFLICT DO NOTHING;

-- Struktur Data: Jumat (5), 13:50 - 16:20, Ruang D-101
INSERT INTO class_schedules (course_id, day_of_week, start_time, end_time, room_id, lecturer_name, semester, academic_year)
SELECT c.id, 5, '13:50'::TIME, '16:20'::TIME, r.id, 'Insidini, S.Kom, M.Kom & Anandhini Medianty Nababan S. Kom., M. T', 'Ganjil', '2025/2026'
FROM courses c, rooms r
WHERE c.name = 'Struktur Data' AND r.room_code = 'D-101'
ON CONFLICT DO NOTHING;
