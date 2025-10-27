import express from "express";
import pool from "../db/pool.js";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import argon2 from "argon2";

const router = express.Router();
router.use(express.json());
router.use(cookieParser());

const fakeHash = await argon2.hash("placeholder-password");

async function fakeDelay() {
  await argon2.verify(fakeHash, "placeholder-password");
}

async function findUserByUsername(username) {
  try {
    const conn = await pool.getConnection();
    const rows = await conn.query(
      "SELECT id, username, password FROM user WHERE username = ?",
      [username]
    );
    conn.release();
    return rows[0];
  } catch (err) {
    console.error("Login error:", err);
    throw err;
  }
}

const isProd = process.env.NODE_ENV === "production";

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: isProd,
  sameSite: isProd ? "strict" : "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: "/",
};

// LOGIN
router.post("/login", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ error: "Missing credentials" });

  const user = await findUserByUsername(username);
  if (!user || !(await argon2.verify(user.password, password))) {
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

// ME
router.get("/me", async (req, res) => {
  const token = req.cookies.auth_token;
  if (!token) return res.status(401).json({ error: "Not logged in" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    let rows;

    try{
      const conn = await pool.getConnection();

      [rows] = await conn.query(
        `Select username, email, name, type from user where id = ?`,
        [decoded.userId]
      );
      conn.release();

    }catch(err){
      console.error("Login error:", err);
      throw err;
    }

    res.json({ userId: decoded.userId, ...rows, isLogged:true });
  } catch {
    res.status(401).json({ error: "Invalid token", isLogged:false });
  }
});

// LOGOUT
router.post("/logout", (req, res) => {
  res.clearCookie("auth_token", { ...COOKIE_OPTIONS, maxAge: 0 });
  res.json({ message: "Logged out" });
});


router.post("/register", async (req, res) => {
  const { username, email, password, type, name} = req.body
  const passwordHash = await argon2.hash(password)
  const valuesArray =[ username, email, passwordHash, type, name]
  const placeholders = valuesArray.map(() => '?').join(',');
  let userId

  try{
    const conn = await pool.getConnection();

    await conn.query(
      `INSERT INTO user (username, email, password, type, name) VALUES (${placeholders})`,
      valuesArray
    );

    [userId] = await conn.query(
      `Select id from user where username = ?`,
      [username]
    );

    conn.release();

  }catch(err){
    console.error("Login error:", err);
    throw err;
  }

  const token = jwt.sign(
    { userId:userId.id },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

  res.cookie("auth_token", token, COOKIE_OPTIONS);
  res.json({ message: "Account succesfully created" });

})


export default router;
