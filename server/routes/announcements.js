import express from 'express';
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

// Get announcements for user's subscribed courses
router.get('/my', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get user role
    const userResult = await pool.query('SELECT role FROM users WHERE id = $1', [userId]);
    const userRole = userResult.rows[0]?.role;
    
    let query;
    let params;
    
    if (userRole === 'komting') {
      // Komting sees all announcements
      query = `
        SELECT id, title, content, subject, author, author_role, date, time, status
        FROM announcements
        ORDER BY date DESC, time DESC
      `;
      params = [];
    } else {
      // Mahasiswa sees only announcements from subscribed courses
      query = `
        SELECT DISTINCT a.id, a.title, a.content, a.subject, a.author, a.author_role, a.date, a.time, a.status
        FROM announcements a
        JOIN course_subscriptions cs ON a.subject = (SELECT name FROM courses WHERE id = cs.course_id)
        WHERE cs.user_id = $1
        ORDER BY a.date DESC, a.time DESC
      `;
      params = [userId];
    }
    
    const result = await pool.query(query, params);
    
    res.json({
      announcements: result.rows,
      total: result.rows.length
    });
    
  } catch (error) {
    console.error('Get announcements error:', error);
    res.status(500).json({
      error: 'Failed to fetch announcements',
      details: error.message
    });
  }
});

// Get all announcements (admin/komting)
router.get('/all', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, title, content, subject, author, author_role, date, time, status
      FROM announcements
      ORDER BY date DESC, time DESC
    `);
    
    res.json({
      announcements: result.rows,
      total: result.rows.length
    });
    
  } catch (error) {
    console.error('Get all announcements error:', error);
    res.status(500).json({
      error: 'Failed to fetch announcements',
      details: error.message
    });
  }
});

// Create announcement (komting only)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { title, content, subject, date, time } = req.body;
    const userId = req.user.id;
    
    // Check if user is komting
    const userResult = await pool.query('SELECT name, role FROM users WHERE id = $1', [userId]);
    const user = userResult.rows[0];
    
    if (user.role !== 'komting') {
      return res.status(403).json({
        error: 'Forbidden',
        details: 'Only Komting can create announcements'
      });
    }
    
    // Validate required fields
    if (!title || !content || !subject || !date) {
      return res.status(400).json({
        error: 'Validation Error',
        details: 'title, content, subject, and date are required'
      });
    }
    
    const result = await pool.query(`
      INSERT INTO announcements (title, content, subject, author, author_role, date, time, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, title, content, subject, author, author_role, date, time, status
    `, [title, content, subject, user.name, 'Komting', date, time || new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }), 'approved']);
    
    res.status(201).json({
      message: 'Announcement created successfully',
      announcement: result.rows[0]
    });
    
  } catch (error) {
    console.error('Create announcement error:', error);
    res.status(500).json({
      error: 'Failed to create announcement',
      details: error.message
    });
  }
});

export default router;
