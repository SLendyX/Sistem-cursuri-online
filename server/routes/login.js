import express from "express";
import pool from "../db/pool.js";
import argon2 from "argon2";
import jwt from "jsonwebtoken";
import rateLimit from "express-rate-limit";
import helmet from "helmet";

const router = express.Router();
const fakeHash = await argon2.hash("fakepassword");

// Security middleware
router.use(helmet());
router.use(express.json());

// Limit login attempts per IP
const loginLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5,              // 5 tries/minute
  message: { error: "Too many login attempts. Try again later." }
});

router.post("/", loginLimiter, async (req, res) => {
  const { username, password } = req.body;

  // Early validation
  if (!username || !password) {
    return res.status(400).json({ error: "Missing credentials" });
  }

  try {
    const conn = await pool.getConnection();

    // Prepared statement → no SQL injection
    const [rows] = await conn.query(
      "SELECT username, password FROM user WHERE username = ?",
      [username]
    );

    conn.release();

    const user = rows[0];
    if (!user) {
      // fake hash delay to avoid user enumeration
      await fakeDelay()
      return res.status(401).json({ error: "Invalid username or password" });
    }

    // Verify the password hash
    const valid = await argon2.verify(user.password, password);
    if (!valid) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    // Create JWT (short lifespan)
    const token = jwt.sign(
      { username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: "15m" }
    );

    return res.json({ token });

  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

async function fakeDelay(){
  argon2.verify(fakeHash, "fakepassword")
}


export default router;

