import jwt from "jsonwebtoken";

export const authMiddleware = (req, res, next) => {
  try {
    let token = req.cookies?.token;

    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.split(" ")[1];
      }
    }

    if (!token) {
      return res.status(401).json({
        message: "token not found",
      });
    }

    let verifyToken = jwt.verify(token, process.env.JWT_SECRET);
    const userId = verifyToken.id || verifyToken._id;
    req.user = {
      ...verifyToken,
      id: userId,
      _id: userId,
    };
    return next();
  } catch (err) {
    console.log("Auth middleware error:", err.message);
    return res.status(401).json({
      message: "Invalid or expired token",
    });
  }
};