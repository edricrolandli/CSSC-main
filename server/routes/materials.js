import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import pool from "../config/database.js";
import {
  authenticate,
  logActivity,
  logFileOperation,
} from "../middleware/index.js";
import { requireKomting } from "../middleware/authorization.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// File upload configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, "../uploads/materials");
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      `${req.params.courseId}-${
        req.params.meeting
      }-${uniqueSuffix}${path.extname(file.originalname)}`
    );
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = [".pdf", ".doc", ".docx", ".ppt", ".pptx", ".txt"];
  const ext = path.extname(file.originalname).toLowerCase();

  if (allowedTypes.includes(ext)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Invalid file type. Only PDF, DOC, DOCX, PPT, PPTX, TXT allowed"
      ),
      false
    );
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 1,
  },
});

// Aggregated material counts per course
router.get("/counts", authenticate, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT course_id, COUNT(*) as total, MAX(created_at) as last_uploaded
      FROM materials
      GROUP BY course_id
    `);

    const counts = {};
    result.rows.forEach((r) => {
      counts[r.course_id] = {
        total: parseInt(r.total, 10),
        last_uploaded: r.last_uploaded,
      };
    });

    res.json({ counts });
  } catch (err) {
    console.error("Get material counts error:", err);
    res.status(500).json({ error: "Failed to get material counts" });
  }
});

// Get all materials for a course (grouped by meeting)
router.get(
  "/:courseId",
  authenticate,
  logActivity("MATERIAL_READ"),
  async (req, res) => {
    try {
      const courseIdNum = parseInt(req.params.courseId);

      if (isNaN(courseIdNum)) {
        return res.status(400).json({ error: "Invalid courseId" });
      }

      console.log(`\n🔍 GET /materials/:courseId - courseId=${courseIdNum}`);

      const result = await pool.query(
        `
      SELECT m.*, u.name as uploader_name
      FROM materials m
      LEFT JOIN users u ON m.uploaded_by = u.id
      WHERE m.course_id = $1
      ORDER BY m.meeting_number, m.created_at DESC
    `,
        [courseIdNum]
      );

      const grouped = {};
      const meta = {
        total: 0,
        per_meeting: {},
        last_uploaded: null,
      };

      result.rows.forEach((row) => {
        const meeting = row.meeting_number || 0;
        if (!grouped[meeting]) grouped[meeting] = [];

        const item = {
          id: row.id,
          title: row.title,
          file_name: row.file_name,
          file_path: row.file_path,
          file_size: row.file_size,
          file_type: row.file_type,
          uploaded_by: row.uploader_name || "Unknown",
          meeting_number: row.meeting_number,
          created_at: row.created_at,
        };

        grouped[meeting].push(item);

        // Update metadata
        meta.total += 1;
        if (!meta.per_meeting[meeting]) {
          meta.per_meeting[meeting] = { count: 0, last_uploaded: null };
        }
        meta.per_meeting[meeting].count += 1;

        const created = row.created_at;
        if (
          !meta.per_meeting[meeting].last_uploaded ||
          new Date(created) > new Date(meta.per_meeting[meeting].last_uploaded)
        ) {
          meta.per_meeting[meeting].last_uploaded = created;
        }

        if (
          !meta.last_uploaded ||
          new Date(created) > new Date(meta.last_uploaded)
        ) {
          meta.last_uploaded = created;
        }
      });

      res.json({ materials: grouped, meta });
    } catch (error) {
      console.error("Get materials by course error:", error);
      res.status(500).json({ error: "Failed to get materials by course" });
    }
  }
);

// Get materials for a course meeting
router.get(
  "/:courseId/:meeting",
  authenticate,
  logActivity("MATERIAL_READ"),
  async (req, res) => {
    try {
      const { courseId, meeting } = req.params;

      // Convert to integers
      const courseIdNum = parseInt(courseId);
      const meetingNum = parseInt(meeting);

      console.log("\n🔍 GET /materials/:courseId/:meeting");
      console.log(
        `   Raw params: courseId="${courseId}" (${typeof courseId}), meeting="${meeting}" (${typeof meeting})`
      );
      console.log(
        `   Parsed: courseIdNum=${courseIdNum}, meetingNum=${meetingNum}`
      );
      console.log(`   Valid: ${!isNaN(courseIdNum) && !isNaN(meetingNum)}`);

      if (isNaN(courseIdNum) || isNaN(meetingNum)) {
        console.warn("   ❌ Invalid params - returning 400");
        return res
          .status(400)
          .json({ error: "Invalid courseId or meeting format" });
      }

      console.log(
        `   📊 Querying: SELECT * FROM materials WHERE course_id=${courseIdNum} AND meeting_number=${meetingNum}`
      );
      const result = await pool.query(
        `
      SELECT m.*, u.name as uploader_name
      FROM materials m
      LEFT JOIN users u ON m.uploaded_by = u.id
      WHERE m.course_id = $1 AND m.meeting_number = $2
      ORDER BY m.created_at DESC
    `,
        [courseIdNum, meetingNum]
      );

      console.log(`   ✅ Query executed: found ${result.rows.length} rows`);

      if (result.rows.length > 0) {
        console.log("   Materials found:");
        result.rows.forEach((row, idx) => {
          console.log(
            `     ${idx + 1}. ID=${row.id}, title="${row.title}", uploader="${
              row.uploader_name
            }"`
          );
        });
      } else {
        console.log("   ⚠️  No materials in result set");
        // Debug: Check all materials in DB
        const allCheck = await pool.query(
          "SELECT DISTINCT course_id, meeting_number FROM materials ORDER BY course_id, meeting_number"
        );
        console.log(
          `   All course/meeting in DB: ${JSON.stringify(allCheck.rows)}`
        );
      }

      const materials = result.rows.map((material) => ({
        id: material.id,
        title: material.title,
        file_name: material.file_name,
        file_path: material.file_path,
        file_size: material.file_size,
        file_type: material.file_type,
        uploaded_by: material.uploader_name || "Unknown",
        created_at: material.created_at,
        updated_at: material.updated_at,
      }));

      console.log(
        `   📤 Sending response: { materials: [${materials.length} items] }`
      );
      res.json({ materials });
      console.log("   ✅ Response sent");
    } catch (error) {
      console.error("❌ Get materials error:", error.message);
      console.error("   Stack:", error.stack);
      res.status(500).json({ error: "Failed to get materials" });
    }
  }
);

