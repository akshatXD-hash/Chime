import express from "express";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import cors from "cors";
import { connectDb } from "./config/db.js";
import { authRouter } from "./routers/authRouter.js";
import { userRouter } from "./routers/userRouter.js";
import { chatRouter } from "./routers/chatRouter.js";
import { messageRouter } from "./routers/messageRouter.js";
import { Server } from "socket.io";
dotenv.config();


const app = express();
app.use(express.json({ limit: '10mb' }));
// Allowed origins for CORS
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:3000",
  "http://localhost:4173",
  "https://chime-gjoi.onrender.com",
  "https://chime-murex.vercel.app"
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


app.use("/api/auth", authRouter);
app.use("/api/user", userRouter);
app.use("/api/chat", chatRouter);
app.use("/api/message", messageRouter);


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
const onlineUsersMap = new Map();

io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);
  let connectedUserId = null;

  // User logs in / setups socket connection
  socket.on("setup", (user) => {
    if (!user?._id) return;
    const userId = user._id.toString();
    connectedUserId = userId;
    socket.join(userId);
    onlineUsersMap.set(userId, socket.id);
    console.log(`User connected & setup in room: ${userId}`);
    socket.emit("connected");
    io.emit("get-online-users", Array.from(onlineUsersMap.keys()));
  });

  // User opens a chat
  socket.on("join-chat", (chatId) => {
    if (!chatId) return;
    socket.join(chatId.toString());
    console.log(`Joined chat room: ${chatId}`);
  });

  // Typing indicator
  socket.on("typing", (chatId) => {
    if (chatId) {
      socket.to(chatId.toString()).emit("typing", chatId);
    }
  });

  socket.on("stop-typing", (chatId) => {
    if (chatId) {
      socket.to(chatId.toString()).emit("stop-typing", chatId);
    }
  });

  // New message
  socket.on("send-message", (message) => {
    const { chat, sender } = message;
    if (!chat) return;

    const senderId = (sender?._id || sender)?.toString();
    const chatId = (chat?._id || chat)?.toString();

    // 1. Emit to the specific chat room
    if (chatId) {
      socket.to(chatId).emit("receive-message", message);
    }

    // 2. Emit directly to each user's personal room in the chat
    if (chat.users && Array.isArray(chat.users)) {
      chat.users.forEach((userItem) => {
        const userId = (userItem?._id || userItem)?.toString();
        if (!userId || userId === senderId) return;
        socket.to(userId).emit("receive-message", message);
      });
    }
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
    if (connectedUserId) {
      onlineUsersMap.delete(connectedUserId);
      io.emit("get-online-users", Array.from(onlineUsersMap.keys()));
    }
  });
});
