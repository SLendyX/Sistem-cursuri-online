// server/server.js - asigură-te că toate rutele sunt incluse:

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import usersRouter from "./routes/users.js";
import loginRouter from "./routes/login.js";
import coursesRouter from "./routes/courses.js";
import progressRouter from "./routes/progress.js";
import path from "path";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.use(express.static('public'));

app.use("/api/users", usersRouter); // sau app.use("/api", usersRouter);
app.use("/api", loginRouter);
app.use("/api", coursesRouter);
app.use("/api", progressRouter);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));