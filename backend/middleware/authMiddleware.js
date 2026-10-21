import jwt from "jsonwebtoken";

export const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith("Bearer ")
      ? authHeader.slice(7).trim()
      : req.cookies?.token;

    if (!token) {
      return res.status(401).json({
        message: "Please sign in to continue.",
      });
    }

    let verifyToken = jwt.verify(token, process.env.JWT_SECRET);
    const userId = verifyToken.id || verifyToken._id;
    if (!userId) throw new Error("Missing account identity");
    req.user = {
      ...verifyToken,
      id: userId,
      _id: userId,
    };
    return next();
  } catch (err) {
    console.log("Auth middleware error:", err.message);
    return res.status(401).json({
      message: "Your session has expired. Please sign in again.",
    });
  }
};