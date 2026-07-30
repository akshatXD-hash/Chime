import { User } from "../models/userModel.js";
import z from "zod";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { uploadToCloudinary } from "../config/cloudinary.js";

const signupBody = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  pic: z.string().optional(),
});

export const signUp = async (req, res) => {
  try {
    const validation = signupBody.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        message: validation.error.errors[0].message,
      });
    }

    const { name, email, password, pic } = req.body;

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(409).json({
        message: "User already exists",
      });
    }

    let avatarUrl = pic;

    if (req.file) {
      const uploadResult = await uploadToCloudinary(req.file.buffer, "chime/avatars");
      avatarUrl = uploadResult.secure_url;
    } else if (pic && (pic.startsWith("data:") || pic.startsWith("http"))) {
      try {
        const uploadResult = await uploadToCloudinary(pic, "chime/avatars");
        avatarUrl = uploadResult.secure_url;
      } catch (uploadErr) {
        console.error("Cloudinary upload warning:", uploadErr.message);
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      pic: avatarUrl, 
    });

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "3d" }
    );

   res.cookie("token", token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  maxAge: 3 * 24 * 60 * 60 * 1000, // 3 days
});

    return res.status(201).json({
      message: "User created successfully",
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        pic: user.pic,
      },
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

export const uploadAvatar = async (req, res) => {
  try {
    let fileSource;
    if (req.file) {
      fileSource = req.file.buffer;
    } else if (req.body && req.body.image) {
      fileSource = req.body.image;
    } else {
      return res.status(400).json({ message: "No image file or image string provided" });
    }

    const uploadResult = await uploadToCloudinary(fileSource, "chime/avatars");

    if (req.user && req.user.id) {
      await User.findByIdAndUpdate(req.user.id, { pic: uploadResult.secure_url });
    }

    return res.status(200).json({
      message: "Avatar uploaded successfully",
      url: uploadResult.secure_url,
    });
  } catch (err) {
    console.error("Upload avatar error:", err);
    return res.status(500).json({
      message: "Failed to upload avatar image",
    });
  }
};


const signinBody = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const signIn = async (req, res) => {
  try {
    const validation = signinBody.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        message: validation.error.errors[0].message,
      });
    }

    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({
        message: "Invalid credentials",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        message: "Invalid credentials",
      });
    }

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "3d" }
    );

    res.cookie("token", token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  maxAge: 3 * 24 * 60 * 60 * 1000, // 3 days
});
    return res.status(200).json({
      message: "Signed in successfully",
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        pic: user.pic,
      },
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};