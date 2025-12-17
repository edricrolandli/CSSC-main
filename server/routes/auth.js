import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import pool from "../config/database.js";
import {
  authenticate,
  validate,
  userSchemas,
  logActivity,
  logSecurityEvent,
} from "../middleware/index.js";

const router = express.Router();

// Generate JWT token
const generateToken = (user) => {
  console.log("🎫 Generating token for user:", {
    id: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
    hasJwtSecret: !!process.env.JWT_SECRET,
  });

  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET environment variable is not set");
  }

  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );
};

// Register new user
router.post(
  "/register",
  validate(userSchemas.register),
  logActivity("USER_REGISTER"),
  async (req, res) => {
    try {
      const { name, email, password, role, phone } = req.body;

      // Check if user already exists
      const existingUser = await pool.query(
        "SELECT id FROM users WHERE email = $1",
        [email]
      );

      if (existingUser.rows.length > 0) {
        return res.status(409).json({
          error: "User already exists",
          details: "Email is already registered",
        });
      }

      // Hash password
      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(password, saltRounds);

      // Create user
      const result = await pool.query(
        `INSERT INTO users (name, email, password_hash, role, phone)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, email, role, phone, created_at`,
        [name, email, passwordHash, role, phone || null]
      );

      const user = result.rows[0];

      // Generate token
      const token = generateToken(user);

      res.status(201).json({
        message: "User registered successfully",
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone,
          created_at: user.created_at,
        },
        token,
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({
        error: "Registration failed",
        details: error.message,
      });
    }
  }
);

// Login user
router.post("/login", validate(userSchemas.login), async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log("🔐 Login attempt:", { email, hasPassword: !!password });
    console.log("✅ Input validated for email:", email);

    // Find user
    console.log("🔍 Searching for user with email:", email);
    const result = await pool.query(
      `SELECT id, name, email, password_hash, role, phone, created_at
       FROM users WHERE email = $1`,
      [email]
    );

    console.log("📊 Database query result:", {
      rowCount: result.rows.length,
      foundUser:
        result.rows.length > 0
          ? {
              id: result.rows[0]?.id,
              name: result.rows[0]?.name,
              email: result.rows[0]?.email,
              role: result.rows[0]?.role,
              hasPasswordHash: !!result.rows[0]?.password_hash,
            }
          : null,
    });

    if (result.rows.length === 0) {
      console.log("❌ User not found for email:", email);
      return res.status(401).json({
        error: "Invalid credentials",
        details: "Email or password is incorrect",
      });
    }

    const user = result.rows[0];
    console.log("👤 User found:", {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    });

    // Verify password
    console.log("🔒 Verifying password...");
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    console.log("🔑 Password verification result:", isValidPassword);

    if (!isValidPassword) {
      console.log("❌ Invalid password for user:", email);
      await logSecurityEvent(
        "FAILED_LOGIN",
        { email, reason: "invalid_password" },
        req
      );
      return res.status(401).json({
        error: "Invalid credentials",
        details: "Email or password is incorrect",
      });
    }

    // Generate token
    console.log("🎫 Generating JWT token...");
    const token = generateToken(user);
    console.log("✅ Token generated successfully");

    const response = {
      message: "Login successful",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        created_at: user.created_at,
      },
      token,
    };

    console.log("🎉 Login successful for user:", {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    });

    res.json(response);
  } catch (error) {
    console.error("💥 Login error:", {
      message: error.message,
      stack: error.stack,
      code: error.code,
      detail: error.detail,
    });

    // Check if it's a database connection error
    if (error.code === "ECONNREFUSED" || error.code === "ENOTFOUND") {
      return res.status(500).json({
        error: "Database connection failed",
        details:
          "Unable to connect to database. Please check database configuration.",
      });
    }

    res.status(500).json({
      error: "Login failed",
      details: error.message,
    });
  }
});

// Get current user (protected route)
router.get("/me", authenticate, async (req, res) => {
  try {
    res.json({ user: req.user });
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({
      error: "Failed to get user",
      details: error.message,
    });
  }
});

// Update user profile
router.put(
  "/profile",
  authenticate,
  validate(userSchemas.updateProfile),
  logActivity("USER_UPDATE_PROFILE"),
  async (req, res) => {
    try {
      console.log(
        `[DEBUG] ${req.user?.name || req.user?.email} mencoba mengubah profil`
      );
      const { name, phone, email } = req.body;

      // Build update query dynamically
      const updateFields = [];
      const updateValues = [];
      let paramIndex = 1;

      if (name !== undefined) {
        updateFields.push(`name = $${paramIndex++}`);
        updateValues.push(name);
      }
      if (phone !== undefined) {
        updateFields.push(`phone = $${paramIndex++}`);
        updateValues.push(phone);
      }
      if (email !== undefined) {
        // Check if email is already taken by another user
        const existingEmail = await pool.query(
          "SELECT id FROM users WHERE email = $1 AND id != $2",
          [email, req.user.id]
        );

        if (existingEmail.rows.length > 0) {
          await logSecurityEvent(
            "EMAIL_CONFLICT",
            { email, userId: req.user.id },
            req
          );
          return res.status(409).json({
            error: "Email already taken",
            details: "This email is already registered to another user",
          });
        }

        updateFields.push(`email = $${paramIndex++}`);
        updateValues.push(email);
      }

      if (updateFields.length === 0) {
        return res.status(400).json({
          error: "No fields to update",
          details: "At least one field must be provided for update",
        });
      }

      updateValues.push(req.user.id);

      // Update user
      const result = await pool.query(
        `UPDATE users 
       SET ${updateFields.join(", ")}
       WHERE id = $${paramIndex}
       RETURNING id, name, email, role, phone, updated_at`,
        updateValues
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          error: "User not found",
          details: "User no longer exists",
        });
      }

      const user = result.rows[0];

      console.log(
        `[DEBUG] ${req.user?.name || req.user?.email} telah mengubah profil`
      );
      res.json({
        message: "Profile updated successfully",
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone,
          updated_at: user.updated_at,
        },
      });
    } catch (error) {
      console.error("Update profile error:", error);
      res.status(500).json({
        error: "Failed to update profile",
        details: error.message,
      });
    }
  }
);

export default router;
