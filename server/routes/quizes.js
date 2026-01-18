// server/routes/quizzes.js
import express from "express";
import pool from "../db/pool.js";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";

const router = express.Router();
router.use(express.json());
router.use(cookieParser());

const verifyToken = (req) => {
    const token = req.cookies.auth_token;
    if (!token) return null;
    try {
        return jwt.verify(token, process.env.JWT_SECRET).userId;
    } catch (err) {
        return null;
    }
};

// ====== STUDENT ROUTES ======

// GET /api/quizzes/lesson/:lessonId - Get quiz for a lesson
router.get("/lesson/:lessonId", async (req, res) => {
    const userId = verifyToken(req);
    if (!userId) return res.status(401).json({ error: "Not authenticated" });

    const { lessonId } = req.params;

    try {
        const conn = await pool.getConnection();

        // Check enrollment
        const [enrollment] = await conn.query(
            `SELECT e.id FROM lesson AS l
             JOIN chapter AS ch ON ch.id = l.chapter_id
             JOIN curs AS c ON c.curs_id = ch.curs_id
             JOIN enrollment e ON c.curs_id = e.course_id
             WHERE l.id = ? AND e.user_id = ?`,
            [lessonId, userId]
        );

        if (!enrollment) {
            conn.release();
            return res.status(403).json({ error: "Not enrolled in this course" });
        }

        // Get quiz
        const [quiz] = await conn.query(
            "SELECT * FROM quiz WHERE lesson_id = ? AND is_published = 1",
            [lessonId]
        );

        if (!quiz) {
            conn.release();
            return res.json({ hasQuiz: false });
        }

        // Get questions
        const questions = await conn.query(
            "SELECT id, question_text, question_type, points, position FROM quiz_question WHERE quiz_id = ? ORDER BY position",
            [quiz.id]
        );

        // Get options for all questions
        const questionIds = questions.map(q => q.id);
        const options = await conn.query(
            `SELECT id, question_id, option_text, position 
             FROM quiz_option 
             WHERE question_id IN (${questionIds.map(() => '?').join(',')})
             ORDER BY question_id, position`,
            questionIds
        );

        // Get user's attempts
        const attempts = await conn.query(
            "SELECT id, started_at, completed_at, score, passed FROM quiz_attempt WHERE user_id = ? AND quiz_id = ? ORDER BY started_at DESC",
            [userId, quiz.id]
        );

        conn.release();

        // Group options by question
        const questionsWithOptions = questions.map(q => ({
            ...q,
            options: options.filter(o => o.question_id === q.id)
        }));

        res.json({
            hasQuiz: true,
            quiz: {
                id: quiz.id,
                title: quiz.title,
                description: quiz.description,
                timeLimit: quiz.time_limit,
                passingScore: quiz.passing_score,
                maxAttempts: quiz.max_attempts,
                questions: questionsWithOptions
            },
            attempts: attempts.map(a => ({
                ...a,
                canRetake: quiz.max_attempts === null || attempts.length < quiz.max_attempts
            }))
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to load quiz" });
    }
});

// POST /api/quizzes/:quizId/submit - Submit quiz answers
router.post("/:quizId/submit", async (req, res) => {
    const userId = verifyToken(req);
    if (!userId) return res.status(401).json({ error: "Not authenticated" });

    const { quizId } = req.params;
    const { answers, startedAt } = req.body; // answers: { questionId: [optionIds] }

    try {
        const conn = await pool.getConnection();

        // Get quiz details
        const [quiz] = await conn.query(
            "SELECT * FROM quiz WHERE id = ?",
            [quizId]
        );

        if (!quiz) {
            conn.release();
            return res.status(404).json({ error: "Quiz not found" });
        }

        // Get correct answers
        const correctAnswers = await conn.query(
            `SELECT qo.question_id, qo.id as option_id
             FROM quiz_option qo
             JOIN quiz_question qq ON qo.question_id = qq.id
             WHERE qq.quiz_id = ? AND qo.is_correct = 1`,
            [quizId]
        );

        // Group by question
        const correctByQuestion = correctAnswers.reduce((acc, row) => {
            if (!acc[row.question_id]) acc[row.question_id] = [];
            acc[row.question_id].push(row.option_id);
            return acc;
        }, {});

        // Calculate score
        const questions = await conn.query(
            "SELECT id, points, question_type FROM quiz_question WHERE quiz_id = ?",
            [quizId]
        );

        let totalPoints = 0;
        let earnedPoints = 0;

        const results = questions.map(q => {
            totalPoints += q.points;
            
            const userAnswer = answers[q.id] || [];
            const correctIds = correctByQuestion[q.id] || [];
            
            const userSet = new Set(Array.isArray(userAnswer) ? userAnswer : [userAnswer]);
            const correctSet = new Set(correctIds);
            
            const isCorrect = userSet.size === correctSet.size && 
                              [...userSet].every(id => correctSet.has(id));
            
            if (isCorrect) earnedPoints += q.points;
            
            return {
                questionId: q.id,
                userAnswer,
                correctAnswer: correctIds,
                isCorrect
            };
        });

        const scorePercentage = totalPoints > 0 ? (earnedPoints / totalPoints) * 100 : 0;
        const passed = scorePercentage >= quiz.passing_score;

        // Save attempt
        await conn.query(
            `INSERT INTO quiz_attempt 
             (user_id, quiz_id, started_at, completed_at, score, passed, answers)
             VALUES (?, ?, ?, NOW(), ?, ?, ?)`,
            [userId, quizId, startedAt, scorePercentage, passed ? 1 : 0, JSON.stringify(answers)]
        );

        conn.release();

        res.json({
            score: scorePercentage,
            passed,
            results,
            passingScore: quiz.passing_score
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to submit quiz" });
    }
});

// ====== INSTRUCTOR ROUTES ======

// POST /api/author/quizzes - Create quiz for lesson
router.post("/author/quizzes", async (req, res) => {
    const userId = verifyToken(req);
    if (!userId) return res.status(401).json({ error: "Not authenticated" });

    const { lessonId, title, description, timeLimit, passingScore } = req.body;

    try {
        const conn = await pool.getConnection();

        // Verify ownership
        const [lesson] = await conn.query(
            `SELECT l.id, c.autor_id
             FROM lesson l
             JOIN chapter ch ON l.chapter_id = ch.id
             JOIN curs c ON ch.curs_id = c.curs_id
             WHERE l.id = ?`,
            [lessonId]
        );

        if (!lesson || lesson.autor_id !== userId) {
            conn.release();
            return res.status(403).json({ error: "Not authorized" });
        }

        const result = await conn.query(
            `INSERT INTO quiz (lesson_id, title, description, time_limit, passing_score)
             VALUES (?, ?, ?, ?, ?)`,
            [lessonId, title || "New Quiz", description || "", timeLimit, passingScore || 70]
        );

        conn.release();
        res.json({ message: "Quiz created", quizId: Number(result.insertId) });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to create quiz" });
    }
});

// GET /api/author/quizzes/:quizId - Get quiz with all details (for editing)
router.get("/author/quizzes/:quizId", async (req, res) => {
    const userId = verifyToken(req);
    if (!userId) return res.status(401).json({ error: "Not authenticated" });

    const { quizId } = req.params;

    try {
        const conn = await pool.getConnection();

        // Get quiz with ownership check
        const [quiz] = await conn.query(
            `SELECT q.*, c.autor_id
             FROM quiz q
             JOIN lesson l ON q.lesson_id = l.id
             JOIN chapter ch ON l.chapter_id = ch.id
             JOIN curs c ON ch.curs_id = c.curs_id
             WHERE q.id = ?`,
            [quizId]
        );

        if (!quiz || quiz.autor_id !== userId) {
            conn.release();
            return res.status(403).json({ error: "Not authorized" });
        }

        // Get questions with options
        const questions = await conn.query(
            "SELECT * FROM quiz_question WHERE quiz_id = ? ORDER BY position",
            [quizId]
        );

        const questionIds = questions.map(q => q.id);
        let options = [];
        
        if (questionIds.length > 0) {
            options = await conn.query(
                `SELECT * FROM quiz_option 
                 WHERE question_id IN (${questionIds.map(() => '?').join(',')})
                 ORDER BY question_id, position`,
                questionIds
            );
        }

        conn.release();

        const questionsWithOptions = questions.map(q => ({
            ...q,
            options: options.filter(o => o.question_id === q.id)
        }));

        res.json({ ...quiz, questions: questionsWithOptions });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to load quiz" });
    }
});

// PATCH /api/author/quizzes/:quizId - Update quiz settings
router.patch("/author/quizzes/:quizId", async (req, res) => {
    const userId = verifyToken(req);
    if (!userId) return res.status(401).json({ error: "Not authenticated" });

    const { quizId } = req.params;
    const { title, description, timeLimit, passingScore, maxAttempts, isPublished, version } = req.body;

    try {
        const conn = await pool.getConnection();

        // Verify ownership
        const [quiz] = await conn.query(
            `SELECT q.*, c.autor_id
             FROM quiz q
             JOIN lesson l ON q.lesson_id = l.id
             JOIN chapter ch ON l.chapter_id = ch.id
             JOIN curs c ON ch.curs_id = c.curs_id
             WHERE q.id = ?`,
            [quizId]
        );

        if (!quiz || quiz.autor_id !== userId) {
            conn.release();
            return res.status(403).json({ error: "Not authorized" });
        }

        const result = await conn.query(
            `UPDATE quiz SET
             title = COALESCE(?, title),
             description = COALESCE(?, description),
             time_limit = ?,
             passing_score = COALESCE(?, passing_score),
             max_attempts = ?,
             is_published = COALESCE(?, is_published),
             version = version + 1
             WHERE id = ? AND version = ?`,
            [title, description, timeLimit, passingScore, maxAttempts, isPublished, quizId, version]
        );

        if (result.affectedRows === 0) {
            conn.release();
            return res.status(409).json({ error: "Version conflict" });
        }

        conn.release();
        res.json({ message: "Quiz updated", version: version + 1 });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to update quiz" });
    }
});

// POST /api/author/quizzes/:quizId/questions - Add question
router.post("/author/quizzes/:quizId/questions", async (req, res) => {
    const userId = verifyToken(req);
    if (!userId) return res.status(401).json({ error: "Not authenticated" });

    const { quizId } = req.params;
    const { questionText, questionType, points, options } = req.body;

    try {
        const conn = await pool.getConnection();

        // Verify ownership
        const [quiz] = await conn.query(
            `SELECT q.*, c.autor_id
             FROM quiz q
             JOIN lesson l ON q.lesson_id = l.id
             JOIN chapter ch ON l.chapter_id = ch.id
             JOIN curs c ON ch.curs_id = c.curs_id
             WHERE q.id = ?`,
            [quizId]
        );

        if (!quiz || quiz.autor_id !== userId) {
            conn.release();
            return res.status(403).json({ error: "Not authorized" });
        }

        // Get next position
        const [lastQ] = await conn.query(
            "SELECT MAX(position) as maxPos FROM quiz_question WHERE quiz_id = ?",
            [quizId]
        );

        const nextPosition = (lastQ?.maxPos || 0) + 1;

        // Insert question
        const result = await conn.query(
            `INSERT INTO quiz_question (quiz_id, question_text, question_type, points, position)
             VALUES (?, ?, ?, ?, ?)`,
            [quizId, questionText || "New Question", questionType || "single_choice", points || 1, nextPosition]
        );

        const questionId = Number(result.insertId);

        // Insert default options if provided
        if (Array.isArray(options) && options.length > 0) {
            for (let i = 0; i < options.length; i++) {
                await conn.query(
                    `INSERT INTO quiz_option (question_id, option_text, is_correct, position)
                     VALUES (?, ?, ?, ?)`,
                    [questionId, options[i].text, options[i].isCorrect ? 1 : 0, i + 1]
                );
            }
        }

        conn.release();
        res.json({ message: "Question added", questionId });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to add question" });
    }
});

// PATCH /api/author/questions/:questionId - Update question
router.patch("/author/questions/:questionId", async (req, res) => {
    const userId = verifyToken(req);
    if (!userId) return res.status(401).json({ error: "Not authenticated" });

    const { questionId } = req.params;
    const { questionText, questionType, points, options } = req.body;

    try {
        const conn = await pool.getConnection();

        // Verify ownership
        const [question] = await conn.query(
            `SELECT qq.*, c.autor_id
             FROM quiz_question qq
             JOIN quiz q ON qq.quiz_id = q.id
             JOIN lesson l ON q.lesson_id = l.id
             JOIN chapter ch ON l.chapter_id = ch.id
             JOIN curs c ON ch.curs_id = c.curs_id
             WHERE qq.id = ?`,
            [questionId]
        );

        if (!question || question.autor_id !== userId) {
            conn.release();
            return res.status(403).json({ error: "Not authorized" });
        }

        // Update question
        await conn.query(
            `UPDATE quiz_question SET
             question_text = COALESCE(?, question_text),
             question_type = COALESCE(?, question_type),
             points = COALESCE(?, points)
             WHERE id = ?`,
            [questionText, questionType, points, questionId]
        );

        // Update options if provided
        if (Array.isArray(options)) {
            await conn.query("DELETE FROM quiz_option WHERE question_id = ?", [questionId]);
            
            for (let i = 0; i < options.length; i++) {
                await conn.query(
                    `INSERT INTO quiz_option (question_id, option_text, is_correct, position)
                     VALUES (?, ?, ?, ?)`,
                    [questionId, options[i].text, options[i].isCorrect ? 1 : 0, i + 1]
                );
            }
        }

        conn.release();
        res.json({ message: "Question updated" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to update question" });
    }
});

// DELETE /api/author/questions/:questionId
router.delete("/author/questions/:questionId", async (req, res) => {
    const userId = verifyToken(req);
    if (!userId) return res.status(401).json({ error: "Not authenticated" });

    const { questionId } = req.params;

    try {
        const conn = await pool.getConnection();

        const [question] = await conn.query(
            `SELECT qq.*, qq.quiz_id, qq.position, c.autor_id
             FROM quiz_question qq
             JOIN quiz q ON qq.quiz_id = q.id
             JOIN lesson l ON q.lesson_id = l.id
             JOIN chapter ch ON l.chapter_id = ch.id
             JOIN curs c ON ch.curs_id = c.curs_id
             WHERE qq.id = ?`,
            [questionId]
        );

        if (!question || question.autor_id !== userId) {
            conn.release();
            return res.status(403).json({ error: "Not authorized" });
        }

        await conn.query("DELETE FROM quiz_question WHERE id = ?", [questionId]);
        
        // Normalize positions
        await conn.query(
            "UPDATE quiz_question SET position = position - 1 WHERE quiz_id = ? AND position > ?",
            [question.quiz_id, question.position]
        );

        conn.release();
        res.json({ message: "Question deleted" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to delete question" });
    }
});

export default router;