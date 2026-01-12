// server/routes/progress.js
import express from "express";
import pool from "../db/pool.js";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";

const router = express.Router();
router.use(express.json());
router.use(cookieParser());

// Verify JWT Token
const verifyToken = (req) => {
    const token = req.cookies.auth_token;
    if (!token) return null;
    try {
        return jwt.verify(token, process.env.JWT_SECRET).userId;
    } catch (err) {
        return null;
    }
};

// GET /api/progress/:courseId - Get user's progress for a course
router.get("/progress/:courseId", async (req, res) => {
    const userId = verifyToken(req);
    if (!userId) return res.status(401).json({ error: "Not authenticated" });

    const { courseId } = req.params;

    try {
        const conn = await pool.getConnection();

        // Get all completed lesson IDs for this course
        const completed = await conn.query(
            `SELECT lp.lesson_id 
             FROM lesson_progress lp
             JOIN lesson l ON lp.lesson_id = l.id
             JOIN chapter c ON l.chapter_id = c.id
             WHERE lp.user_id = ? AND c.curs_id = ? AND lp.is_completed = 1`,
            [userId, courseId]
        );

        conn.release();

        res.json({
            completedLessonIds: completed.map(row => row.lesson_id)
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch progress" });
    }
});

// POST /api/progress/lesson/:lessonId - Mark lesson as complete/incomplete
router.post("/progress/lesson/:lessonId", async (req, res) => {
    const userId = verifyToken(req);
    if (!userId) return res.status(401).json({ error: "Not authenticated" });

    const { lessonId } = req.params;
    const { isCompleted } = req.body;

    try {
        const conn = await pool.getConnection();

        if (isCompleted) {
            // Mark as completed (UPSERT)
            await conn.query(
                `INSERT INTO lesson_progress (user_id, lesson_id, is_completed, completed_at)
                 VALUES (?, ?, 1, NOW())
                 ON DUPLICATE KEY UPDATE 
                    is_completed = 1,
                    completed_at = NOW()`,
                [userId, lessonId]
            );
        } else {
            // Mark as incomplete (keeps row for tracking, just sets flag to 0)
            await conn.query(
                `UPDATE lesson_progress 
                 SET is_completed = 0, completed_at = NULL
                 WHERE user_id = ? AND lesson_id = ?`,
                [userId, lessonId]
            );
        }

        // FIXED: Update enrollment progress percentage with proper BigInt handling
        await updateCourseProgress(conn, userId, lessonId);

        conn.release();
        res.json({ message: "Progress updated" });
    } catch (err) {
        console.error("Error updating lesson progress:", err);
        res.status(500).json({ error: "Failed to update progress" });
    }
});

// FIXED: Helper function with proper BigInt handling and better error logging
async function updateCourseProgress(conn, userId, lessonId) {
    try {
        // Get course ID from lesson
        const [lesson] = await conn.query(
            `SELECT c.curs_id 
             FROM lesson l 
             JOIN chapter c ON l.chapter_id = c.id 
             WHERE l.id = ?`,
            [lessonId]
        );

        if (!lesson) {
            console.error("Lesson not found for progress update:", lessonId);
            return;
        }

        const courseId = lesson.curs_id;

        // Calculate progress - FIXED: Proper BigInt handling
        const stats = await conn.query(
            `SELECT 
                COUNT(CASE WHEN lp.is_completed = 1 THEN 1 END) as completed,
                (SELECT COUNT(*) 
                 FROM lesson l2
                 JOIN chapter ch2 ON l2.chapter_id = ch2.id
                 WHERE ch2.curs_id = ? AND l2.is_published
                ) as total
             FROM lesson l
             JOIN chapter ch ON l.chapter_id = ch.id
             LEFT JOIN lesson_progress lp ON lp.lesson_id = l.id AND lp.user_id = ?
             WHERE ch.curs_id = ?`,
            [courseId, userId, courseId]
        );

        if (!stats || stats.length === 0) {
            console.error("No stats returned for course:", courseId);
            return;
        }

        // CRITICAL FIX: Convert BigInt to Number before calculation
        const completed = Number(stats[0].completed || 0);
        const total = Number(stats[0].total || 0);

        console.log(`Progress Update - Course ${courseId}, User ${userId}: ${completed}/${total} lessons`);

        const progressPercent = total > 0
            ? Math.round((completed / total) * 100)
            : 0;

        // Update enrollment table
        const result = await conn.query(
            `UPDATE enrollment 
             SET progress_percentage = ?
             WHERE user_id = ? AND course_id = ?`,
            [progressPercent, userId, courseId]
        );

        console.log(`Progress updated to ${progressPercent}% for user ${userId} in course ${courseId}`);

        if (result.affectedRows === 0) {
            console.warn(`No enrollment found for user ${userId} in course ${courseId}`);
        }

    } catch (err) {
        console.error("Failed to update course progress:", err);
        // Don't throw - let the lesson progress update succeed even if this fails
    }
}

// GET /api/enrollments - Get user's enrolled courses WITH PROPER PROGRESS FROM DATABASE
router.get("/enrollments", async (req, res) => {
    const userId = verifyToken(req);
    if (!userId) return res.status(401).json({ error: "Not authenticated" });

    try {
        const conn = await pool.getConnection();

        const enrollments = await conn.query(
            `SELECT 
                e.*,
                c.nume_curs,
                c.thumbnail_url,
                c.dificultate,
                u.name as instructor_name,
                (SELECT COUNT(*) 
                 FROM lesson_progress lp
                 JOIN lesson l ON lp.lesson_id = l.id
                 JOIN chapter ch ON l.chapter_id = ch.id
                 WHERE ch.curs_id = e.course_id AND l.is_published AND lp.user_id = e.user_id AND lp.is_completed = 1
                ) as completed_lessons,
                (SELECT COUNT(*)
                 FROM lesson l
                 JOIN chapter ch ON l.chapter_id = ch.id
                 WHERE ch.curs_id = e.course_id AND l.is_published
                ) as total_lessons
             FROM enrollment e
             JOIN curs c ON e.course_id = c.curs_id
             JOIN user u ON c.autor_id = u.id
             WHERE e.user_id = ?
             ORDER BY e.enrolled_at DESC`,
            [userId]
        );

        // FIXED: Use database progress_percentage, only recalculate for display counts
        const enrichedEnrollments = enrollments.map(enrollment => ({
            ...enrollment,
            completed_lessons: Number(enrollment.completed_lessons || 0),
            total_lessons: Number(enrollment.total_lessons || 0),
            // Use the database value, not recalculated
            progress_percentage: Number(enrollment.progress_percentage || 0)
        }));

        conn.release();
        res.json(enrichedEnrollments);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch enrollments" });
    }
});

// POST /api/enroll/:courseId - Enroll in a course
router.post("/enroll/:courseId", async (req, res) => {
    const userId = verifyToken(req);
    if (!userId) return res.status(401).json({ error: "Not authenticated" });

    const { courseId } = req.params;

    try {
        const conn = await pool.getConnection();

        // Check if already enrolled
        const [existing] = await conn.query(
            "SELECT id FROM enrollment WHERE user_id = ? AND course_id = ?",
            [userId, courseId]
        );

        if (existing) {
            conn.release();
            return res.status(400).json({ error: "Already enrolled in this course" });
        }

        // Get course details
        const [course] = await conn.query(
            "SELECT pret, autor_id FROM curs WHERE curs_id = ?",
            [courseId]
        );

        if (!course) {
            conn.release();
            return res.status(404).json({ error: "Course not found" });
        }

        // Check if user is the course author
        if (course.autor_id === userId) {
            conn.release();
            return res.status(400).json({ error: "You cannot enroll in your own course" });
        }

        // Create enrollment
        await conn.query(
            "INSERT INTO enrollment (user_id, course_id, purchase_price, progress_percentage) VALUES (?, ?, ?, 0)",
            [userId, courseId, course.pret]
        );

        // Update student count
        await conn.query(
            "UPDATE curs SET studenti_inrolati = studenti_inrolati + 1 WHERE curs_id = ?",
            [courseId]
        );

        conn.release();
        res.json({ message: "Successfully enrolled!" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to enroll" });
    }
});

// GET /api/check-enrollment/:courseId - Check if user is enrolled
router.get("/check-enrollment/:courseId", async (req, res) => {
    const userId = verifyToken(req);
    if (!userId) return res.json({ isEnrolled: false });

    const { courseId } = req.params;

    try {
        const conn = await pool.getConnection();

        const [enrollment] = await conn.query(
            "SELECT id FROM enrollment WHERE user_id = ? AND course_id = ?",
            [userId, courseId]
        );

        conn.release();
        res.json({ isEnrolled: !!enrollment });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to check enrollment" });
    }
});

export default router;