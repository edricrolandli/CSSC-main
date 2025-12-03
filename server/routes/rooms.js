import express from 'express';
import Joi from 'joi';
import jwt from 'jsonwebtoken';
import pool from '../config/database.js';

const router = express.Router();

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({
      error: 'No token provided',
      details: 'Authorization token is required'
    });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({
        error: 'Invalid token',
        details: 'Token is invalid or expired'
      });
    }
    req.user = decoded;
    next();
  });
};

// Get all rooms
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    const result = await pool.query(`
      SELECT r.id, r.name, r.capacity, r.floor, r.building, r.description, r.is_active,
             r.created_at, r.updated_at
      FROM rooms r
      WHERE r.is_active = true
      ORDER BY r.name
      LIMIT $1 OFFSET $2
    `, [limit, offset]);

    // Get total count
    const countResult = await pool.query('SELECT COUNT(*) as total FROM rooms WHERE is_active = true');
    const total = parseInt(countResult.rows[0].total);

    res.json({
      rooms: result.rows,
      pagination: {
        current_page: parseInt(page),
        total_pages: Math.ceil(total / limit),
        total_items: total,
        items_per_page: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Get rooms error:', error);
    res.status(500).json({
      error: 'Failed to get rooms',
      details: error.message
    });
  }
});

