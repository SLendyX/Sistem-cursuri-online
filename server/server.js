// server/server.js - asigură-te că toate rutele sunt incluse:
//library imports
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

//route imports
import usersRouter from "./routes/users.js";
import loginRouter from "./routes/login.js";
import coursesRouter from "./routes/courses.js";
import progressRouter from "./routes/progress.js";
import authorRouter from "./routes/author.js"
import path from "path";

dotenv.config();

const app = express();

// 1. ✅ Security Headers
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
            scriptSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
        }
    }
}));

// 2. ✅ CORS - Restrict to your domain in production
const corsOptions = {
    origin: process.env.NODE_ENV === 'production'
        ? 'https://yourdomain.com'
        : 'http://localhost:5173',
    credentials: true,
    optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// 3. ✅ Rate Limiting - Prevent brute force
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 requests per window
    message: { error: "Too many login attempts, please try again later." }
});

const generalLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    limit: 100, // Limit each IP to 100 requests per `window`
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    message: "Too many requests from this IP, please try again in a minute."
});

const authorLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    limit: 300, // High ceiling for autosave
    standardHeaders: true,
    legacyHeaders: false,
    message: "Autosave limit reached. Please pause editing for a moment."
});

// Apply to sensitive routes
app.use("/api/login", authLimiter);
app.use("/api/register", authLimiter);
app.use("/api/author", authorLimiter)
app.use("/api", generalLimiter); // All other API routes

app.use(express.json({ limit: '10mb' })); // ✅ Limit JSON body size

app.use(express.static('public'));

app.use("/api/users", usersRouter); // sau app.use("/api", usersRouter);
app.use("/api", loginRouter);
app.use("/api", coursesRouter);
app.use("/api", progressRouter);
app.use("/api/author", authorRouter);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));