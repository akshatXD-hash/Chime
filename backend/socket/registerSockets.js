import mongoose from "mongoose";
import { Chat } from "../models/chatModel.js";
import jwt from "jsonwebtoken";

export function registerSockets(io) {
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      const account = jwt.verify(token, process.env.JWT_SECRET);
      const userId = account.id || account._id;
      if (!userId) throw new Error("Missing account identity");
      socket.data.userId = String(userId);
      next();
    } catch {
      const error = new Error("Please sign in again to reconnect.");
      error.data = { code: "SESSION_EXPIRED" };
      next(error);
    }
  });
const onlineUsersMap = new Map();

io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);
  const userId = socket.data.userId;
  const sockets = onlineUsersMap.get(userId) || new Set();
  sockets.add(socket.id);
  onlineUsersMap.set(userId, sockets);
  socket.join(userId);
  const announce = () => {
    socket.emit("connected");
    io.emit("get-online-users", [...onlineUsersMap.keys()]);
  };
  socket.on("setup", announce);
  announce();

  socket.on("join-chat", async (chatId) => {
    if (!mongoose.isObjectIdOrHexString(chatId)) return;
    try {
      if (await Chat.exists({ _id: chatId, users: userId })) socket.join(`chat:${chatId}`);
    } catch (err) { console.error("Could not join conversation:", err.message); }
  });

  socket.on("leave-chat", (chatId) => socket.leave(`chat:${chatId}`));

  for (const event of ["typing", "stop-typing"]) {
    socket.on(event, (chatId) => {
      if (socket.rooms.has(`chat:${chatId}`)) socket.to(`chat:${chatId}`).emit(event, chatId);
    });
  }

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
    sockets.delete(socket.id);
    if (!sockets.size) onlineUsersMap.delete(userId);
    io.emit("get-online-users", [...onlineUsersMap.keys()]);
  });
});
}
