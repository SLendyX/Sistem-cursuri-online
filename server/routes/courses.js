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

const upload = multer({ 
    storage: storage, 
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
        files: 1
    }
});

// --- Token Verification ---
const verifyToken = (req) => {
    const token = req.cookies.auth_token;
    if (!token) return null;
    try {
        return jwt.verify(token, process.env.JWT_SECRET).userId;
    } catch (err) { return null; }
};

// --- Validate input ---
const validateCourseInput = (req, res, next) => {
    const { numeCurs, descriere, pret } = req.body;
    
    if (!numeCurs || numeCurs.length < 3 || numeCurs.length > 128) {
        return res.status(400).json({ 
            error: "Course title must be 3-128 characters" 
        });
    }
    
    if (!descriere || descriere.length < 10 || descriere.length > 400) {
        return res.status(400).json({ 
            error: "Description must be 10-400 characters" 
        });
    }
    
    const priceNum = parseFloat(pret);
    if (isNaN(priceNum) || priceNum < 0 || priceNum > 10000) {
        return res.status(400).json({ 
            error: "Price must be between 0 and 10000" 
        });
    }
    
    next();
};

// --- Auth & Ownership Helpers ---
const requireProfessor = async (req, res, next) => {
    const userId = verifyToken(req);
    if (!userId) return res.status(401).json({ error: "Not authenticated" });

    try {
        const conn = await pool.getConnection();
        const [user] = await conn.query("SELECT type FROM user WHERE id = ?", [userId]);
        conn.release();

        if (user?.type !== 'professor') {
            return res.status(403).json({ error: "Only professors can modify courses" });
        }

        req.userId = userId;
        next();
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Failed to verify permissions" });
    }
};

const ensureCourseOwner = async (conn, userId, courseId) => {
    const [course] = await conn.query("SELECT autor_id FROM curs WHERE curs_id = ?", [courseId]);
    if (!course) return { ok: false, status: 404, message: "Course not found" };
    if (course.autor_id !== userId) return { ok: false, status: 403, message: "Not authorized to modify this course" };
    return { ok: true, course };
};

const ensureChapterOwner = async (conn, userId, chapterId) => {
    const [chapter] = await conn.query(
        `SELECT ch.id, ch.curs_id, c.autor_id
         FROM chapter ch
         JOIN curs c ON ch.curs_id = c.curs_id
         WHERE ch.id = ?`,
        [chapterId]
    );

    if (!chapter) return { ok: false, status: 404, message: "Chapter not found" };
    if (chapter.autor_id !== userId) return { ok: false, status: 403, message: "Not authorized to modify this chapter" };
    return { ok: true, chapter };
};

