import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";
import { createServer } from "http";
import { Server } from "socket.io";
import path from "path";
import { fileURLToPath } from "url";

// Import routes
import authRoutes from "./routes/auth.js";
import courseRoutes from "./routes/courses.js";
import scheduleRoutes from "./routes/schedule.js";
import scheduleV2Routes from "./routes/schedule-v2.js";
import scheduleNewRoutes from "./routes/schedule-new.js";
import scheduleFixedRoutes from "./routes/schedule-fixed.js";
import roomRoutes from "./routes/rooms.js";
import notificationRoutes from "./routes/notifications.js";
import announcementRoutes from "./routes/announcements.js";
import materialRoutes from "./routes/materials.js";

// Import middleware
import { requestLogger } from "./middleware/index.js";

// Import database (connection will be tested at startup)
import "./config/database.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);
// Configure allowed origins from environment (comma-separated) for flexible deployments
const DEFAULT_ALLOWED_ORIGINS = (
  process.env.ALLOWED_ORIGINS ||
  "https://cssc-lyart.vercel.app, http://localhost:5173,http://localhost:5174,https://csscayamgeprek.vercel.app,https://csscayamgeprek-tau.vercel.app"
)
  .split(",")
  .map((s) => s.trim());

const corsOriginForSocket = DEFAULT_ALLOWED_ORIGINS.includes("*")
  ? "*"
  : DEFAULT_ALLOWED_ORIGINS;

const io = new Server(server, {
  cors: {
    origin: corsOriginForSocket,
    methods: ["GET", "POST"],
  },
});

// Middleware
app.use(helmet());

// Express CORS options: allow specified origins and preflight handling
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (e.g., mobile apps, curl)
    if (!origin) return callback(null, true);
    if (
      DEFAULT_ALLOWED_ORIGINS.includes("*") ||
      DEFAULT_ALLOWED_ORIGINS.includes(origin)
    ) {
      return callback(null, true);
    }
    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
};

app.use(cors(corsOptions));

// Debug endpoint to show what origins the server will accept
app.get("/api/cors", (req, res) => {
  res.json({ allowedOrigins: DEFAULT_ALLOWED_ORIGINS });
});

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
  message: {
    error: "Too many requests from this IP, please try again later.",
  },
});
app.use("/api/", limiter);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Request logging
app.use(requestLogger);

// Health check endpoint
app.get("/api/health", async (req, res) => {
  try {
    // Test database connection
    const { default: pool } = await import("./config/database.js");
    const dbResult = await pool.query("SELECT NOW() as db_time");

    res.json({
      status: "OK",
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || "development",
      database: {
        connected: true,
        server_time: dbResult.rows[0].db_time,
      },
    });
  } catch (error) {
    console.error("Health check database error:", error);
    res.status(503).json({
      status: "ERROR",
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || "development",
      database: {
        connected: false,
        error: error.message,
      },
    });
  }
});

// Root endpoint - API info
app.get("/", (req, res) => {
  res.json({
    message: "CSSC Scheduling System API",
    version: "1.0.0",
    status: "Running",
    endpoints: {
      health: "/api/health",
      auth: "/api/auth",
      courses: "/api/courses",
      schedule: "/api/schedule",
      rooms: "/api/rooms",
      notifications: "/api/notifications",
    },
    documentation: "See README.md for API documentation",
  });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/schedule", scheduleFixedRoutes); // Use fixed version
app.use("/api/schedule-old", scheduleRoutes); // Keep old for backup
app.use("/api/schedule-v2", scheduleV2Routes);
app.use("/api/schedule-new", scheduleNewRoutes); // Keep new for reference
app.use("/api/rooms", roomRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/announcements", announcementRoutes);
app.use("/api/materials", materialRoutes);

// Socket.IO for real-time updates
io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  // Join user to their personal room for notifications
  socket.on("join-user-room", (userId) => {
    socket.join(`user-${userId}`);
    console.log(`User ${userId} joined their room`);
  });

  // Join course room for course-specific updates
  socket.on("join-course-room", (courseId) => {
    socket.join(`course-${courseId}`);
    console.log(`User joined course room: ${courseId}`);
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

// Make io available to routes
app.set("io", io);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Error:", err);

  if (err.name === "ValidationError") {
    return res.status(400).json({
      error: "Validation Error",
      details: err.message,
    });
  }

  if (err.code === "23505") {
    // PostgreSQL unique violation
    return res.status(409).json({
      error: "Duplicate Entry",
      details: "This record already exists",
    });
  }

  res.status(err.status || 500).json({
    error: err.message || "Internal Server Error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    error: "Route not found",
    path: req.originalUrl,
  });
});

const PORT = process.env.PORT || 5000;

// Test database connection before starting server
const testDatabaseConnection = async () => {
  try {
    console.log("🔍 Testing database connection...");
    const { default: pool } = await import("./config/database.js");

    const result = await pool.query(
      "SELECT NOW() as current_time, version() as db_version"
    );
    console.log("✅ Database connected successfully:", {
      time: result.rows[0].current_time,
      version: result.rows[0].db_version.split(" ")[0],
    });

    // Test if users table exists and has data
    const userCount = await pool.query("SELECT COUNT(*) as count FROM users");
    console.log(`👥 Users in database: ${userCount.rows[0].count}`);

    // Show sample users for debugging
    const sampleUsers = await pool.query(
      "SELECT id, name, email, role FROM users LIMIT 3"
    );
    console.log("📋 Sample users:", sampleUsers.rows);

    return true;
  } catch (error) {
    console.error("❌ Database connection failed:", {
      message: error.message,
      code: error.code,
      detail: error.detail,
    });

    if (error.code === "ECONNREFUSED") {
      console.error(
        "💡 Suggestion: Make sure PostgreSQL is running and check your .env file"
      );
    } else if (error.code === "3D000") {
      console.error(
        "💡 Suggestion: Database does not exist. Run migrations first."
      );
    } else if (error.code === "42P01") {
      console.error(
        "💡 Suggestion: Tables do not exist. Run migrations and seeding."
      );
    }

    return false;
  }
};

server.listen(PORT, async () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 Socket.IO enabled for real-time updates`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(
    `🔗 Frontend URL: ${process.env.FRONTEND_URL || "http://localhost:5173"}`
  );

  // Test database connection
  const dbConnected = await testDatabaseConnection();
  if (!dbConnected) {
    console.warn(
      "⚠️  Server started but database connection failed. Authentication will not work."
    );
  }
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received, shutting down gracefully");
  server.close(() => {
    console.log("Process terminated");
  });
});

process.on("SIGINT", () => {
  console.log("SIGINT received, shutting down gracefully");
  server.close(() => {
    console.log("Process terminated");
  });
});