// Find available rooms for rescheduling (must be before /:id route)
router.get('/available-for-reschedule', authenticateToken, async (req, res) => {
    console.log('Available for reschedule request:', req.query);
    try {
        const { 
            original_date, 
            original_start_time, 
            original_end_time,
            duration_minutes = 150,  // Default 2.5 hours
            from_date = new Date().toISOString().split('T')[0],  // Today
            to_date = '2025-12-05'  // End of semester
        } = req.query;

        // Validate required parameters
        if (!original_date || !original_start_time || !original_end_time) {
            return res.status(400).json({
                error: 'Missing required parameters',
                details: 'original_date, original_start_time, and original_end_time are required'
            });
        }

        // Convert duration to minutes
        const duration = parseInt(duration_minutes);
        if (isNaN(duration) || duration <= 0) {
            return res.status(400).json({
                error: 'Invalid duration',
                details: 'duration_minutes must be a positive number'
            });
        }

        // Format the original time for comparison
        const originalDateTime = `${original_date} ${original_start_time}`;
        
        // Validate date formats
        if (isNaN(Date.parse(original_date)) || isNaN(Date.parse(from_date)) || isNaN(Date.parse(to_date))) {
            return res.status(400).json({
                error: 'Invalid date format',
                details: 'Please provide dates in YYYY-MM-DD format'
            });
        }

        // Get all active rooms
        let roomsResult;
        try {
            roomsResult = await pool.query(`
                SELECT id, name, capacity, building, floor
                FROM rooms
                WHERE is_active = true
                ORDER BY building, name
            `);
            console.log(`Found ${roomsResult.rows.length} active rooms`);
            
            if (!roomsResult.rows.length) {
                return res.status(404).json({
                    error: 'No active rooms found',
                    details: 'There are no active rooms available in the system'
                });
            }
        } catch (roomError) {
            console.error('Error fetching rooms:', roomError);
            return res.status(500).json({
                error: 'Failed to fetch rooms',
                details: roomError.message
            });
        }

        const availableSlots = [];

        // Check each room
        for (const room of roomsResult.rows) {
            // Get all scheduled events for this room in the date range
            let eventsResult;
            try {
                eventsResult = await pool.query(`
                    SELECT 
                        se.event_date, 
                        se.start_time, 
                        se.end_time,
                        c.name as course_name
                    FROM schedule_events se
                    LEFT JOIN courses c ON se.course_id = c.id
                    WHERE se.room_id = $1
                    AND se.event_date BETWEEN $2::date AND $3::date
                    AND se.status = 'scheduled'
                    ORDER BY se.event_date, se.start_time
                `, [room.id, from_date, to_date]);
                console.log(`Found ${eventsResult.rows.length} scheduled events for room ${room.id}`);
            } catch (eventError) {
                console.error(`Error fetching events for room ${room.id}:`, eventError);
                // Continue to next room if there's an error with this one
                continue;
            }

            const bookedSlots = eventsResult.rows;

            // Convert to Date objects for easier comparison
            const checkDate = new Date(from_date);
            const endDate = new Date(to_date);
            
            // Check each day in the range
            while (checkDate <= endDate) {
                const currentDate = checkDate.toISOString().split('T')[0];
                const dayOfWeek = checkDate.getDay(); // 0 = Sunday, 1 = Monday, etc.

                // Skip weekends
                if (dayOfWeek === 0 || dayOfWeek === 6) {
                    checkDate.setDate(checkDate.getDate() + 1);
                    continue;
                }

                // Check time slots from 07:00 to 18:00
                for (let hour = 7; hour <= 18; hour++) {
                    for (let minute = 0; minute < 60; minute += 30) { // Check every 30 minutes
                        const startTime = new Date(checkDate);
                        startTime.setHours(hour, minute, 0, 0);
                        
                        const endTime = new Date(startTime.getTime() + duration * 60000);
                        
                        // Skip if end time is after 18:00
                        if (endTime.getHours() > 18 || 
                            (endTime.getHours() === 18 && endTime.getMinutes() > 0)) {
                            continue;
                        }

                        // Skip if this is the original time slot
                        if (currentDate === original_date && 
                            `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}` === original_start_time) {
                            continue;
                        }

                        // Check for conflicts
                        const hasConflict = bookedSlots.some(event => {
                            const eventStart = new Date(`${event.event_date}T${event.start_time}`);
                            const eventEnd = new Date(`${event.event_date}T${event.end_time}`);
                            
                            return (startTime < eventEnd && endTime > eventStart) && 
                                   (event.event_date === currentDate);
                        });

                        if (!hasConflict) {
                            availableSlots.push({
                                room_id: room.id,
                                room_name: room.name,
                                building: room.building,
                                floor: room.floor,
                                date: currentDate,
                                start_time: `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`,
                                end_time: `${endTime.getHours().toString().padStart(2, '0')}:${endTime.getMinutes().toString().padStart(2, '0')}`,
                                duration_minutes: duration
                            });
                        }
                    }
                }

                checkDate.setDate(checkDate.getDate() + 1);
            }
        }

        // Group by date and time for better presentation
        const groupedSlots = availableSlots.reduce((acc, slot) => {
            const key = `${slot.date}_${slot.start_time}_${slot.end_time}`;
            if (!acc[key]) {
                acc[key] = {
                    date: slot.date,
                    start_time: slot.start_time,
                    end_time: slot.end_time,
                    duration_minutes: slot.duration_minutes,
                    available_rooms: []
                };
            }
            acc[key].available_rooms.push({
                room_id: slot.room_id,
                room_name: slot.room_name,
                building: slot.building,
                floor: slot.floor
            });
            return acc;
        }, {});

        res.json({
            success: true,
            data: Object.values(groupedSlots)
        });

    } catch (error) {
        console.error('Error in available-for-reschedule endpoint:', {
            error: error.message,
            stack: error.stack,
            query: req.query,
            user: req.user?.id
        });
        
        // More specific error messages based on error type
        let errorMessage = 'Internal server error';
        let statusCode = 500;
        
        if (error.message.includes('invalid input syntax for type date')) {
            errorMessage = 'Invalid date format';
            statusCode = 400;
        } else if (error.message.includes('relation') && error.message.includes('does not exist')) {
            errorMessage = 'Database table not found';
            statusCode = 500;
        }
        
        res.status(statusCode).json({
            error: errorMessage,
            details: process.env.NODE_ENV === 'development' ? error.message : 'An error occurred while processing your request'
        });
    }
});

// Get room by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(`
      SELECT r.id, r.name, r.capacity, r.floor, r.building, r.description, r.is_active,
             r.created_at, r.updated_at
      FROM rooms r
      WHERE r.id = $1 AND r.is_active = true
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Room not found',
        details: 'Room does not exist or is inactive'
      });
    }

    res.json({ room: result.rows[0] });

  } catch (error) {
    console.error('Get room error:', error);
    res.status(500).json({
      error: 'Failed to get room',
      details: error.message
    });
  }
});

