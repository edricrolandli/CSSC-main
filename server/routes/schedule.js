import express from "express";
import pool from "../config/database.js";
import {
  authenticate,
  requireKomting,
  requireAdminOrKomting,
  validate,
  scheduleSchemas,
  validateTimeRange,
  validateFutureDate,
  logActivity,
} from "../middleware/index.js";
import {
  validateScheduleDate,
  validateScheduleTime,
} from "../middleware/dateValidation.js";

const router = express.Router();

// Get default schedule for a user
router.get("/default", authenticate, async (req, res) => {
  try {
    const user_id = req.user.id;

    let query = `
      SELECT c.id, c.course_code, c.course_name as name, cs.day_of_week, cs.start_time, cs.end_time,
             cs.lecturer_name, cl.room_number as room_name, cl.capacity,
             b.building_name as building
      FROM class_schedules cs
      JOIN courses c ON cs.course_id = c.id
      LEFT JOIN classrooms cl ON cs.room_id = cl.id
      LEFT JOIN buildings b ON cl.building_id = b.id
      WHERE 1=1
    `;

    let queryParams = [];

    // Filter based on user subscriptions
    if (req.user.role === "admin") {
      // Admin sees all courses - no filter needed
    } else {
      // Regular users see only subscribed courses
      query += ` AND EXISTS (SELECT 1 FROM user_class_schedules ucs WHERE ucs.user_id = $1 AND ucs.class_schedule_id = cs.id)`;
      queryParams.push(user_id);
    }

    query += ` ORDER BY cs.day_of_week, cs.start_time`;

    const result = await pool.query(query, queryParams);

    // Map day numbers to Indonesian names
    const dayNames = [
      "Minggu",
      "Senin",
      "Selasa",
      "Rabu",
      "Kamis",
      "Jumat",
      "Sabtu",
    ];

    const schedule = result.rows.map((course) => ({
      ...course,
      default_day: course.day_of_week,
      default_start_time: course.start_time,
      default_end_time: course.end_time,
      day_name: dayNames[course.day_of_week - 1] || "Unknown",
    }));

    res.json({
      schedule,
      total: schedule.length,
    });
  } catch (error) {
    console.error("Get default schedule error:", error);
    res.status(500).json({
      error: "Failed to get default schedule",
      details: error.message,
    });
  }
});