// Upload material (Komting only)
router.post(
  "/:courseId/:meeting/upload",
  authenticate,
  requireKomting,
  upload.single("material"),
  logFileOperation("upload"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const { courseId, meeting } = req.params;
      const { title } = req.body;
      const userId = req.user.id;

      // Validate parameters
      if (!courseId || !meeting) {
        console.error("Missing parameters:", { courseId, meeting });
        return res.status(400).json({ error: "Missing courseId or meeting" });
      }

      const courseIdNum = parseInt(courseId);
      const meetingNum = parseInt(meeting);

      if (isNaN(courseIdNum) || isNaN(meetingNum)) {
        console.error("Invalid parameters:", { courseId, meeting });
        return res
          .status(400)
          .json({ error: "Invalid courseId or meeting format" });
      }

      console.log(
        `[DEBUG] ${req.user?.name || req.user?.email} mencoba mengunggah file=${
          req.file.originalname
        } ke course=${courseIdNum} meeting=${meetingNum}`
      );
      console.log("Uploading file:", {
        courseId: courseIdNum,
        meeting: meetingNum,
        filename: req.file.originalname,
        userId: userId,
      });

      // Insert material into database
      const result = await pool.query(
        `
      INSERT INTO materials (course_id, meeting_number, title, file_name, file_path, file_size, file_type, uploaded_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, title, file_name, file_size, created_at
    `,
        [
          courseIdNum,
          meetingNum,
          title || req.file.originalname,
          req.file.filename,
          `/uploads/materials/${req.file.filename}`,
          req.file.size,
          path.extname(req.file.originalname).substring(1),
          userId,
        ]
      );

      const material = result.rows[0];

      console.log(
        `[DEBUG] ${
          req.user?.name || req.user?.email
        } telah mengunggah materi id=${material.id} title=${
          material.title
        } course=${courseIdNum} meeting=${meetingNum}`
      );
      console.log("Material uploaded successfully:", {
        id: material.id,
        title: material.title,
        courseId: courseIdNum,
        meeting: meetingNum,
      });

      res.status(201).json({
        message: "Material uploaded successfully",
        material: {
          id: material.id,
          title: material.title,
          file_name: material.file_name,
          file_path: material.file_path,
          file_size: material.file_size,
          file_type: material.file_type,
          meeting_number: meetingNum,
          uploaded_by: userId,
          uploaded_by_name: req.user?.name || null,
          created_at: material.created_at,
        },
      });
    } catch (error) {
      console.error("Upload material error:", error);
      res.status(500).json({ error: "Failed to upload material" });
    }
  }
);