// Get room status for specific date and time
router.get('/status', async (req, res) => {
  try {
    const { date, time } = req.query;

    if (!date || !time) {
      return res.status(400).json({
        error: 'Missing parameters',
        details: 'Both date and time parameters are required'
      });
    }

    // Validate date format
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) {
      return res.status(400).json({
        error: 'Invalid date format',
        details: 'Date must be in YYYY-MM-DD format'
      });
    }

    // Validate time format
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(time)) {
      return res.status(400).json({
        error: 'Invalid time format',
        details: 'Time must be in HH:MM format (24-hour)'
      });
    }

    // Get all rooms with their current status
    const roomsResult = await pool.query(`
      SELECT r.id, r.name, r.capacity, r.floor, r.building, r.description,
             CASE 
               WHEN se.id IS NOT NULL AND se.status != 'cancelled' THEN 'occupied'
               ELSE 'available'
             END as status,
             se.course_id, c.course_code, c.name as course_name,
             se.start_time, se.end_time,
             l.name as lecturer_name
      FROM rooms r
      LEFT JOIN schedule_events se ON r.id = se.room_id 
        AND se.event_date = $1 
        AND se.status != 'cancelled'
        AND se.start_time <= $2 
        AND se.end_time > $2
      LEFT JOIN courses c ON se.course_id = c.id
      LEFT JOIN users l ON c.lecturer_id = l.id
      WHERE r.is_active = true
      ORDER BY r.name
    `, [date, time]);

    const rooms = roomsResult.rows.map(room => ({
      id: room.id,
      name: room.name,
      capacity: room.capacity,
      floor: room.floor,
      building: room.building,
      description: room.description,
      status: room.status,
      current_event: room.status === 'occupied' ? {
        course_id: room.course_id,
        course_code: room.course_code,
        course_name: room.course_name,
        lecturer_name: room.lecturer_name,
        start_time: room.start_time,
        end_time: room.end_time
      } : null
    }));

    res.json({
      date,
      time,
      rooms,
      summary: {
        total_rooms: rooms.length,
        occupied_rooms: rooms.filter(r => r.status === 'occupied').length,
        available_rooms: rooms.filter(r => r.status === 'available').length
      }
    });

  } catch (error) {
    console.error('Get room status error:', error);
    res.status(500).json({
      error: 'Failed to get room status',
      details: error.message
    });
  }
});

// Get available rooms for specific date and time range
router.get('/free-slots', async (req, res) => {
  try {
    const { date, start_time, end_time, min_capacity } = req.query;

    if (!date || !start_time || !end_time) {
      return res.status(400).json({
        error: 'Missing parameters',
        details: 'date, start_time, and end_time parameters are required'
      });
    }

    // Validate date format
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) {
      return res.status(400).json({
        error: 'Invalid date format',
        details: 'Date must be in YYYY-MM-DD format'
      });
    }

    // Validate time format
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(start_time) || !timeRegex.test(end_time)) {
      return res.status(400).json({
        error: 'Invalid time format',
        details: 'Time must be in HH:MM format (24-hour)'
      });
    }

    // Validate time range
    const start = new Date(`2000-01-01 ${start_time}`);
    const end = new Date(`2000-01-01 ${end_time}`);
    
    if (start >= end) {
      return res.status(400).json({
        error: 'Invalid time range',
        details: 'Start time must be before end time'
      });
    }

    // Build query with optional capacity filter
    let query = `
      SELECT r.id, r.name, r.capacity, r.floor, r.building, r.description
      FROM rooms r
      WHERE r.is_active = true
      AND r.id NOT IN (
        SELECT DISTINCT se.room_id
        FROM schedule_events se
        WHERE se.event_date = $1
        AND se.status != 'cancelled'
        AND (
          (se.start_time <= $2 AND se.end_time > $2) OR
          (se.start_time < $3 AND se.end_time >= $3) OR
          (se.start_time >= $2 AND se.end_time <= $3)
        )
      )
    `;
    
    let queryParams = [date, start_time, end_time];

    if (min_capacity) {
      query += ` AND r.capacity >= $${queryParams.length + 1}`;
      queryParams.push(parseInt(min_capacity));
    }

    query += ` ORDER BY r.capacity DESC, r.name`;

    const result = await pool.query(query, queryParams);

    res.json({
      date,
      time_range: { start_time, end_time },
      available_rooms: result.rows,
      total_available: result.rows.length
    });

  } catch (error) {
    console.error('Get free slots error:', error);
    res.status(500).json({
      error: 'Failed to get available rooms',
      details: error.message
    });
  }
});

