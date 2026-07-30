import express from "express";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import cors from "cors";
import { connectDb } from "./config/db.js";
import {authRouter} from "./routers/authRouter.js";
import {userRouter} from "./routers/userRouter.js";
import {chatRouter} from "./routers/chatRouter.js";
import {messageRouter} from "./routers/messageRouter.js";
import { Server } from "socket.io";
dotenv.config();


const app = express();
app.use(express.json());
// Allowed origins for CORS
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:3000",
  "http://localhost:4173",
  "https://chime-gjoi.onrender.com",
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);
app.use(cookieParser())


app.use("/api/auth",authRouter);
app.use("/api/user",userRouter);
app.use("/api/chat",chatRouter);
app.use("/api/message",messageRouter);


const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  connectDb();
});

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
  },
  pingTimeout: 60000,
});
io.on("connection", (socket) => {
  console.log("A user connected");
  // User logs in
  socket.on("setup", (user) => {
    socket.join(user._id);
    socket.emit("connected");
  });
  // User opens a chat
  socket.on("join-chat", (chatId) => {
    socket.join(chatId);
    console.log(`Joined chat ${chatId}`);
  });
  // Typing indicator
  socket.on("typing", (chatId) => {
    socket.to(chatId).emit("typing");
  });
  socket.on("stop-typing", (chatId) => {
    socket.to(chatId).emit("stop-typing");
  });
  // New message
  socket.on("send-message", (message) => {
    const { chat, sender } = message;
    if (!chat?.users) return;
    chat.users.forEach((user) => {
      if (user._id === sender._id) return;
      socket.to(user._id).emit("receive-message", message);
    });
  });
  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
});
