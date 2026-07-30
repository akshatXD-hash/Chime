import { User } from "../models/userModel.js";

export const allUsers = async (req, res) => {
  try {
    const search = req.query.search || "";
    const currentUserId = req.user?.id || req.user?._id;

    const users = await User.find({
      _id: { $ne: currentUserId },
      $or: [
        { name: { $regex: search, $options: "i" }, },
        { email: { $regex: search, $options: "i" } },
      ],
    }).select("-password");

    return res.status(200).json(users);
  } catch (err) {
    console.error("Error fetching users:", err.message);
    return res.status(500).json({ message: "Failed to fetch users" });
  }
};