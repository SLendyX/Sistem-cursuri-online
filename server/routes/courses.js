import express from "express";
import pool from "../db/pool.js";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();
router.use(express.json());
router.use(cookieParser());

BigInt.prototype.toJSON = function () {
    return Number(this); // Or return this.toString() if the numbers are truly massive
}

// --- Token Verification ---
const verifyToken = (req) => {
    const token = req.cookies.auth_token;
    if (!token) return null;
    try {
        return jwt.verify(token, process.env.JWT_SECRET).userId;
    } catch (err) { return null; }
};

// --- Auth & Ownership Helpers ---
const requireErollement = async (req, res, next) => {
    const userId = verifyToken(req);
    if (!userId) return res.status(401).json({ error: "Not authenticated" });
    const lessonId = req.params.id;

    try {
        const conn = await pool.getConnection();

        const [enrollment] = await conn.query(
            `SELECT e.id FROM lesson as l
                join chapter as ch on ch.id = l.chapter_id
                join curs as c on c.curs_id = ch.curs_id
                join enrollment e on c.curs_id = e.course_id
                WHERE l.id = ? AND e.user_id = ?
            `,
            [lessonId, userId]
        );

        conn.release();

        console.log(enrollment)

        if(!enrollment){
            throw Error("Failed to check enrollment")
        }

        req.lessonId = lessonId
        next()
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to check enrollment" });
    }
};

// --- PUBLIC ROUTES ---

