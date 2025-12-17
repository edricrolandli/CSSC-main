import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";

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

// Import database (connection will be tested at startup in dev only)
import "./config/database.js";

dotenv.config();

const app = express();

// Configure allowed origins from environment (comma-separated) for flexible deployments
const DEFAULT_ALLOWED_ORIGINS = (
  process.env.ALLOWED_ORIGINS ||
  "https://cssc-lyart.vercel.app, http://localhost:5173,http://localhost:5174,https://csscayamgeprek.vercel.app,https://csscayamgeprek-tau.vercel.app"
)
  .split(",")
  .map((s) => s.trim());

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

// Log OPTIONS (preflight) requests for debugging CORS issues
app.use((req, res, next) => {
  if (req.method === "OPTIONS") {
    console.log(
      `[CORS-OPTIONS] origin=${req.get("Origin")} host=${req.get(
        "Host"
      )} path=${req.path}`
    );
  }
  next();
});

// Root API endpoint to verify deployment and avoid redirects
app.get("/api", (req, res) => {
  console.log(
    `[API-ROOT] ${req.method} ${req.originalUrl} - origin=${
      req.get("Origin") || "<no-origin>"
    } host=${req.get("Host")}`
  );
  res.json({
    message: "CSSC API is running",
    version: "1.0.0",
    environment: process.env.NODE_ENV || "development",
    allowedOrigins: DEFAULT_ALLOWED_ORIGINS,
  });
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

export default app;
