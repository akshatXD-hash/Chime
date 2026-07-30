import express from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import {
  getChat,
  fetchChats,
  groupChat,
  renameGroup,
  removeFromGroup,
  addToGroup,
} from "../controllers/chat.controller.js";

export const chatRouter = express.Router();

chatRouter.post("/", authMiddleware, getChat);
chatRouter.get("/", authMiddleware, fetchChats);
chatRouter.post("/group", authMiddleware, groupChat);
chatRouter.put("/rename", authMiddleware, renameGroup);
chatRouter.put("/groupremove", authMiddleware, removeFromGroup);
chatRouter.put("/groupadd", authMiddleware, addToGroup);
