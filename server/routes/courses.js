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

// Validation schemas
const courseSchema = Joi.object({
  course_code: Joi.string().min(2).max(20).required(),
  name: Joi.string().min(2).max(255).required(),
  description: Joi.string().optional(),
  lecturer_id: Joi.number().integer().optional(),
  komting_id: Joi.number().integer().optional(),
  default_day: Joi.number().integer().min(1).max(7).required(),
  default_start_time: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
  default_end_time: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
  default_room_id: Joi.number().integer().optional(),
  semester: Joi.string().optional(),
  academic_year: Joi.string().optional()
});

const subscriptionSchema = Joi.object({
  course_id: Joi.number().integer().required()
});

// Get all courses (public)
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT c.id, c.course_code, c.course_name as name, c.credits, c.semester,
             COUNT(DISTINCT ucs.user_id) as subscriber_count
      FROM courses c
      LEFT JOIN class_schedules cs ON c.id = cs.course_id
      LEFT JOIN user_class_schedules ucs ON cs.id = ucs.class_schedule_id
      WHERE 1=1
    `;
    
    const queryParams = [];
    
    if (search) {
      query += ` AND (c.course_name ILIKE $${queryParams.length + 1} OR c.course_code ILIKE $${queryParams.length + 1})`;
      queryParams.push(`%${search}%`);
    }
    
    query += ` GROUP BY c.id, c.course_code, c.course_name, c.credits, c.semester
               ORDER BY c.course_code
               LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`;
    
    queryParams.push(limit, offset);

    const result = await pool.query(query, queryParams);

    // Get total count
    let countQuery = 'SELECT COUNT(*) as total FROM courses WHERE 1=1';
    const countParams = [];
    
    if (search) {
      countQuery += ` AND (course_name ILIKE $1 OR course_code ILIKE $1)`;
      countParams.push(`%${search}%`);
    }
    
    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].total);

    res.json({
      courses: result.rows,
      pagination: {
        current_page: parseInt(page),
        total_pages: Math.ceil(total / limit),
        total_items: total,
        items_per_page: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Get courses error:', error);
    res.status(500).json({
      error: 'Failed to get courses',
      details: error.message
    });
  }
});

// Get course by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(`
      SELECT c.id, c.course_code, c.name, c.description, c.credits, c.default_day, 
             c.default_start_time, c.default_end_time, c.semester, c.academic_year,
             l.id as lecturer_id, l.name as lecturer_name, l.email as lecturer_email,
             k.id as komting_id, k.name as komting_name, k.email as komting_email,
             r.id as room_id, r.name as room_name, r.capacity, r.floor, r.building,
             c.is_active, c.created_at, c.updated_at
      FROM courses c
      LEFT JOIN users l ON c.lecturer_id = l.id
      LEFT JOIN users k ON c.komting_id = k.id
      LEFT JOIN rooms r ON c.default_room_id = r.id
      WHERE c.id = $1 AND c.is_active = true
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Course not found',
        details: 'Course does not exist or is inactive'
      });
    }

    const course = result.rows[0];

    // Get subscriber count
    const subscriberResult = await pool.query(
      'SELECT COUNT(*) as count FROM course_subscriptions WHERE course_id = $1',
      [id]
    );

    course.subscriber_count = parseInt(subscriberResult.rows[0].count);

    res.json({ course });

  } catch (error) {
    console.error('Get course error:', error);
    res.status(500).json({
      error: 'Failed to get course',
      details: error.message
    });
  }
});

