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
    req.user = verifyToken;
    return next();
    }catch(err){
     console.log(err);
     return res.status(500).json({
        message:"Internal Server error"
     })
    }
    
}