const jwt = require("jsonwebtoken");

const verifyUserToken = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1]; // Extract token from Bearer

  if (!token) {
    return res
      .status(401)
      .json({ message: "Access denied. No token provided." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check if the role is user
    if (decoded.role !== "user") {
      return res.status(403).json({ message: "Access denied. Users only." });
    }

    req.user = decoded; // Attach decoded token data to the request
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token." });
  }
};

module.exports = verifyUserToken;