// Get course details (for reschedule functionality)
router.get('/:id/details', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(`
      SELECT c.id, c.course_code, c.course_name as name, c.credits,
             cs.day_of_week, cs.start_time, cs.end_time, cs.lecturer_name
      FROM courses c
      LEFT JOIN class_schedules cs ON c.id = cs.course_id
      WHERE c.id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Course not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching course details:', error);
    res.status(500).json({ error: 'Failed to fetch course details' });
  }
});

// Subscribe to course (protected)
router.post('/subscribe', authenticateToken, async (req, res) => {
  try {
    const { error, value } = subscriptionSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation Error',
        details: error.details[0].message
      });
    }

    const { course_id } = value;
    const user_id = req.user.id;

    // Check if course exists
    const courseResult = await pool.query(
      'SELECT id, course_name FROM courses WHERE id = $1',
      [course_id]
    );

    if (courseResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Course not found',
        details: 'Course does not exist'
      });
    }

    // Check if already subscribed
    const existingSubscription = await pool.query(
      'SELECT user_id, course_id FROM course_subscriptions WHERE user_id = $1 AND course_id = $2',
      [user_id, course_id]
    );

    if (existingSubscription.rows.length > 0) {
      return res.status(409).json({
        error: 'Already subscribed',
        details: 'You are already subscribed to this course'
      });
    }

    // Create subscription
    const result = await pool.query(
      'INSERT INTO course_subscriptions (user_id, course_id) VALUES ($1, $2) RETURNING user_id, course_id',
      [user_id, course_id]
    );

    const course = courseResult.rows[0];

    res.status(201).json({
      message: 'Successfully subscribed to course',
      subscription: {
        user_id: result.rows[0].user_id,
        course_id: course_id,
        course_name: course.course_name,
        subscribed_at: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Subscribe error:', error);
    res.status(500).json({
      error: 'Failed to subscribe to course',
      details: error.message
    });
  }
});

// Unsubscribe from course (protected)
router.delete('/unsubscribe', authenticateToken, async (req, res) => {
  try {
    const { error, value } = subscriptionSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation Error',
        details: error.details[0].message
      });
    }

    const { course_id } = value;
    const user_id = req.user.id;

    // Check if subscription exists
    const existingSubscription = await pool.query(
      'SELECT user_id, course_id FROM course_subscriptions WHERE user_id = $1 AND course_id = $2',
      [user_id, course_id]
    );

    if (existingSubscription.rows.length === 0) {
      return res.status(404).json({
        error: 'Subscription not found',
        details: 'You are not subscribed to this course'
      });
    }

    // Delete subscription
    await pool.query(
      'DELETE FROM course_subscriptions WHERE user_id = $1 AND course_id = $2',
      [user_id, course_id]
    );

    res.json({
      message: 'Successfully unsubscribed from course'
    });

  } catch (error) {
    console.error('Unsubscribe error:', error);
    res.status(500).json({
      error: 'Failed to unsubscribe from course',
      details: error.message
    });
  }
});

// Get user's subscribed courses (protected)
router.get('/my/subscriptions', authenticateToken, async (req, res) => {
  try {
    const user_id = req.user.id;

    const result = await pool.query(`
      SELECT c.id as course_id, c.course_code, c.course_name as name, c.credits
      FROM course_subscriptions cs
      JOIN courses c ON cs.course_id = c.id
      WHERE cs.user_id = $1
      ORDER BY c.course_code
    `, [user_id]);

    res.json({
      subscriptions: result.rows,
      total: result.rows.length
    });

  } catch (error) {
    console.error('Get subscriptions error:', error);
    res.status(500).json({
      error: 'Failed to get subscribed courses',
      details: error.message
    });
  }
});

// Create new course (komting only)
router.post('/', authenticateToken, async (req, res) => {
  try {
    // Only admin and komting can create courses
    if (!['admin', 'komting'].includes(req.user.role)) {
      return res.status(403).json({
        error: 'Access denied',
        details: 'Only admin and komting can create courses'
      });
    }

    const { error, value } = courseSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation Error',
        details: error.details[0].message
      });
    }

    const { course_code, name, description, lecturer_id, komting_id, default_day, 
            default_start_time, default_end_time, default_room_id, semester, academic_year } = value;

    // Check if course code already exists
    const existingCourse = await pool.query(
      'SELECT id FROM courses WHERE course_code = $1',
      [course_code]
    );

    if (existingCourse.rows.length > 0) {
      return res.status(409).json({
        error: 'Course code already exists',
        details: 'This course code is already in use'
      });
    }

    // Validate time
    const start = new Date(`2000-01-01 ${default_start_time}`);
    const end = new Date(`2000-01-01 ${default_end_time}`);
    
    if (start >= end) {
      return res.status(400).json({
        error: 'Invalid time range',
        details: 'Start time must be before end time'
      });
    }

    // Create course
    const result = await pool.query(
      `INSERT INTO courses (course_code, name, description, lecturer_id, komting_id, 
                           default_day, default_start_time, default_end_time, default_room_id,
                           semester, academic_year)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING id, course_code, name, created_at`,
      [course_code, name, description, lecturer_id || null, komting_id || req.user.id,
       default_day, default_start_time, default_end_time, default_room_id || null,
       semester || null, academic_year || null]
    );

    const course = result.rows[0];

    res.status(201).json({
      message: 'Course created successfully',
      course: {
        id: course.id,
        course_code: course.course_code,
        name: course.name,
        created_at: course.created_at
      }
    });

  } catch (error) {
    console.error('Create course error:', error);
    res.status(500).json({
      error: 'Failed to create course',
      details: error.message
    });
  }
});

// Get schedules for user's subscribed courses
router.get('/schedules/my', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get user's subscribed courses and their schedules
    const result = await pool.query(`
      SELECT 
        cs.id,
        c.id as course_id,
        c.course_name,
        cs.day_of_week,
        cs.start_time,
        cs.end_time,
        cl.room_number as room_code,
        cs.lecturer_name,
        cs.semester,
        cs.academic_year
      FROM course_subscriptions csub
      JOIN courses c ON csub.course_id = c.id
      LEFT JOIN class_schedules cs ON c.id = cs.course_id
      LEFT JOIN classrooms cl ON cs.room_id = cl.id
      WHERE csub.user_id = $1
      ORDER BY cs.day_of_week, cs.start_time
    `, [userId]);
    
    res.json({
      schedules: result.rows,
      total: result.rows.length
    });
    
  } catch (error) {
    console.error('Get schedules error:', error);
    res.status(500).json({
      error: 'Failed to fetch schedules',
      details: error.message
    });
  }
});

// Get all schedules (for admin/komting)
router.get('/schedules/all', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        cs.id,
        c.id as course_id,
        c.course_name,
        cs.day_of_week,
        cs.start_time,
        cs.end_time,
        cl.room_number as room_code,
        cs.lecturer_name,
        cs.semester,
        cs.academic_year
      FROM class_schedules cs
      JOIN courses c ON cs.course_id = c.id
      LEFT JOIN classrooms cl ON cs.room_id = cl.id
      ORDER BY cs.day_of_week, cs.start_time
    `);
    
    res.json({
      schedules: result.rows,
      total: result.rows.length
    });
    
  } catch (error) {
    console.error('Get all schedules error:', error);
    res.status(500).json({
      error: 'Failed to fetch schedules',
      details: error.message
    });
  }
});

export default router;
