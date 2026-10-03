import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import database from '../db/database.js';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Generate standard JWT token for user
 */
const signToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
    },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn }
  );
};

/**
 * Student Registration
 */
export const register = (req, res, next) => {
  try {
    const { name, email, password, student_id, department, phone } = req.body;

    // Validation
    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Please provide a valid full name (minimum 2 characters).',
      });
    }

    if (!email || !EMAIL_REGEX.test(email.trim())) {
      return res.status(400).json({
        success: false,
        error: 'Please provide a valid email address.',
      });
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 6 characters long.',
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check if user already exists
    const existing = database.get('SELECT id FROM users WHERE email = ?', [normalizedEmail]);
    if (existing) {
      return res.status(409).json({
        success: false,
        error: 'An account with this email address already exists. Please log in.',
      });
    }

    // Hash password securely
    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(password, salt);

    // Insert new student user
    const result = database.run(
      `INSERT INTO users (name, email, password_hash, role, student_id, department, phone)
       VALUES (?, ?, ?, 'student', ?, ?, ?)`,
      [
        name.trim(),
        normalizedEmail,
        passwordHash,
        student_id ? student_id.trim() : null,
        department ? department.trim() : null,
        phone ? phone.trim() : null,
      ]
    );

    const newUser = database.get(
      'SELECT id, name, email, role, student_id, department, phone, created_at FROM users WHERE id = ?',
      [result.lastInsertRowid]
    );

    const token = signToken(newUser);

    return res.status(201).json({
      success: true,
      message: 'Account registered successfully.',
      token,
      user: newUser,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * User Login (Student or Admin)
 */
export const login = (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required.',
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = database.get('SELECT * FROM users WHERE email = ?', [normalizedEmail]);

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password.',
      });
    }

    const isMatch = bcrypt.compareSync(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password.',
      });
    }

    const token = signToken(user);

    // Sanitize user object
    const userProfile = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      student_id: user.student_id,
      department: user.department,
      phone: user.phone,
      created_at: user.created_at,
    };

    return res.status(200).json({
      success: true,
      message: 'Logged in successfully.',
      token,
      user: userProfile,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Get profile of currently authenticated user
 */
export const getProfile = (req, res) => {
  return res.status(200).json({
    success: true,
    user: req.user,
  });
};
