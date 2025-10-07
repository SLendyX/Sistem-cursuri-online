import mariadb from "mariadb";
import dotenv from "dotenv";
dotenv.config();

const pool = mariadb.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306
});

(async () => {
  try {
    const conn = await pool.getConnection();
    console.log("✅ Connected to MariaDB!");
    conn.release();
    process.exit(0);
  } catch (err) {
    console.error("❌ Connection failed:", err);
    process.exit(1);
  }
})();
