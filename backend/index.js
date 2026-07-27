import express from "express";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import cors from "cors";
dotenv.config();


const app = express();
app.use(express.json());
app.use(cors({
  origin: ["http://localhost:5173"],
  credentials: true,
}));
app.use(cookieParser())


const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

