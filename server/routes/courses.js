import express from "express";
import pool from "../db/pool.js";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from 'url';

// Define __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();
router.use(express.json());
router.use(cookieParser());

// --- Configurare Multer (Stocare Locală) ---

// 1. Construct the absolute path to 'server/public/images'
// This ensures it works even if you start the node process from the project root
const uploadDir = path.join(__dirname, '../public/images');

// 2. Ensure the directory exists before Multer tries to save there
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Use the absolute path confirmed to exist
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
// -------------------------------------------

const verifyToken = (req) => {
    const token = req.cookies.auth_token;
    if (!token) return null;
    try {
        return jwt.verify(token, process.env.JWT_SECRET).userId;
    } catch (err) { return null; }
};

router.get("/courses", async (req, res) => {
    try {
        const conn = await pool.getConnection();
        const rows = await conn.query("SELECT c.*,u.name FROM curs AS c JOIN user AS u ON c.autor_id = u.id");
        conn.release();
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
})

router.get("/my_courses", async (req, res) => {
    const userId = verifyToken(req);
    if (!userId) return res.status(401).json({ error: "Not authenticated" });

    try {
        const conn = await pool.getConnection();
        const [user] = await conn.query("SELECT type FROM user WHERE id = ?", [userId]);

        if (user?.type !== 'professor') {
            conn.release();
            return res.status(403).json({ error: "Only professors can edit courses" });
        }

        const rows = await conn.query("SELECT c.*,u.name FROM curs AS c JOIN user AS u ON c.autor_id = u.id WHERE id = ?", [userId]);
        conn.release();
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
})

// Ruta POST modificată pentru upload
router.post("/courses", upload.single('image'), async (req, res) => {
    const userId = verifyToken(req);
    if (!userId) return res.status(401).json({ error: "Not authenticated" });

    const { numeCurs, descriere, dificultate, pret } = req.body;

    try {
        const conn = await pool.getConnection();
        const [user] = await conn.query("SELECT type FROM user WHERE id = ?", [userId]);

        if (user?.type !== 'professor') {
            conn.release();
            return res.status(403).json({ error: "Only professors can create courses" });
        }

        // Calea către imagine (sau default)
        const finalImage = req.file ? `/images/${req.file.filename}` : '/images/default.jpg';

        await conn.query(
            `INSERT INTO curs (autor_id, nume_curs, descriere, dificultate, pret, thumbnail_url, rating) 
             VALUES (?, ?, ?, ?, ?, ?, 0)`,
            [userId, numeCurs, descriere, dificultate || 'usor', parseFloat(pret), finalImage]
        );

        conn.release();
        res.json({ message: "Course created!" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


router.get("/courses/:id/chapters", async (req, res) => {
    const courseId = req.params.id;

    try {
        const conn = await pool.getConnection();
        // We order by 'position' so they show up in the correct order in your sidebar
        const rows = await conn.query(
            "SELECT * FROM chapter WHERE curs_id = ? ORDER BY position ASC",
            [courseId]
        );
        conn.release();


        const chapters = rows.map(row => {
            return { ...row, type: "chapter" }
        })

        res.json(chapters);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get("/chapters/:chapterId/lessons", async (req, res) => {
    const { chapterId } = req.params;

    try {
        const conn = await pool.getConnection();
        // We order by 'position' so they show up in the correct order in your sidebar
        const rows = await conn.query(
            "SELECT * FROM lesson WHERE chapter_id = ? ORDER BY position ASC",
            [chapterId]
        );
        conn.release();


        const lessons = rows.map(row => {
            return { ...row, type: "lesson" }
        })

        res.json(lessons);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post("/lessons", async (req, res) => {
    // FIX 1: Destructure from req.body, not req
    const { chapterId } = req.body;

    if (!chapterId) {
        return res.status(400).json({ error: "Missing chapterId" });
    }

    console.log("Received Request for Chapter ID:", chapterId);

    try {
        // FIX 2: Actually create the chapter in the DB
        // I am assuming your structure based on our previous conversation
        const conn = await pool.getConnection();

        // Find the next position
        const [lastChapter] = await conn.query(
            "SELECT MAX(position) as maxPos FROM lesson WHERE chapter_id = ?",
            [chapterId]
        );
        const nextPosition = (lastChapter?.maxPos || 0) + 1;

        const result = await conn.query(
            "INSERT INTO lesson (chapter_id, title, position) VALUES (?, ?, ?)",
            [chapterId, "New Lesson", nextPosition]
        );


        const newLessonId = Number(result.insertId); // Get the ID of the new row

        conn.release();

        // Send back the new ID so the frontend can use it
        res.json({ message: "Chapter created", id: newLessonId, title: "New Lesson" });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});


router.post("/chapters", async (req, res) => {
    // FIX 1: Destructure from req.body, not req
    const { courseId } = req.body;

    if (!courseId) {
        return res.status(400).json({ error: "Missing courseId" });
    }

    console.log("Received Request for Course ID:", courseId);

    try {
        // FIX 2: Actually create the chapter in the DB
        // I am assuming your structure based on our previous conversation
        const conn = await pool.getConnection();

        // Find the next position
        const [lastChapter] = await conn.query(
            "SELECT MAX(position) as maxPos FROM chapter WHERE curs_id = ?",
            [courseId]
        );
        const nextPosition = (lastChapter?.maxPos || 0) + 1;

        const result = await conn.query(
            "INSERT INTO chapter (curs_id, title, position) VALUES (?, ?, ?)",
            [courseId, "New Chapter", nextPosition]
        );


        const newChapterId = Number(result.insertId); // Get the ID of the new row

        conn.release();

        // Send back the new ID so the frontend can use it
        res.json({ message: "Chapter created", id: newChapterId, title: "New Chapter" });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/chapters/:id
router.delete("/chapters/:id", async (req, res) => {
    const chapterId = req.params.id;

    try {
        const conn = await pool.getConnection();

        // 1. Get the info of the chapter we are about to delete
        // We need its 'curs_id' (to know which course to fix) and 'position' (to know where to start shifting)
        const [chapterToDelete] = await conn.query(
            "SELECT curs_id, position FROM chapter WHERE id = ?",
            [chapterId]
        );

        if (!chapterToDelete) {
            conn.release();
            return res.status(404).json({ error: "Chapter not found" });
        }

        const { curs_id, position } = chapterToDelete;

        // 2. Delete the chapter
        await conn.query("DELETE FROM chapter WHERE id = ?", [chapterId]);

        // 3. The "Shift" Logic:
        // Find all chapters in THIS course that had a higher position than the deleted one
        // and subtract 1 from their position.
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

        // 1. Get the info of the lesson we are about to delete
        // We need its 'curs_id' (to know which course to fix) and 'position' (to know where to start shifting)
        const [lessonToDelete] = await conn.query(
            "SELECT chapter_id, position FROM lesson WHERE id = ?",
            [lessonId]
        );

        if (!lessonToDelete) {
            conn.release();
            return res.status(404).json({ error: "Lesson not found" });
        }

        const { chapter_id, position } = lessonToDelete;

        // 2. Delete the lesson
        await conn.query("DELETE FROM lesson WHERE id = ?", [lessonId]);

        // 3. The "Shift" Logic:
        // Find all lessons in THIS course that had a higher position than the deleted one
        // and subtract 1 from their position.
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

// PUT /api/chapters/reorder
router.put("/chapters/reorder", async (req, res) => {
    const { items } = req.body; // Expects array of objects: [{id: 1}, {id: 2}, ...]

    try {
        const conn = await pool.getConnection();

        // Loop through the items and update their position based on the array index
        for (let index = 0; index < items.length; index++) {
            const item = items[index];
            await conn.query(
                "UPDATE chapter SET position = ? WHERE id = ?",
                [index + 1, item.id]
            );
        }

        conn.release();
        res.json({ message: "Chapters reordered successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to reorder chapters" });
    }
});

// PUT /api/lessons/reorder
router.put("/lessons/reorder", async (req, res) => {
    const { items } = req.body;

    try {
        const conn = await pool.getConnection();

        for (let index = 0; index < items.length; index++) {
            const item = items[index];
            await conn.query(
                "UPDATE lesson SET position = ? WHERE id = ?",
                [index + 1, item.id]
            );
        }

        conn.release();
        res.json({ message: "Lessons reordered successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to reorder lessons" });
    }
});

// PATCH /api/lessons/:id
router.patch("/lessons/:id", async (req, res) => {
    const lessonId = req.params.id;
    // Get 'links' from the body along with other data
    const { title, content, videoUrl, isPublished, links } = req.body;

    try {
        const conn = await pool.getConnection();

        // 1. Update the main Lesson details
        await conn.query(
            `UPDATE lesson 
             SET 
                title = COALESCE(?, title), 
                content = COALESCE(?, content), 
                video_url = COALESCE(?, video_url),
                is_published = COALESCE(?, is_published)
             WHERE id = ?`,
            [title, content, videoUrl, isPublished, lessonId]
        );

        // 2. Handle Links (If 'links' array was sent)
        if (Array.isArray(links)) {
            // A. Wipe existing links for this lesson (easiest way to handle edits/deletes)
            await conn.query("DELETE FROM lesson_resource WHERE lesson_id = ?", [lessonId]);

            // B. Insert the new list (if not empty)
            if (links.length > 0) {
                // Create a bulk insert array: [[lessonId, label, url], [lessonId, label, url], ...]
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

// GET /api/lessons/:id
router.get("/lessons/:id", async (req, res) => {
    const lessonId = req.params.id;

    try {
        const conn = await pool.getConnection();

        // 1. Get Lesson Details
        const [lesson] = await conn.query("SELECT * FROM lesson WHERE id = ?", [lessonId]);

        if (!lesson) {
            conn.release();
            return res.status(404).json({ error: "Lesson not found" });
        }

        // 2. Get Resources (Links)
        const resources = await conn.query("SELECT label, url FROM lesson_resource WHERE lesson_id = ?", [lessonId]);

        conn.release();

        // 3. Combine and send
        res.json({ ...lesson, links: resources });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/chapters/:id
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

// PATCH /api/chapters/:id
router.patch("/chapters/:id", async (req, res) => {
    const chapterId = req.params.id;
    const { title, isPublished } = req.body;

    try {
        const conn = await pool.getConnection();

        await conn.query(
            `UPDATE chapter 
             SET 
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


router.get("/courses/:id", async (req, res) => {
    const courseId = req.params.id;
    try {
        const conn = await pool.getConnection();
        const [course] = await conn.query("SELECT * FROM curs WHERE curs_id = ?", [courseId]);
        conn.release();

        if (!course) return res.status(404).json({ error: "Course not found" });
        res.json(course);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PATCH /api/courses/:id (Supports Image Upload)
router.patch("/courses/:id", upload.single('image'), async (req, res) => {
    const courseId = req.params.id;
    const { numeCurs, descriere, dificultate, pret, isPublished } = req.body;
    
    // If a new file was uploaded, we use it. Otherwise, we ignore this field in SQL.
    const newImage = req.file ? `/images/${req.file.filename}` : null;

    try {
        const conn = await pool.getConnection();

        // Dynamic SQL construction to handle the optional image update
        let sql = `UPDATE curs SET 
                   nume_curs = COALESCE(?, nume_curs),
                   descriere = COALESCE(?, descriere),
                   dificultate = COALESCE(?, dificultate),
                   pret = COALESCE(?, pret),
                   is_published = COALESCE(?, is_published)`;
        
        const params = [numeCurs, descriere, dificultate, pret, isPublished];

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

export default router;