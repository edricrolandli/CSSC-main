-- Create Schedule Events Table (for real-time schedule changes)
CREATE TABLE IF NOT EXISTS schedule_events (
    id SERIAL PRIMARY KEY,
    course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    room_id INTEGER NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    event_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'cancelled', 'update', 'replaced')),
    changed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    change_reason TEXT,
    previous_event_id INTEGER REFERENCES schedule_events(id) ON DELETE SET NULL,
    notification_sent BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_schedule_events_course ON schedule_events(course_id);
CREATE INDEX IF NOT EXISTS idx_schedule_events_room ON schedule_events(room_id);
CREATE INDEX IF NOT EXISTS idx_schedule_events_date ON schedule_events(event_date);
CREATE INDEX IF NOT EXISTS idx_schedule_events_status ON schedule_events(status);

-- Create trigger for schedule_events table
DROP TRIGGER IF EXISTS update_schedule_events_updated_at ON schedule_events;
CREATE TRIGGER update_schedule_events_updated_at BEFORE UPDATE
    ON schedule_events FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create unique constraint to prevent duplicate events
CREATE UNIQUE INDEX IF NOT EXISTS idx_schedule_events_unique 
ON schedule_events(course_id, event_date, start_time) 
WHERE status != 'cancelled';
-- Create trigger for updated_at
CREATE TRIGGER update_schedule_events_updated_at BEFORE UPDATE
    ON schedule_events FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
