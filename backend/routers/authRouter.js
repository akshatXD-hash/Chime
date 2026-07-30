import express from "express";
import { signUp, signIn, uploadAvatar } from "../controllers/auth.controller.js";
import { uploadSingleImage } from "../middleware/upload.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

export const authRouter = express.Router();

authRouter.post("/signup", uploadSingleImage, signUp);
authRouter.post("/signin", signIn);
authRouter.post("/upload-avatar", authMiddleware, uploadSingleImage, uploadAvatar);