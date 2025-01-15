const jwt = require("jsonwebtoken");

// Middleware to verify token and allow admin or user
const verifyTokenForAdminOrUser = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1]; // Extract token from Bearer

  if (!token) {
    return res
      .status(401)
      .json({ message: "Access denied. No token provided." });
  }

  try {
    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check if the role is admin or user
    if (decoded.role === "admin" || decoded.role === "user") {
      req.user = decoded; // Attach user data to request
      next();
    } else {
      return res.status(403).json({ message: "Forbidden. Invalid role." });
    }
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token." });
  }
};

module.exports = verifyTokenForAdminOrUser;
