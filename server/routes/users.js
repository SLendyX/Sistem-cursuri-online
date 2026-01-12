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

    let conn; // 1. Define outside so 'catch' and 'finally' can access it

    try {
        conn = await pool.getConnection();

        // 2. Start Transaction (Crucial for atomic deletes)
        await conn.beginTransaction();

        // --- CHECK: IS PROFESSOR? ---
        // Destructure [rows] because query returns [rows, fields]
        const [users] = await conn.query("SELECT type FROM user WHERE id = ?", [userId]);
        const user = users[0]; // Get the first row

        if (user?.type === 'professor') {
            const [courses] = await conn.query(
                "SELECT curs_id FROM curs WHERE autor_id = ?",
                [userId]
            );

            for (const course of courses) {
                const [rows] = await conn.query(
                    "SELECT COUNT(*) as count FROM enrollment WHERE course_id = ?",
                    [course.curs_id]
                );

                // rows[0].count checks the count
                if (rows[0].count > 0) {
                    await conn.rollback(); // Cancel transaction before returning
                    // Connection released in 'finally' block
                    return res.status(400).json({
                        error: "Cannot delete account. You have courses with enrolled students."
                    });
                }
            }
        }

        // --- GET ENROLLMENTS BEFORE DELETE ---
        const enrollments = await conn.query(
            `SELECT e.course_id FROM enrollment AS e WHERE e.user_id = ?`,
            [userId]
        );

        // --- DELETE USER ---
        await conn.query("DELETE FROM user WHERE id = ?", [userId]);

        // --- UPDATE COURSE RATINGS ---
        // Fix: Added 'const', fixed destructuring, fixed variable naming
        for (const { course_id } of enrollments) {
            const rows = await conn.query(
                "SELECT AVG(rating) as avg FROM reviews WHERE course_id = ?",
                [course_id] // Use the snake_case variable from destructuring
            );

            const avgRating = rows[0]?.avg;

            await conn.query(
                `UPDATE curs 
                SET rating = ?, studenti_inrolati = GREATEST(0, studenti_inrolati - 1) 
                WHERE curs_id = ?`,
                [Number(avgRating || 0), course_id]
            );


        }

        // 3. Commit changes
        await conn.commit();
        res.json({ message: "Account deleted successfully" });

    } catch (err) {
        console.error(err);
        // 4. Rollback changes if ANY error occurs
        if (conn) await conn.rollback();
        res.status(500).json({ error: "Failed to delete account" });

    } finally {
        // 5. Always release connection (prevents server hanging)
        if (conn) conn.release();
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
                AVG(NULLIF(c.rating, 0)) as avg_rating
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