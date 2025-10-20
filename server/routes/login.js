import express from "express";
import pool from "../db/pool.js";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import argon2 from "argon2";

const app = express();
app.use(express.json());
app.use(cookieParser());

const fakeHash = await argon2.hash("placeholder-password");

async function fakeDelay() {
  await argon2.verify(fakeHash, "placeholder-password");
}

async function findUserByUsername(username){
try {
    const conn = await pool.getConnection();

    // Prepared statement → no SQL injection
    const rows = await conn.query(
      "SELECT username, password FROM user WHERE username = ?",
      [username]
    );

    conn.release();

    return rows[0];

  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}

// optional: detect prod mode
const isProd = process.env.NODE_ENV === "production";

const COOKIE_OPTIONS = {
  httpOnly: true,              // prevent JS access (XSS)
  secure: isProd,              // only send over HTTPS in production
  sameSite: isProd ? "strict" : "lax", // safe default for dev vs prod
  maxAge: 7 * 24 * 60 * 60 * 1000,     // 7 days
  path: "/",                   // send cookie on all routes
};

app.post("/api/login", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: "Missing credentials" });
  }

  const user = await findUserByUsername(username);
  if (!user || !(await argon2.verify(user.password, password))) {
    // prevent timing attacks
    await fakeDelay();
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const token = jwt.sign(
    { userId: user.id },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

  res.cookie("auth_token", token, COOKIE_OPTIONS);
  res.json({ message: "Logged in" });
});

app.get("/api/me", (req, res) => {
  const token = req.cookies.auth_token;
  console.log(token)
  if (!token) return res.status(401).json({ error: "Not logged in" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    res.json({ userId: decoded.userId });
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
});

app.post("/api/logout", (req, res) => {
  res.clearCookie("auth_token", { ...COOKIE_OPTIONS, maxAge: 0 });
  res.json({ message: "Logged out" });
});

app.listen(5000, () =>
  console.log(`Server running on port 5000 (${isProd ? "production" : "dev"})`)
);

export default app;