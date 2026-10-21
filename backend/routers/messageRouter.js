import express from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { getMessages, sendMessage, markMessagesRead, markMessagesDelivered } from "../controllers/message.controller.js";

export const messageRouter = express.Router();

messageRouter.get("/:chatId", authMiddleware, getMessages);
messageRouter.post("/", authMiddleware, sendMessage);

messageRouter.patch("/:chatId/read", authMiddleware, markMessagesRead);

messageRouter.patch("/:chatId/delivered", authMiddleware, markMessagesDelivered);
