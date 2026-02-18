import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../config/db-adapter.js';

export const register = async (req, res) => {
  try {
    const { 
      username, 
      email, 
      password, 
      role = 'student',
      department,
      employee_id,
      student_id,
      phone
    } = req.body;
    
    // Validate input
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Validate role-specific fields
    if (role === 'faculty' || role === 'staff') {
      if (!employee_id) {
        return res.status(400).json({ error: 'Employee ID is required for faculty/staff' });
      }
    }

    if (role === 'student') {
      if (!student_id) {
        return res.status(400).json({ error: 'Student ID is required for students' });
      }
    }

    // Check if email already exists
    const existingEmail = await pool.query(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existingEmail.rows.length > 0) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Check if username already exists
    const existingUsername = await pool.query(
      'SELECT id FROM users WHERE username = ?',
      [username]
    );

    if (existingUsername.rows.length > 0) {
      return res.status(400).json({ error: 'Username already taken' });
    }
    
    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);
    
    // Set status based on role (admin auto-approved, others pending)
    const status = role === 'admin' ? 'active' : 'pending';
    
    const result = await pool.query(
      `INSERT INTO users (username, email, password_hash, role, department, employee_id, student_id, phone, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [username, email, passwordHash, role, department, employee_id, student_id, phone, status]
    );
    
    // Get the inserted user
    const userResult = await pool.query(
      'SELECT id, username, email, role, department, employee_id, student_id, phone, status FROM users WHERE email = ?',
      [email]
    );

    const user = userResult.rows[0];
    
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.status(201).json({ 
      user: { 
        id: user.id, 
        username: user.username, 
        email: user.email, 
        role: user.role,
        department: user.department,
        status: user.status
      },
      token 
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const result = await pool.query(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );
    
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const user = result.rows[0];
    
    // Check if user is active
    if (user.status !== 'active') {
      return res.status(403).json({ 
        error: 'Account not active. Please contact administrator for approval.' 
      });
    }
    
    const validPassword = await bcrypt.compare(password, user.password_hash);
    
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.json({ 
      user: { 
        id: user.id, 
        username: user.username, 
        email: user.email, 
        role: user.role,
        department: user.department,
        status: user.status
      },
      token 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getProfile = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, username, email, role, department, employee_id, student_id, phone, status, created_at FROM users WHERE id = ?',
      [req.user.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, username, email, role, department, status FROM users WHERE status = ? ORDER BY username',
      ['active']
    );
    
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