// Get real schedule (actual events) for a user
router.get("/real", authenticate, async (req, res) => {
  // Prevent caching for debugging
  res.set("Cache-Control", "no-cache, no-store, must-revalidate");
  res.set("Pragma", "no-cache");
  res.set("Expires", "0");

  try {
    const user_id = req.user.id;
    const { start_date, end_date } = req.query;

    console.log("🔍 Real schedule request:", {
      user_id,
      user_role: req.user.role,
      start_date,
      end_date,
    });

    // Default to current week if no date range provided
    let startDate = new Date();
    let endDate = new Date();

    if (start_date && end_date) {
      startDate = new Date(start_date);
      endDate = new Date(end_date);
    } else {
      // Get current week (Monday to Sunday)
      const currentDay = startDate.getDay();
      const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay;
      startDate.setDate(startDate.getDate() + mondayOffset);
      endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6);
    }

    console.log("📅 Date range:", {
      startDate: `${startDate.getFullYear()}-${String(
        startDate.getMonth() + 1
      ).padStart(2, "0")}-${String(startDate.getDate()).padStart(2, "0")}`,
      endDate: `${endDate.getFullYear()}-${String(
        endDate.getMonth() + 1
      ).padStart(2, "0")}-${String(endDate.getDate()).padStart(2, "0")}`,
    });

    let query = `
      SELECT cs.id, cs.day_of_week, cs.start_time, cs.end_time,
             c.id as course_id, c.course_code, c.course_name,
             cs.lecturer_name,
             cl.id as room_id, cl.room_number as room_name, cl.capacity,
             b.building_name as building, cs.created_at as event_created_at
      FROM class_schedules cs
      JOIN courses c ON cs.course_id = c.id
      LEFT JOIN classrooms cl ON cs.room_id = cl.id
      LEFT JOIN buildings b ON cl.building_id = b.id
      WHERE 1=1
    `;

    let queryParams = [];

    // Filter based on user subscriptions
    if (req.user.role === "admin") {
      // Admin sees all schedules - no filter needed
    } else {
      // Regular users see only subscribed courses
      query += ` AND EXISTS (SELECT 1 FROM user_class_schedules ucs WHERE ucs.user_id = $1 AND ucs.class_schedule_id = cs.id)`;
      queryParams.push(user_id);
    }

    query += ` ORDER BY cs.day_of_week, cs.start_time`;

    console.log("🔍 Query:", query);
    console.log("🔍 Params:", queryParams);
    console.log("🔍 User role check - is admin?", req.user.role === "admin");

    const result = await pool.query(query, queryParams);

    console.log("📊 Query result:", {
      rowCount: result.rows.length,
      sampleRows: result.rows.slice(0, 2),
    });
    console.log(
      "📊 All courses found:",
      result.rows.map((r) => r.course_name)
    );

    // Group events by day of week
    const eventsByDay = {};
    const dayNames = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];

    result.rows.forEach((event) => {
      const dayKey = event.day_of_week;
      if (!eventsByDay[dayKey]) {
        eventsByDay[dayKey] = [];
      }
      eventsByDay[dayKey].push({
        id: event.id,
        course_id: event.course_id,
        course_code: event.course_code,
        course_name: event.course_name,
        lecturer_name: event.lecturer_name,
        room: {
          id: event.room_id,
          name: event.room_name,
          capacity: event.capacity,
          building: event.building,
        },
        time: `${event.start_time} - ${event.end_time}`,
        start_time: event.start_time,
        end_time: event.end_time,
        day_of_week: event.day_of_week,
        day_name: dayNames[event.day_of_week] || "Unknown",
        created_at: event.event_created_at,
      });
    });

    console.log("📤 Sending response with", result.rows.length, "events");

    res.json({
      events: eventsByDay,
      date_range: {
        start_date: `${startDate.getFullYear()}-${String(
          startDate.getMonth() + 1
        ).padStart(2, "0")}-${String(startDate.getDate()).padStart(2, "0")}`,
        end_date: `${endDate.getFullYear()}-${String(
          endDate.getMonth() + 1
        ).padStart(2, "0")}-${String(endDate.getDate()).padStart(2, "0")}`,
      },
      total_events: result.rows.length,
    });
  } catch (error) {
    console.error("Get real schedule error:", error);
    res.status(500).json({
      error: "Failed to get real schedule",
      details: error.message,
    });
  }
});

