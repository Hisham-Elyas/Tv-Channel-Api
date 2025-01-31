const jwt = require("jsonwebtoken");
const { errorHandler } = require("../utils/errorHandler");

const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization;

  if (!token) {
    return res
      .status(403)
      .json(errorHandler(403, "Access denied. No token provided."));
  }

  try {
    const decoded = jwt.verify(token.split(" ")[1], process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json(errorHandler(401, "Invalid token"));
  }
};

module.exports = authMiddleware;
