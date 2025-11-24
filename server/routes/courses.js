import express from "express";
import pool from "../db/pool.js";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import multer from "multer";
import path from "path";

const router = express.Router();
router.use(express.json());
router.use(cookieParser());

// --- Configurare Multer (Stocare Locală) ---
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/images/'); // Imaginile se salvează aici
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

router.get("/courses", async(req, res)=>{
    try{
        const conn = await pool.getConnection();
        const rows = await conn.query("SELECT * FROM curs");
        conn.release();
        res.json(rows);
    }catch(err){
        res.status(500).json({error: err.message});
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

export default router;