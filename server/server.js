import express from "express";
import cors from "cors";
import mariadb from "mariadb";
import dotenv from "dotenv";

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

// create MariaDB connection pool
const pool = mariadb.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3307,
  connectionLimit: 10

});

app.get("/api/users", async (req, res) => {
  try {
    const conn = await pool.getConnection();
    const rows = await conn.query("SELECT * FROM user LIMIT 1");
    res.json(rows);
    conn.release();
  } catch (err) {
    res.status(500).json({ error: err.message });
  } 
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
