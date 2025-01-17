const jwt = require("jsonwebtoken");

const verifyTokenForAdminOrUser = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res
      .status(401)
      .json({ success: false, message: "No token provided" });
  }

  const token = authHeader.split(" ")[1]; // Extract the token
  console.log("Received Token:", token); // Log the token to verify it

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      console.error("Token verification failed:", err);
      return res
        .status(403)
        .json({ success: false, message: "Token is not valid" });
    }

    req.user = user;
    next();
  });
};

module.exports = verifyTokenForAdminOrUser;