const ensureLessonOwner = async (conn, userId, lessonId) => {
    const [lesson] = await conn.query(
        `SELECT l.id, l.chapter_id, ch.curs_id, c.autor_id
         FROM lesson l
         JOIN chapter ch ON l.chapter_id = ch.id
         JOIN curs c ON ch.curs_id = c.curs_id
         WHERE l.id = ?`,
        [lessonId]
    );

    if (!lesson) return { ok: false, status: 404, message: "Lesson not found" };
    if (lesson.autor_id !== userId) return { ok: false, status: 403, message: "Not authorized to modify this lesson" };
    return { ok: true, lesson };
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
router.post("/courses", requireProfessor, upload.single('image'),  validateCourseInput, async (req, res) => {
    const userId = req.userId;
    const { numeCurs, descriere, dificultate, pret, category } = req.body;

    try {
        const conn = await pool.getConnection();

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
router.patch("/courses/:id", requireProfessor, upload.single('image'), async (req, res) => {
    const userId = req.userId;
    const courseId = req.params.id;
    const { numeCurs, descriere, dificultate, pret, isPublished, category } = req.body;
    const newImage = req.file ? `/images/${req.file.filename}` : null;
    const clientVersion = Number(req.body.version);

    if (!Number.isInteger(clientVersion)) {
        return res.status(400).json({ error: "Missing or invalid version" });
    }

    try {
        const conn = await pool.getConnection();

        const ownership = await ensureCourseOwner(conn, userId, courseId);
        if (!ownership.ok) {
            conn.release();
            return res.status(ownership.status).json({ error: ownership.message });
        }

        let sql = `UPDATE curs SET 
                   nume_curs = COALESCE(?, nume_curs),
                   descriere = COALESCE(?, descriere),
                   dificultate = COALESCE(?, dificultate),
                   category = COALESCE(?, category),
                   pret = COALESCE(?, pret),
                   is_published = COALESCE(?, is_published),
                   version = version + 1`;

        const params = [numeCurs, descriere, dificultate, category, pret, isPublished];

        if (newImage) {
            sql += `, thumbnail_url = ?`;
            params.push(newImage);
        }

        sql += ` WHERE curs_id = ? AND version = ?`;
        params.push(courseId, clientVersion);

        const result = await conn.query(sql, params);
        if (result.affectedRows === 0) {
            const [current] = await conn.query("SELECT version FROM curs WHERE curs_id = ?", [courseId]);
            conn.release();
            return res.status(409).json({ error: "Version conflict", currentVersion: current?.version });
        }
        conn.release();

        res.json({ message: "Course updated successfully", newImage, version: clientVersion + 1 });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to update course" });
    }
});

// DELETE /api/courses/:id - Delete course (with cascade)
router.delete("/courses/:id", requireProfessor, async (req, res) => {
    const userId = req.userId;
    const courseId = req.params.id;

    try {
        const conn = await pool.getConnection();

        const ownership = await ensureCourseOwner(conn, userId, courseId);
        if (!ownership.ok) {
            conn.release();
            return res.status(ownership.status).json({ error: ownership.message });
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

router.post("/chapters", requireProfessor, async (req, res) => {
    const userId = req.userId;
    const { courseId } = req.body;
    if (!courseId) return res.status(400).json({ error: "Missing courseId" });

    try {
        const conn = await pool.getConnection();

        const ownership = await ensureCourseOwner(conn, userId, courseId);
        if (!ownership.ok) {
            conn.release();
            return res.status(ownership.status).json({ error: ownership.message });
        }

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

router.post("/lessons", requireProfessor, async (req, res) => {
    const userId = req.userId;
    const { chapterId } = req.body;
    if (!chapterId) return res.status(400).json({ error: "Missing chapterId" });

    try {
        const conn = await pool.getConnection();

        const ownership = await ensureChapterOwner(conn, userId, chapterId);
        if (!ownership.ok) {
            conn.release();
            return res.status(ownership.status).json({ error: ownership.message });
        }

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

router.delete("/chapters/:id", requireProfessor, async (req, res) => {
    const userId = req.userId;
    const chapterId = req.params.id;

    try {
        const conn = await pool.getConnection();
        const ownership = await ensureChapterOwner(conn, userId, chapterId);

        if (!ownership.ok) {
            conn.release();
            return res.status(ownership.status).json({ error: ownership.message });
        }

        const { curs_id, position } = ownership.chapter;

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

router.delete("/lessons/:id", requireProfessor, async (req, res) => {
    const userId = req.userId;
    const lessonId = req.params.id;

    try {
        const conn = await pool.getConnection();
        const ownership = await ensureLessonOwner(conn, userId, lessonId);

        if (!ownership.ok) {
            conn.release();
            return res.status(ownership.status).json({ error: ownership.message });
        }

        const { chapter_id, position } = ownership.lesson;

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

router.put("/chapters/reorder", requireProfessor, async (req, res) => {
    const userId = req.userId;
    const { items } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: "Missing chapter items" });
    }

    try {
        const conn = await pool.getConnection();
        const ids = items.map(item => item.id);
        const placeholders = ids.map(() => '?').join(',');

        const chapters = await conn.query(
            `SELECT ch.id, c.autor_id
             FROM chapter ch
             JOIN curs c ON ch.curs_id = c.curs_id
             WHERE ch.id IN (${placeholders})`,
            ids
        );

        if (chapters.length !== ids.length) {
            conn.release();
            return res.status(404).json({ error: "One or more chapters not found" });
        }

        const unauthorized = chapters.some(ch => ch.autor_id !== userId);
        if (unauthorized) {
            conn.release();
            return res.status(403).json({ error: "Not authorized to reorder these chapters" });
        }

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

router.put("/lessons/reorder", requireProfessor, async (req, res) => {
    const userId = req.userId;
    const { items } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: "Missing lesson items" });
    }

    try {
        const conn = await pool.getConnection();
        const ids = items.map(item => item.id);
        const placeholders = ids.map(() => '?').join(',');

        const lessons = await conn.query(
            `SELECT l.id, c.autor_id
             FROM lesson l
             JOIN chapter ch ON l.chapter_id = ch.id
             JOIN curs c ON ch.curs_id = c.curs_id
             WHERE l.id IN (${placeholders})`,
            ids
        );

        if (lessons.length !== ids.length) {
            conn.release();
            return res.status(404).json({ error: "One or more lessons not found" });
        }

        const unauthorized = lessons.some(lesson => lesson.autor_id !== userId);
        if (unauthorized) {
            conn.release();
            return res.status(403).json({ error: "Not authorized to reorder these lessons" });
        }

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
            WHERE ch.curs_id = ?
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
            course,
            chapters: Array.from(chaptersMap.values())
        });
        
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to load course structure" });
    }
});


router.patch("/chapters/:id", requireProfessor, async (req, res) => {
    const userId = req.userId;
    const chapterId = req.params.id;
    const { title, isPublished, version } = req.body;
    const clientVersion = Number(version);

    if (!Number.isInteger(clientVersion)) {
        return res.status(400).json({ error: "Missing or invalid version" });
    }

    try {
        const conn = await pool.getConnection();

        const ownership = await ensureChapterOwner(conn, userId, chapterId);
        if (!ownership.ok) {
            conn.release();
            return res.status(ownership.status).json({ error: ownership.message });
        }

        const result = await conn.query(
            `UPDATE chapter SET 
                title = COALESCE(?, title),
                is_published = COALESCE(?, is_published),
                version = version + 1
             WHERE id = ? AND version = ?`,
            [title, isPublished, chapterId, clientVersion]
        );

        if (result.affectedRows === 0) {
            const [current] = await conn.query("SELECT version FROM chapter WHERE id = ?", [chapterId]);
            conn.release();
            return res.status(409).json({ error: "Version conflict", currentVersion: current?.version });
        }
        conn.release();
        res.json({ message: "Chapter updated successfully", version: clientVersion + 1 });
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

router.patch("/lessons/:id", requireProfessor, async (req, res) => {
    const userId = req.userId;
    const lessonId = req.params.id;
    const { title, content, videoUrl, isPublished, links, version } = req.body;
    const clientVersion = Number(version);

    if (!Number.isInteger(clientVersion)) {
        return res.status(400).json({ error: "Missing or invalid version" });
    }

    try {
        const conn = await pool.getConnection();

        const ownership = await ensureLessonOwner(conn, userId, lessonId);
        if (!ownership.ok) {
            conn.release();
            return res.status(ownership.status).json({ error: ownership.message });
        }

        const result = await conn.query(
            `UPDATE lesson SET 
                title = COALESCE(?, title), 
                content = COALESCE(?, content), 
                video_url = COALESCE(?, video_url),
                is_published = COALESCE(?, is_published),
                version = version + 1
             WHERE id = ? AND version = ?`,
            [title, content, videoUrl, isPublished, lessonId, clientVersion]
        );

        if (result.affectedRows === 0) {
            const [current] = await conn.query("SELECT version FROM lesson WHERE id = ?", [lessonId]);
            conn.release();
            return res.status(409).json({ error: "Version conflict", currentVersion: current?.version });
        }

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
        res.json({ message: "Lesson and resources updated successfully", version: clientVersion + 1 });
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