import express from "express";
import { signUp, signIn, uploadAvatar } from "../controllers/auth.controller.js";
import { uploadSingleImage } from "../middleware/upload.js";

export const authRouter = express.Router();

authRouter.post("/signup", uploadSingleImage, signUp);
authRouter.post("/signin", signIn);
authRouter.post("/upload-avatar", uploadSingleImage, uploadAvatar);