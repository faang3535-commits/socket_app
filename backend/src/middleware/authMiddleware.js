const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
 
  if (!authHeader) {
    return res.status(401).json({ message: "No token, authorization denied" });
  }
  
  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") {
    return res.status(401).json({ message: "Token format is invalid" });
  }
  
  const token = parts[1];

  try {
    const decoded = jwt.verify(
      token,
      process.env.SUPABASE_JWT_SECRET,
      { algorithms: ["HS256"] }
    );
  
    req.user = {
      id: decoded.sub,  
      email: decoded.email,
      role: decoded.role,
    };

    next();
  } catch (err) {
    console.error("JWT Verification Error:", err.message);
    return res.status(401).json({ message: "Token is not valid" });
  }
};

module.exports = authMiddleware;
