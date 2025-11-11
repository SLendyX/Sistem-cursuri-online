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
      "SELECT id, username, password, email_verified FROM user WHERE username = ? OR email = ?",
      [username, username]
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

  if (!user.email_verified)
    return res.status(403).json({ error: "Please verify your email first." });


  res.cookie("auth_token", token, COOKIE_OPTIONS);
  res.json({ message: "Logged in" });
});

// ME
router.get("/profile", async (req, res) => {
  const token = req.cookies.auth_token;
  if (!token) return res.status(401).json({ error: "Not logged in" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    let rows;

    try{
      const conn = await pool.getConnection();

      [rows] = await conn.query(
        `Select username, email, name, type, email_verified from user where id = ?`,
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

    const token = jwt.sign(
      { userId: userId.id },
      process.env.EMAIL_TOKEN_SECRET,
      { expiresIn: "15m" }
    );

    conn.release();

    const verificationLink = `http://localhost:5000/api/auth/verify-email?token=${token}`;

    console.log("=== EMAIL VERIFICATION LINK ===");
    console.log(verificationLink);
    console.log("================================");

    res.json({ message: "User registered. Check server logs for the verification link." });
  }catch(err){
    console.error("Login error:", err);

    let errMsg

    switch(err.code){
      case "ER_DUP_ENTRY":
        errMsg = "Username or email already exists please pick another"
        break;
      default:
        errMsg:""
        break;
    }

    res.status(500).json({ error: errMsg });
  }
})

router.get("/auth/verify-email", async (req, res) => {
  const { token } = req.query;
  try {
    const decoded = jwt.verify(token, process.env.EMAIL_TOKEN_SECRET);
    const conn = await pool.getConnection();

    // console.log(`userID: ${JSON.stringify(decoded.userId)}\ndecoded: ${JSON.stringify(decoded)}`)


    await conn.query("UPDATE user SET email_verified = ? WHERE id = ?", [true, decoded.userId]);
    conn.release();

    

    console.log("Verification successful")
    res.json("Verifcation successful")
  } catch (err) {
    // console.error(err);
    // console.error("Verification failed")

    res.status(500).json({ error: "Verification failed" });
  }
})


export default router;