// Download material
router.get(
  "/:courseId/:meeting/download/:fileId",
  authenticate,
  logActivity("MATERIAL_DOWNLOAD"),
  async (req, res) => {
    try {
      const { fileId } = req.params;

      // Get material info from database
      const materialResult = await pool.query(
        `
      SELECT * FROM materials WHERE id = $1
    `,
        [fileId]
      );

      if (materialResult.rows.length === 0) {
        return res.status(404).json({ error: "Material not found" });
      }

      const material = materialResult.rows[0];
      const filePath = path.join(
        __dirname,
        "../uploads/materials",
        material.file_name
      );

      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: "File not found" });
      }

      res.download(filePath, material.title);
    } catch (error) {
      console.error("Download material error:", error);
      res.status(500).json({ error: "Failed to download material" });
    }
  }
);

// Delete material (Komting only)
router.delete(
  "/:courseId/:meeting/:fileId",
  authenticate,
  requireKomting,
  logActivity("MATERIAL_DELETE"),
  async (req, res) => {
    try {
      const { fileId } = req.params;

      // Get material info from database first
      const materialResult = await pool.query(
        `
      SELECT * FROM materials WHERE id = $1
    `,
        [fileId]
      );

      if (materialResult.rows.length === 0) {
        return res.status(404).json({ error: "Material not found" });
      }

      const material = materialResult.rows[0];

      console.log(
        `[DEBUG] ${
          req.user?.name || req.user?.email
        } mencoba menghapus materi id=${fileId} title=${material.title}`
      );

      // Delete from file system
      const filePath = path.join(
        __dirname,
        "../uploads/materials",
        material.file_name
      );
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      // Delete from database
      await pool.query("DELETE FROM materials WHERE id = $1", [fileId]);

      console.log(
        `[DEBUG] ${
          req.user?.name || req.user?.email
        } telah menghapus materi id=${fileId} title=${material.title}`
      );

      res.json({ message: "Material deleted successfully" });
    } catch (error) {
      console.error("Delete material error:", error);
      res.status(500).json({ error: "Failed to delete material" });
    }
  }
);

// Aggregated material counts per course
router.get("/counts", authenticate, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT course_id, COUNT(*) as total, MAX(created_at) as last_uploaded
      FROM materials
      GROUP BY course_id
    `);

    const counts = {};
    result.rows.forEach((r) => {
      counts[r.course_id] = {
        total: parseInt(r.total, 10),
        last_uploaded: r.last_uploaded,
      };
    });

    res.json({ counts });
  } catch (err) {
    console.error("Get material counts error:", err);
    res.status(500).json({ error: "Failed to get material counts" });
  }
});

export default router;
