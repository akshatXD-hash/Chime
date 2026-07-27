import express from "express";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import cors from "cors";
import { connectDb } from "./config/db.js";
import {authRouter} from "./routers/authRouter.js";
import {userRouter} from "./routers/userRouter.js";
dotenv.config();


const app = express();
app.use(express.json());
app.use(cors({
  origin: ["http://localhost:5173"],
  credentials: true,
}));
app.use(cookieParser())


app.use("/api/auth",authRouter);
app.use("/api/user",userRouter);


const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  connectDb();
});

