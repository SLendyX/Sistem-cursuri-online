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

BigInt.prototype.toJSON = function() {       
  return Number(this); // Or return this.toString() if the numbers are truly massive
}

// --- Multer Configuration ---
const uploadDir = path.join(__dirname, '../public/images');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only images are allowed'), false);
};

const upload = multer({ storage: storage, fileFilter: fileFilter });

// --- Token Verification ---
const verifyToken = (req) => {
    const token = req.cookies.auth_token;
    if (!token) return null;
    try {
        return jwt.verify(token, process.env.JWT_SECRET).userId;
    } catch (err) { return null; }
};

// --- PUBLIC ROUTES ---

// GET /api/courses - PUBLIC (only published courses + search support)
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
        switch(sortBy) {
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
router.get("/courses/:id", async (req, res) => {
    const courseId = req.params.id;
    try {
        const conn = await pool.getConnection();
        const [course] = await conn.query(
            "SELECT c.*, u.name FROM curs c JOIN user u ON c.autor_id = u.id WHERE c.curs_id = ?", 
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

// --- PROTECTED ROUTES (Require Auth) ---

// GET /api/my_courses - Professor's courses (published AND drafts)
router.get("/my_courses", async (req, res) => {
    const userId = verifyToken(req);
    if (!userId) return res.status(401).json({ error: "Not authenticated" });

    try {
        const conn = await pool.getConnection();
        const [user] = await conn.query("SELECT type FROM user WHERE id = ?", [userId]);

        if (user?.type !== 'professor') {
            conn.release();
            return res.status(403).json({ error: "Only professors can access this" });
        }

        const rows = await conn.query(
            "SELECT c.*, u.name FROM curs AS c JOIN user AS u ON c.autor_id = u.id WHERE c.autor_id = ? ORDER BY c.curs_id DESC",
            [userId]
        );
        conn.release();
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/courses - Create new course
router.post("/courses", upload.single('image'), async (req, res) => {
    const userId = verifyToken(req);
    if (!userId) return res.status(401).json({ error: "Not authenticated" });

    const { numeCurs, descriere, dificultate, pret, category } = req.body; // Adaugă category

    try {
        const conn = await pool.getConnection();
        const [user] = await conn.query("SELECT type FROM user WHERE id = ?", [userId]);

        if (user?.type !== 'professor') {
            conn.release();
            return res.status(403).json({ error: "Only professors can create courses" });
        }

        const finalImage = req.file ? `/images/${req.file.filename}` : '/images/default.jpg';

        await conn.query(
            `INSERT INTO curs (autor_id, nume_curs, descriere, dificultate, category, pret, thumbnail_url, rating, is_published) 
             VALUES (?, ?, ?, ?, ?, ?, ?, 0, 0)`,
            [userId, numeCurs, descriere, dificultate || 'usor', category || 'General', parseFloat(pret), finalImage]
        );

        conn.release();
        res.json({ message: "Course created!" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PATCH /api/courses/:id - Update course
router.patch("/courses/:id", upload.single('image'), async (req, res) => {
    const userId = verifyToken(req);
    if (!userId) return res.status(401).json({ error: "Not authenticated" });

    const courseId = req.params.id;
    const { numeCurs, descriere, dificultate, pret, isPublished, category } = req.body; // Adaugă category
    const newImage = req.file ? `/images/${req.file.filename}` : null;

    try {
        const conn = await pool.getConnection();

        const [course] = await conn.query("SELECT autor_id FROM curs WHERE curs_id = ?", [courseId]);
        if (!course || course.autor_id !== userId) {
            conn.release();
            return res.status(403).json({ error: "Not authorized" });
        }

        let sql = `UPDATE curs SET 
                   nume_curs = COALESCE(?, nume_curs),
                   descriere = COALESCE(?, descriere),
                   dificultate = COALESCE(?, dificultate),
                   category = COALESCE(?, category),
                   pret = COALESCE(?, pret),
                   is_published = COALESCE(?, is_published)`;
        
        const params = [numeCurs, descriere, dificultate, category, pret, isPublished];

        if (newImage) {
            sql += `, thumbnail_url = ?`;
            params.push(newImage);
        }

        sql += ` WHERE curs_id = ?`;
        params.push(courseId);

        await conn.query(sql, params);
        conn.release();

        res.json({ message: "Course updated successfully", newImage });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to update course" });
    }
}); 

// DELETE /api/courses/:id - Delete course (with cascade)
router.delete("/courses/:id", async (req, res) => {
    const userId = verifyToken(req);
    if (!userId) return res.status(401).json({ error: "Not authenticated" });

    const courseId = req.params.id;

    try {
        const conn = await pool.getConnection();

        // Verify ownership
        const [course] = await conn.query("SELECT autor_id FROM curs WHERE curs_id = ?", [courseId]);
        if (!course) {
            conn.release();
            return res.status(404).json({ error: "Course not found" });
        }
        if (course.autor_id !== userId) {
            conn.release();
            return res.status(403).json({ error: "Not authorized to delete this course" });
        }

        // Check for enrollments (optional - you can remove this check for hard delete)
        const enrollments = await conn.query("SELECT COUNT(*) as count FROM enrollment WHERE course_id = ?", [courseId]);
        if (enrollments[0].count > 0) {
            conn.release();
            return res.status(400).json({ 
                error: `Cannot delete course with ${enrollments[0].count} enrolled student(s)`,
                hasStudents: true 
            });
        }

        // Delete course (CASCADE will handle chapters, lessons, resources)
        await conn.query("DELETE FROM curs WHERE curs_id = ?", [courseId]);

        conn.release();
        res.json({ message: "Course deleted successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to delete course" });
    }
});

// --- CHAPTER & LESSON ROUTES (existing, keeping them) ---

router.get("/courses/:id/chapters", async (req, res) => {
    const courseId = req.params.id;

    try {
        const conn = await pool.getConnection();
        const rows = await conn.query(
            "SELECT * FROM chapter WHERE curs_id = ? ORDER BY position ASC",
            [courseId]
        );
        conn.release();

        const chapters = rows.map(row => ({ ...row, type: "chapter" }));
        res.json(chapters);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get("/chapters/:chapterId/lessons", async (req, res) => {
    const { chapterId } = req.params;

    try {
        const conn = await pool.getConnection();
        const rows = await conn.query(
            "SELECT * FROM lesson WHERE chapter_id = ? ORDER BY position ASC",
            [chapterId]
        );
        conn.release();

        const lessons = rows.map(row => ({ ...row, type: "lesson" }));
        res.json(lessons);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post("/chapters", async (req, res) => {
    const { courseId } = req.body;
    if (!courseId) return res.status(400).json({ error: "Missing courseId" });

    try {
        const conn = await pool.getConnection();
        const [lastChapter] = await conn.query(
            "SELECT MAX(position) as maxPos FROM chapter WHERE curs_id = ?",
            [courseId]
        );
        const nextPosition = (lastChapter?.maxPos || 0) + 1;

        const result = await conn.query(
            "INSERT INTO chapter (curs_id, title, position) VALUES (?, ?, ?)",
            [courseId, "New Chapter", nextPosition]
        );

        conn.release();
        res.json({ message: "Chapter created", id: Number(result.insertId), title: "New Chapter" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

router.post("/lessons", async (req, res) => {
    const { chapterId } = req.body;
    if (!chapterId) return res.status(400).json({ error: "Missing chapterId" });

    try {
        const conn = await pool.getConnection();
        const [lastLesson] = await conn.query(
            "SELECT MAX(position) as maxPos FROM lesson WHERE chapter_id = ?",
            [chapterId]
        );
        const nextPosition = (lastLesson?.maxPos || 0) + 1;

        const result = await conn.query(
            "INSERT INTO lesson (chapter_id, title, position) VALUES (?, ?, ?)",
            [chapterId, "New Lesson", nextPosition]
        );

        conn.release();
        res.json({ message: "Lesson created", id: Number(result.insertId), title: "New Lesson" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

router.delete("/chapters/:id", async (req, res) => {
    const chapterId = req.params.id;

    try {
        const conn = await pool.getConnection();
        const [chapterToDelete] = await conn.query(
            "SELECT curs_id, position FROM chapter WHERE id = ?",
            [chapterId]
        );

        if (!chapterToDelete) {
            conn.release();
            return res.status(404).json({ error: "Chapter not found" });
        }

        const { curs_id, position } = chapterToDelete;

        await conn.query("DELETE FROM chapter WHERE id = ?", [chapterId]);
        await conn.query(
            "UPDATE chapter SET position = position - 1 WHERE curs_id = ? AND position > ?",
            [curs_id, position]
        );

        conn.release();
        res.json({ message: "Chapter deleted and order normalized" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to delete chapter" });
    }
});

router.delete("/lessons/:id", async (req, res) => {
    const lessonId = req.params.id;

    try {
        const conn = await pool.getConnection();
        const [lessonToDelete] = await conn.query(
            "SELECT chapter_id, position FROM lesson WHERE id = ?",
            [lessonId]
        );

        if (!lessonToDelete) {
            conn.release();
            return res.status(404).json({ error: "Lesson not found" });
        }

        const { chapter_id, position } = lessonToDelete;

        await conn.query("DELETE FROM lesson WHERE id = ?", [lessonId]);
        await conn.query(
            "UPDATE lesson SET position = position - 1 WHERE chapter_id = ? AND position > ?",
            [chapter_id, position]
        );

        conn.release();
        res.json({ message: "Lesson deleted and order normalized" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to delete lesson" });
    }
});

router.put("/chapters/reorder", async (req, res) => {
    const { items } = req.body;

    try {
        const conn = await pool.getConnection();
        for (let index = 0; index < items.length; index++) {
            await conn.query(
                "UPDATE chapter SET position = ? WHERE id = ?",
                [index + 1, items[index].id]
            );
        }
        conn.release();
        res.json({ message: "Chapters reordered successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to reorder chapters" });
    }
});

router.put("/lessons/reorder", async (req, res) => {
    const { items } = req.body;

    try {
        const conn = await pool.getConnection();
        for (let index = 0; index < items.length; index++) {
            await conn.query(
                "UPDATE lesson SET position = ? WHERE id = ?",
                [index + 1, items[index].id]
            );
        }
        conn.release();
        res.json({ message: "Lessons reordered successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to reorder lessons" });
    }
});

router.get("/chapters/:id", async (req, res) => {
    const chapterId = req.params.id;

    try {
        const conn = await pool.getConnection();
        const [chapter] = await conn.query("SELECT * FROM chapter WHERE id = ?", [chapterId]);
        conn.release();

        if (!chapter) return res.status(404).json({ error: "Chapter not found" });
        res.json(chapter);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.patch("/chapters/:id", async (req, res) => {
    const chapterId = req.params.id;
    const { title, isPublished } = req.body;

    try {
        const conn = await pool.getConnection();
        await conn.query(
            `UPDATE chapter SET 
                title = COALESCE(?, title),
                is_published = COALESCE(?, is_published)
             WHERE id = ?`,
            [title, isPublished, chapterId]
        );
        conn.release();
        res.json({ message: "Chapter updated successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to update chapter" });
    }
});

router.get("/lessons/:id", async (req, res) => {
    const lessonId = req.params.id;

    try {
        const conn = await pool.getConnection();
        const [lesson] = await conn.query("SELECT * FROM lesson WHERE id = ?", [lessonId]);

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

router.patch("/lessons/:id", async (req, res) => {
    const lessonId = req.params.id;
    const { title, content, videoUrl, isPublished, links } = req.body;

    try {
        const conn = await pool.getConnection();

        await conn.query(
            `UPDATE lesson SET 
                title = COALESCE(?, title), 
                content = COALESCE(?, content), 
                video_url = COALESCE(?, video_url),
                is_published = COALESCE(?, is_published)
             WHERE id = ?`,
            [title, content, videoUrl, isPublished, lessonId]
        );

        if (Array.isArray(links)) {
            await conn.query("DELETE FROM lesson_resource WHERE lesson_id = ?", [lessonId]);

            if (links.length > 0) {
                const linkValues = links.map(link => [lessonId, link.label, link.url]);
                await conn.batch(
                    "INSERT INTO lesson_resource (lesson_id, label, url) VALUES (?, ?, ?)",
                    linkValues
                );
            }
        }

        conn.release();
        res.json({ message: "Lesson and resources updated successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to update lesson" });
    }
});

// GET /api/instructor/statistics - Professor statistics
router.get("/instructor/statistics", async (req, res) => {
    const userId = verifyToken(req);
    if (!userId) return res.status(401).json({ error: "Not authenticated" });

    try {
        const conn = await pool.getConnection();

        // Verify professor
        const [user] = await conn.query("SELECT type FROM user WHERE id = ?", [userId]);
        if (user?.type !== 'professor') {
            conn.release();
            return res.status(403).json({ error: "Only professors can view statistics" });
        }

        // Get all professor's courses
        const courses = await conn.query("SELECT curs_id, nume_curs, pret, studenti_inrolati FROM curs WHERE autor_id = ?", [userId]);

        // Calculate totals
        const totalStudents = courses.reduce((sum, c) => sum + (c.studenti_inrolati || 0), 0);
        const totalRevenue = await conn.query(
            "SELECT SUM(e.purchase_price) as revenue FROM enrollment e JOIN curs c ON e.course_id = c.curs_id WHERE c.autor_id = ?",
            [userId]
        );

        // Find most popular course
        const mostPopular = courses.reduce((max, course) => 
            course.studenti_inrolati > (max.studenti_inrolati || 0) ? course : max
        , {});

        conn.release();

        res.json({
            totalCourses: courses.length,
            totalStudents,
            totalRevenue: totalRevenue[0]?.revenue || 0,
            mostPopularCourse: mostPopular.nume_curs || "N/A",
            mostPopularCourseStudents: mostPopular.studenti_inrolati || 0,
            courses: courses.map(c => ({
                id: c.curs_id,
                name: c.nume_curs,
                students: c.studenti_inrolati || 0,
                price: c.pret
            }))
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch statistics" });
    }
});

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
            [avgRating.avg || 0, courseId]
        );

        conn.release();
        res.json({ message: "Review submitted successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to submit review" });
    }
});

export default router;