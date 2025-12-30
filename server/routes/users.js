// server/routes/users.js
import express from "express";
import pool from "../db/pool.js";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";

const router = express.Router();
router.use(express.json());
router.use(cookieParser());

const verifyToken = (req) => {
    const token = req.cookies.auth_token;
    if (!token) return null;
    try {
        return jwt.verify(token, process.env.JWT_SECRET).userId;
    } catch (err) { 
        return null; 
    }
};

router.get("/", async (req, res) => {
  try {
    const conn = await pool.getConnection();
    const rows = await conn.query("SELECT * FROM user LIMIT 30");
    conn.release();
    res.json(rows);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/profile - Update user profile
router.patch("/profile", async (req, res) => {
    const userId = verifyToken(req);
    if (!userId) return res.status(401).json({ error: "Not authenticated" });

    const { name } = req.body;

    try {
        const conn = await pool.getConnection();
        
        await conn.query(
            "UPDATE user SET name = ? WHERE id = ?",
            [name, userId]
        );

        conn.release();
        res.json({ message: "Profile updated successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to update profile" });
    }
});

// DELETE /api/profile - Delete user account
router.delete("/profile", async (req, res) => {
    const userId = verifyToken(req);
    if (!userId) return res.status(401).json({ error: "Not authenticated" });

    try {
        const conn = await pool.getConnection();

        // Check if user is a professor with courses that have students
        const [user] = await conn.query("SELECT type FROM user WHERE id = ?", [userId]);
        
        if (user?.type === 'professor') {
            const courses = await conn.query(
                "SELECT curs_id FROM curs WHERE autor_id = ?",
                [userId]
            );

            for (const course of courses) {
                const [enrollment] = await conn.query(
                    "SELECT COUNT(*) as count FROM enrollment WHERE course_id = ?",
                    [course.curs_id]
                );

                if (enrollment.count > 0) {
                    conn.release();
                    return res.status(400).json({ 
                        error: "Cannot delete account. You have courses with enrolled students. Please remove students first or transfer course ownership."
                    });
                }
            }
        }

        // Delete user (CASCADE will handle related records)
        await conn.query("DELETE FROM user WHERE id = ?", [userId]);

        conn.release();
        res.json({ message: "Account deleted successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to delete account" });
    }
});

// GET /api/instructor/:id - Public instructor profile
router.get("/instructor/:id", async (req, res) => {
    const instructorId = req.params.id;

    try {
        const conn = await pool.getConnection();

        // Get instructor info
        const [instructor] = await conn.query(
            "SELECT id, name, username, email FROM user WHERE id = ? AND type = 'professor'",
            [instructorId]
        );

        if (!instructor) {
            conn.release();
            return res.status(404).json({ error: "Instructor not found" });
        }

        // Get instructor's published courses
        const courses = await conn.query(
            `SELECT c.*, 
                    (SELECT AVG(rating) FROM reviews WHERE course_id = c.curs_id) as avg_rating,
                    (SELECT COUNT(*) FROM reviews WHERE course_id = c.curs_id) as review_count
             FROM curs c
             WHERE c.autor_id = ? AND c.is_published = 1
             ORDER BY c.curs_id DESC`,
            [instructorId]
        );

        // Get statistics
        const [stats] = await conn.query(
            `SELECT 
                COUNT(DISTINCT c.curs_id) as total_courses,
                SUM(c.studenti_inrolati) as total_students,
                AVG(c.rating) as avg_rating
             FROM curs c
             WHERE c.autor_id = ? AND c.is_published = 1`,
            [instructorId]
        );

        conn.release();

        res.json({
            instructor: {
                id: instructor.id,
                name: instructor.name,
                username: instructor.username,
                email: instructor.email
            },
            courses,
            stats: {
                totalCourses: stats?.total_courses || 0,
                totalStudents: stats?.total_students || 0,
                avgRating: stats?.avg_rating || 0
            }
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch instructor profile" });
    }
});

export default router;