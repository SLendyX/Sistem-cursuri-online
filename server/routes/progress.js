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
            // Mark as incomplete
            await conn.query(
                `UPDATE lesson_progress 
                 SET is_completed = 0, completed_at = NULL
                 WHERE user_id = ? AND lesson_id = ?`,
                [userId, lessonId]
            );
        }

        conn.release();
        res.json({ message: "Progress updated" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to update progress" });
    }
});

// GET /api/enrollments - Get user's enrolled courses
router.get("/enrollments", async (req, res) => {
    const userId = verifyToken(req);
    if (!userId) return res.status(401).json({ error: "Not authenticated" });

    try {
        const conn = await pool.getConnection();

        const enrollments = await conn.query(
            `SELECT e.*, c.nume_curs, c.thumbnail_url, c.dificultate, u.name as instructor_name
             FROM enrollment e
             JOIN curs c ON e.course_id = c.curs_id
             JOIN user u ON c.autor_id = u.id
             WHERE e.user_id = ?
             ORDER BY e.enrolled_at DESC`,
            [userId]
        );

        conn.release();
        res.json(enrollments);
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

        // Get course price
        const [course] = await conn.query(
            "SELECT pret FROM curs WHERE curs_id = ?",
            [courseId]
        );

        if (!course) {
            conn.release();
            return res.status(404).json({ error: "Course not found" });
        }

        // Create enrollment (payment logic would go here in production)
        await conn.query(
            "INSERT INTO enrollment (user_id, course_id, purchase_price) VALUES (?, ?, ?)",
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