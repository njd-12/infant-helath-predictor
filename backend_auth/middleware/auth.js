const jwt = require("jsonwebtoken");

const protect = (roles = []) => {
  return (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (roles.length && !roles.includes(decoded.role)) {
        return res.status(403).json({ message: "Access denied" });
      }
      req.user = decoded;   // { id, role, name, email }
      next();
    } catch {
      return res.status(401).json({ message: "Invalid or expired token" });
    }
  };
};

module.exports = protect;