// GET /api/courses - PUBLIC (only published courses + search support)
//student only
router.get("/courses", async (req, res) => {
    const { search, sortBy, category } = req.query;

    try {
        const conn = await pool.getConnection();

        let query = `SELECT c.*, u.name FROM curs AS c 
                     JOIN user AS u ON c.autor_id = u.id 
                     WHERE c.is_published = 1`;
        const params = [];

        // Search filter
        if (search) {
            query += ` AND (c.nume_curs LIKE ? OR c.descriere LIKE ? OR u.name LIKE ? OR c.dificultate LIKE ?)`;
            params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
        }

        // Category filter
        if (category && category !== 'All') {
            query += ` AND c.category = ?`;
            params.push(category);
        }

        // Sorting
        switch (sortBy) {
            case 'price_asc':
                query += ` ORDER BY c.pret ASC`;
                break;
            case 'price_desc':
                query += ` ORDER BY c.pret DESC`;
                break;
            case 'popularity':
                query += ` ORDER BY c.studenti_inrolati DESC`;
                break;
            case 'rating':
                query += ` ORDER BY c.rating DESC`;
                break;
            case 'newest':
            default:
                query += ` ORDER BY c.curs_id DESC`;
                break;
        }

        const rows = await conn.query(query, params);
        conn.release();
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/courses/:id - PUBLIC (single course details)
//can be student or professor
//this will be modified for student only
router.get("/courses/:id", async (req, res) => {
    const courseId = req.params.id;
    try {
        const conn = await pool.getConnection();
        const [course] = await conn.query(
            "SELECT c.*, u.name FROM curs c JOIN user u ON c.autor_id = u.id WHERE c.curs_id = ? AND c.is_published = 1", //added is_published check
            [courseId]
        );
        conn.release();

        if (!course) return res.status(404).json({ error: "Course not found" });
        res.json(course);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/categories - Get all available categories
//student only
router.get("/categories", async (req, res) => {
    try {
        const conn = await pool.getConnection();
        const categories = await conn.query(
            `SELECT DISTINCT category, COUNT(*) as count 
             FROM curs 
             WHERE is_published = 1 
             GROUP BY category 
             ORDER BY category ASC`
        );
        conn.release();

        res.json(categories);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// --- CHAPTER & LESSON ROUTES (existing, keeping them) ---
//can be student or professor
//this will be modified for student only
router.get("/courses/:id/chapters", async (req, res) => {
    const courseId = req.params.id;

    try {
        const conn = await pool.getConnection();
        const rows = await conn.query(
            "SELECT * FROM chapter WHERE curs_id = ? AND is_published = 1 ORDER BY position ASC", //added is_published
            [courseId]
        );
        conn.release();

        const chapters = rows.map(row => ({ ...row, type: "chapter" }));
        res.json(chapters);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

//can be student or professor
//this will be modified for student only
router.get("/chapters/:chapterId/lessons", async (req, res) => {
    const { chapterId } = req.params;

    try {
        const conn = await pool.getConnection();
        const rows = await conn.query(
            "SELECT * FROM lesson WHERE chapter_id = ? AND is_published = 1 ORDER BY position ASC", //added is published
            [chapterId]
        );
        conn.release();

        const lessons = rows.map(row => ({ ...row, type: "lesson" }));
        res.json(lessons);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});



router.get("/chapters/:id", async (req, res) => {
    const chapterId = req.params.id;

    try {
        const conn = await pool.getConnection();
        const [chapter] = await conn.query("SELECT * FROM chapter WHERE id = ? AND is_published = 1", [chapterId]); //added is_published
        conn.release();

        if (!chapter) return res.status(404).json({ error: "Chapter not found" });
        res.json(chapter);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get("/lessons/:id", requireErollement, async (req, res) => {
    const lessonId = req.lessonId;

    try {
        const conn = await pool.getConnection();
        const [lesson] = await conn.query("SELECT * FROM lesson WHERE id = ? AND is_published = 1", [lessonId]); //added is_published

        if (!lesson) {
            conn.release();
            return res.status(404).json({ error: "Lesson not found" });
        }

        const resources = await conn.query("SELECT label, url FROM lesson_resource WHERE lesson_id = ?", [lessonId]);
        conn.release();

        res.json({ ...lesson, links: resources });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// -- Structure --

router.get("/courses/:id/structure", async (req, res) => {
    const courseId = req.params.id;
    
    try {
        const conn = await pool.getConnection();
        
        // Get course
        const [course] = await conn.query(
            "SELECT * FROM curs WHERE curs_id = ?", 
            [courseId]
        );
        
        if (!course) {
            conn.release();
            return res.status(404).json({ error: "Course not found" });
        }
        
        // Get ALL chapters AND lessons in one optimized query
        const structure = await conn.query(`
            SELECT
                ch.id as chapter_id,
                ch.title as chapter_title,
                ch.position as chapter_position,
                ch.is_published as chapter_published,
                l.id as lesson_id,
                l.title as lesson_title,
                l.position as lesson_position,
                l.is_published as lesson_published
            FROM chapter ch
            LEFT JOIN lesson l ON ch.id = l.chapter_id
            WHERE ch.curs_id = ? AND ch.is_published = 1 and l.is_published = 1
            ORDER BY ch.position ASC, l.position ASC
        `, [courseId]);
        
        // Transform flat result into nested structure
        const chaptersMap = new Map();
        
        structure.forEach(row => {
            if (!chaptersMap.has(row.chapter_id)) {
                chaptersMap.set(row.chapter_id, {
                    id: row.chapter_id,
                    title: row.chapter_title,
                    position: row.chapter_position,
                    is_published: row.chapter_published,
                    lessons: []
                });
            }
            
            // Add lesson if it exists (LEFT JOIN may have nulls)
            if (row.lesson_id) {
                chaptersMap.get(row.chapter_id).lessons.push({
                    id: row.lesson_id,
                    title: row.lesson_title,
                    position: row.lesson_position,
                    is_published: row.lesson_published
                });
            }
        });
        
        conn.release();
        
        res.json({
            course: { nume_curs: course.nume_curs },
            chapters: Array.from(chaptersMap.values())
        });
        
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to load course structure" });
    }
});


// -- Reviews --


//public
router.get("/courses/:id/reviews", async (req, res) => {
    const courseId = req.params.id;

    try {
        const conn = await pool.getConnection();

        const reviews = await conn.query(
            `SELECT r.*, u.name, u.username 
             FROM reviews r
             JOIN user u ON r.user_id = u.id
             WHERE r.course_id = ?
             ORDER BY r.created_at DESC`,
            [courseId]
        );

        // Calculate average rating
        const [avgRating] = await conn.query(
            "SELECT AVG(rating) as avg, COUNT(*) as count FROM reviews WHERE course_id = ?",
            [courseId]
        );

        conn.release();

        res.json({
            reviews,
            averageRating: avgRating?.avg || 0,
            totalReviews: avgRating?.count || 0
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch reviews" });
    }
});

// POST /api/courses/:id/reviews - Add a review
//public
router.post("/courses/:id/reviews", async (req, res) => {
    const userId = verifyToken(req);
    if (!userId) return res.status(401).json({ error: "Not authenticated" });

    const courseId = req.params.id;
    const { rating, comment } = req.body;

    if (!rating || rating < 1 || rating > 5) {
        return res.status(400).json({ error: "Rating must be between 1 and 5" });
    }

    try {
        const conn = await pool.getConnection();

        // Check enrollment and progress
        const [enrollment] = await conn.query(
            `SELECT progress_percentage FROM enrollment 
             WHERE user_id = ? AND course_id = ?`,
            [userId, courseId]
        );

        if (!enrollment) {
            conn.release();
            return res.status(403).json({ error: "You must be enrolled to leave a review" });
        }

        if (enrollment.progress_percentage < 20) {
            conn.release();
            return res.status(403).json({ error: "Complete at least 20% of the course to leave a review" });
        }

        // Check if review already exists
        const [existing] = await conn.query(
            "SELECT id FROM reviews WHERE user_id = ? AND course_id = ?",
            [userId, courseId]
        );

        if (existing) {
            // Update existing review
            await conn.query(
                "UPDATE reviews SET rating = ?, comment = ? WHERE id = ?",
                [rating, comment, existing.id]
            );
        } else {
            // Create new review
            await conn.query(
                "INSERT INTO reviews (course_id, user_id, rating, comment) VALUES (?, ?, ?, ?)",
                [courseId, userId, rating, comment]
            );
        }

        // Update course average rating
        const [avgRating] = await conn.query(
            "SELECT AVG(rating) as avg FROM reviews WHERE course_id = ?",
            [courseId]
        );

        await conn.query(
            "UPDATE curs SET rating = ? WHERE curs_id = ?",
            [Number(avgRating.avg || 0), courseId]  // ← ADD Number() HERE
        );

        conn.release();
        res.json({ message: "Review submitted successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to submit review" });
    }
});

export default router;