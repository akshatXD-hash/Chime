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
  let connectedUserId = null;

  socket.on("setup", (user) => {
    const userId = socket.data.userId;
    connectedUserId = userId;
    socket.join(userId);
    onlineUsersMap.set(userId, socket.id);
    console.log(`User connected & setup in room: ${userId}`);
    socket.emit("connected");
    io.emit("get-online-users", Array.from(onlineUsersMap.keys()));
  });

  socket.on("join-chat", (chatId) => {
    if (!chatId) return;
    socket.join(chatId.toString());
    console.log(`Joined chat room: ${chatId}`);
  });

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

  socket.on("send-message", (message) => {
    const { chat, sender } = message;
    if (!chat) return;

    const senderId = (sender?._id || sender)?.toString();

    if (chat.users && Array.isArray(chat.users)) {
      chat.users.forEach((userItem) => {
        const userId = (userItem?._id || userItem)?.toString();
        if (!userId || userId === senderId) return;
        socket.to(userId).emit("receive-message", message);
      });
    } else {
      const chatId = (chat?._id || chat)?.toString();
      if (chatId) {
        socket.to(chatId).emit("receive-message", message);
      }
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
}