// Get room schedule for a specific date
router.get('/:id/schedule', async (req, res) => {
  try {
    const { id } = req.params;
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({
        error: 'Missing parameter',
        details: 'date parameter is required'
      });
    }

    // Validate date format
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) {
      return res.status(400).json({
        error: 'Invalid date format',
        details: 'Date must be in YYYY-MM-DD format'
      });
    }

    // Check if room exists
    const roomResult = await pool.query(
      'SELECT id, name, capacity, floor, building, description FROM rooms WHERE id = $1 AND is_active = true',
      [id]
    );

    if (roomResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Room not found',
        details: 'Room does not exist or is inactive'
      });
    }

    const room = roomResult.rows[0];

    // Get room schedule for the date
    const scheduleResult = await pool.query(`
      SELECT se.id, se.start_time, se.end_time, se.status, se.change_reason,
             c.id as course_id, c.course_code, c.name as course_name,
             l.name as lecturer_name, k.name as komting_name,
             u.name as changed_by_name, se.created_at
      FROM schedule_events se
      JOIN courses c ON se.course_id = c.id
      LEFT JOIN users l ON c.lecturer_id = l.id
      LEFT JOIN users k ON c.komting_id = k.id
      LEFT JOIN users u ON se.changed_by = u.id
      WHERE se.room_id = $1 
      AND se.event_date = $2
      AND se.status != 'cancelled'
      ORDER BY se.start_time
    `, [id, date]);

    const events = scheduleResult.rows.map(event => ({
      id: event.id,
      course: {
        id: event.course_id,
        code: event.course_code,
        name: event.course_name
      },
      lecturer_name: event.lecturer_name,
      komting_name: event.komting_name,
      time: `${event.start_time} - ${event.end_time}`,
      start_time: event.start_time,
      end_time: event.end_time,
      status: event.status,
      change_reason: event.change_reason,
      changed_by_name: event.changed_by_name,
      created_at: event.created_at
    }));

    res.json({
      room,
      date,
      events,
      total_events: events.length
    });

  } catch (error) {
    console.error('Get room schedule error:', error);
    res.status(500).json({
      error: 'Failed to get room schedule',
      details: error.message
    });
  }
});

// Create new room (komting only)
router.post('/', authenticateToken, async (req, res) => {
  try {
    // Only komting can create rooms
    if (req.user.role !== 'komting') {
      return res.status(403).json({
        error: 'Access denied',
        details: 'Only komting can create rooms'
      });
    }

    const roomSchema = Joi.object({
      name: Joi.string().min(2).max(100).required(),
      capacity: Joi.number().integer().min(1).optional(),
      floor: Joi.string().max(50).optional(),
      building: Joi.string().max(50).optional(),
      description: Joi.string().optional()
    });

    const { error, value } = roomSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation Error',
        details: error.details[0].message
      });
    }

    const { name, capacity, floor, building, description } = value;

    // Check if room name already exists
    const existingRoom = await pool.query(
      'SELECT id FROM rooms WHERE name = $1',
      [name]
    );

    if (existingRoom.rows.length > 0) {
      return res.status(409).json({
        error: 'Room name already exists',
        details: 'This room name is already in use'
      });
    }

    // Create room
    const result = await pool.query(
      `INSERT INTO rooms (name, capacity, floor, building, description)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, capacity, floor, building, description, created_at`,
      [name, capacity || null, floor || null, building || null, description || null]
    );

    const room = result.rows[0];

    res.status(201).json({
      message: 'Room created successfully',
      room
    });

  } catch (error) {
    console.error('Create room error:', error);
    res.status(500).json({
      error: 'Failed to create room',
      details: error.message
    });
  }
});

export default router;
