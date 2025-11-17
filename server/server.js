import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import usersRouter from "./routes/users.js";
import loginRouter from "./routes/login.js";
import coursesRouter from "./routes/courses.js"
import path from "path";
console.log("Static path:", path.resolve("public"));

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());


app.use("/api/users", usersRouter);
app.use("/api", loginRouter);
app.use("/api", express.static('public/'));
app.use("/api", coursesRouter)


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
