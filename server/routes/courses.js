import express from "express";
import pool from "../db/pool.js";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";

const router = express.Router();
router.use(express.json());
router.use(cookieParser());

// Funcție helper pentru a verifica token-ul
const verifyToken = (req) => {
    const token = req.cookies.auth_token;
    if (!token) return null;
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        return decoded.userId;
    } catch (err) {
        return null;
    }
};

router.get("/courses", async(req, res)=>{
    try{
        const conn = await pool.getConnection();
        const rows = await conn.query("SELECT * FROM curs");
        conn.release();
        // Trimitem doar numele coloanelor pentru formularul din frontend (daca asta era intentia originala)
        // Sau putem trimite datele cursurilor. Aici pastrez compatibilitatea cu ce aveai, 
        // dar ideal ar fi sa returnezi cursurile pentru pagina de Listing.
        res.json(rows); 
    }catch(err){
        res.status(500).json({error: err.message});
    }
})

// RUTA NOUĂ: Adăugare curs
router.post("/courses", async (req, res) => {
    const userId = verifyToken(req);
    
    if (!userId) {
        return res.status(401).json({ error: "Trebuie să fii autentificat pentru a crea un curs." });
    }

    const { numeCurs, descriere, dificultate, pret, thumbnailUrl } = req.body;

    // Validare simplă
    if (!numeCurs || !descriere || !dificultate || !pret) {
        return res.status(400).json({ error: "Toate câmpurile sunt obligatorii." });
    }

    try {
        const conn = await pool.getConnection();
        
        // Verificăm dacă userul e profesor (opțional, dar recomandat)
        const [user] = await conn.query("SELECT type FROM user WHERE id = ?", [userId]);
        if (user?.type !== 'professor') {
            conn.release();
            return res.status(403).json({ error: "Doar profesorii pot crea cursuri." });
        }

        const query = `
            INSERT INTO curs 
            (autor_id, nume_curs, descriere, dificultate, pret, thumbnail_url, rating, studenti_inrolati, nr_proiecte) 
            VALUES (?, ?, ?, ?, ?, ?, 0, 0, 0)
        `;

        // Folosim o imagine default dacă nu se oferă una
        const finalImage = thumbnailUrl || '/images/default.jpg';

        await conn.query(query, [
            userId, 
            numeCurs, 
            descriere, 
            dificultate, 
            parseFloat(pret), 
            finalImage
        ]);

        conn.release();
        res.status(201).json({ message: "Curs creat cu succes!" });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Eroare la salvarea cursului." });
    }
});

export default router;