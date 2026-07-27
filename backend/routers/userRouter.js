import express from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import {allUsers} from "../controllers/user.controller.js";
export const userRouter = express.Router();

userRouter.get("/", authMiddleware, allUsers);