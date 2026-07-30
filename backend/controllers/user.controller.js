import { User } from "../models/userModel.js";

export const allUsers = async (req, res) => {
  const search = req.query.search || "";
  const currentUserId = req.user?.id || req.user?._id;

  const users = await User.find({
    _id: { $ne: currentUserId },
    $or: [
      { name: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
    ],
  });

  res.status(200).json(users);
};