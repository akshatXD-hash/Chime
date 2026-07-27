import { User } from "../models/userModel.js";

export const allUsers = async (req, res) => {
  const search = req.query.search || "";

  const users = await User.find({
  _id: { $ne: req.user.id },
  $or: [
    { name: { $regex: search, $options: "i" } },
    { email: { $regex: search, $options: "i" } },
  ],
});

   
res.status(200).json(users);
};