// Update schedule with weekly logic (komting only)
router.post(
  "/update",
  authenticate,
  requireAdminOrKomting,
  validateScheduleDate,
  validateScheduleTime,
  logActivity("SCHEDULE_UPDATE"),
  async (req, res) => {
    try {
      const {
        courseId,
        newRoomId,
        newDate,
        newStartTime,
        newEndTime,
        weekNumber,
        meetingNumber,
      } = req.body;

      console.log(
        `[DEBUG] ${
          req.user?.name || req.user?.email
        } mencoba mengubah jadwal course ${courseId} -> ${newDate} ${newStartTime}-${newEndTime}`
      );

      if (!courseId || !newDate || !newStartTime || !newEndTime) {
        return res.status(400).json({
          error: "Missing required fields",
          details: "courseId, newDate, newStartTime, newEndTime are required",
        });
      }

      // Calculate academic week if not provided (use local date parsing)
      const [yS, mS, dS] = "2024-08-26".split("-").map(Number);
      const semesterStartLocal = new Date(yS, mS - 1, dS);
      const [yN, mN, dN] = newDate.split("-").map(Number);
      const academicWeek =
        weekNumber ||
        Math.ceil(
          (new Date(yN, mN - 1, dN) - semesterStartLocal) /
            (7 * 24 * 60 * 60 * 1000)
        );

      // Get next meeting number if not provided
      let finalMeetingNumber = meetingNumber;
      if (!finalMeetingNumber) {
        const meetingResult = await pool.query(
          "SELECT COALESCE(MAX(meeting_number), 0) + 1 as next_meeting FROM schedule_events WHERE course_id = $1 AND status NOT IN ('cancelled', 'replaced')",
          [courseId]
        );
        finalMeetingNumber = meetingResult.rows[0].next_meeting;
      }

      // Validate meeting number (1-16 per course)
      if (finalMeetingNumber < 1 || finalMeetingNumber > 16) {
        return res.status(400).json({
          error: "Invalid meeting number",
          details: "Meeting number must be between 1 and 16",
        });
      }

      // Use database transaction for consistency
      const client = await pool.connect();
      try {
        await client.query("BEGIN");

        // Check room availability if room is specified
        if (newRoomId) {
          const conflictResult = await client.query(
            `SELECT se.id, c.name as course_name FROM schedule_events se
           JOIN courses c ON se.course_id = c.id
           WHERE se.room_id = $1 AND se.event_date = $2 AND se.status NOT IN ('cancelled', 'replaced')
           AND se.start_time < $4 AND se.end_time > $3 AND se.course_id != $5`,
            [newRoomId, newDate, newStartTime, newEndTime, courseId]
          );

          if (conflictResult.rows.length > 0) {
            await client.query("ROLLBACK");
            return res.status(409).json({
              error: "Room conflict",
              details: `Room is already booked by ${conflictResult.rows[0].course_name}`,
              conflicting_course: conflictResult.rows[0].course_name,
            });
          }
        }

        // Mark existing event for this week as replaced
        await client.query(
          `UPDATE schedule_events SET status = 'replaced' 
         WHERE course_id = $1 AND academic_week = $2 AND status NOT IN ('cancelled', 'replaced')`,
          [courseId, academicWeek]
        );

        // Create new schedule event
        const result = await client.query(
          `INSERT INTO schedule_events 
         (course_id, room_id, event_date, start_time, end_time, status, changed_by, academic_week, meeting_number)
         VALUES ($1, $2, $3, $4, $5, 'update', $6, $7, $8)
         RETURNING *`,
          [
            courseId,
            newRoomId || null,
            newDate,
            newStartTime,
            newEndTime,
            req.user.id,
            academicWeek,
            finalMeetingNumber,
          ]
        );

        await client.query("COMMIT");

        console.log(
          `[DEBUG] ${
            req.user?.name || req.user?.email
          } telah mengubah jadwal course ${courseId} ke ${newDate}`
        );
        res.json({
          message: `Schedule updated for week ${academicWeek}, meeting ${finalMeetingNumber}`,
          event: result.rows[0],
          week_number: academicWeek,
          meeting_number: finalMeetingNumber,
        });
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error("Update schedule error:", error);
      res.status(500).json({
        error: "Failed to update schedule",
        details: error.message,
      });
    }
  }
);

// Get schedule history for a course (komting only)
router.get(
  "/history/:course_id",
  authenticate,
  requireAdminOrKomting,
  async (req, res) => {
    try {
      const { course_id } = req.params;

      // Check if course exists and user is the komting for this course
      const courseResult = await pool.query(
        "SELECT id, name, komting_id FROM courses WHERE id = $1 AND is_active = true",
        [course_id]
      );

      if (courseResult.rows.length === 0) {
        return res.status(404).json({
          error: "Course not found",
          details: "Course does not exist or is inactive",
        });
      }

      const course = courseResult.rows[0];

      // Check if user is the komting for this course (unless admin)
      if (req.user.role !== "admin" && course.komting_id !== req.user.id) {
        return res.status(403).json({
          error: "Access denied",
          details: "You are not the komting for this course",
        });
      }

      const result = await pool.query(
        `
      SELECT se.id, se.event_date, se.start_time, se.end_time, se.status, se.change_reason,
             se.created_at as event_created_at,
             r.name as room_name, r.capacity, r.floor, r.building,
             u.name as changed_by_name,
             pe.event_date as previous_event_date, pe.start_time as previous_start_time, 
             pe.end_time as previous_end_time, pr.name as previous_room_name
      FROM schedule_events se
      JOIN rooms r ON se.room_id = r.id
      LEFT JOIN users u ON se.changed_by = u.id
      LEFT JOIN schedule_events pe ON se.previous_event_id = pe.id
      LEFT JOIN rooms pr ON pe.room_id = pr.id
      WHERE se.course_id = $1
      ORDER BY se.created_at DESC
    `,
        [course_id]
      );

      res.json({
        course: {
          id: course.id,
          name: course.name,
        },
        history: result.rows,
        total: result.rows.length,
      });
    } catch (error) {
      console.error("Get schedule history error:", error);
      res.status(500).json({
        error: "Failed to get schedule history",
        details: error.message,
      });
    }
  }
);

export default router;
