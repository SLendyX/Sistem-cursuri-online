import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import usersRouter from "./routes/users.js";
import loginRouter from "./routes/login.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());


app.use("/api/users", usersRouter);
app.use("/api/login", loginRouter);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
