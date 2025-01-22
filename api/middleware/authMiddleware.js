const jwt = require("jsonwebtoken");
const { pool } = require("../config/db");

module.exports = async (req, res, next) => {
  try {
    // 1. Validate Authorization Header
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        error: "Authorization header required",
        code: "MISSING_AUTH_HEADER",
      });
    }

    // 2. Verify Header Format
    if (!authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        error: "Invalid authorization format. Use: Bearer <token>",
        code: "INVALID_AUTH_SCHEME",
      });
    }

    // 3. Extract and Validate Token
    const token = authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        error: "Missing authentication token",
        code: "MISSING_TOKEN",
      });
    }

    // 4. Validate Token Structure
    if (!/^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/.test(token)) {
      return res.status(401).json({
        error: "Invalid token structure",
        code: "INVALID_TOKEN_FORMAT",
      });
    }

    // 5. Verify JWT
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET, {
        algorithms: ["HS256"], // Enforce specific algorithm
        clockTolerance: 15, // 15-second grace period for clock skew
      });
    } catch (verifyError) {
      // Handle specific verification errors
      if (verifyError.name === "TokenExpiredError") {
        return res.status(401).json({
          error: "Session expired. Please login again",
          code: "TOKEN_EXPIRED",
        });
      }
      throw verifyError; // Re-throw for generic error handler
    }

    // 6. Validate Token Payload
    if (!decoded.userId || !decoded.email) {
      return res.status(401).json({
        error: "Invalid token contents",
        code: "INVALID_TOKEN_PAYLOAD",
      });
    }

    // 7. Verify User Exists
    const [users] = await pool.query(
      "SELECT id, email FROM users WHERE id = ?",
      [decoded.userId]
    );

    if (users.length === 0) {
      return res.status(401).json({
        error: "User account not found",
        code: "USER_NOT_FOUND",
      });
    }

    // 8. Attach User Context
    req.auth = {
      user: {
        id: users[0].id,
        email: users[0].email,
      },
      token: {
        issuedAt: decoded.iat,
        expiresAt: decoded.exp,
      },
    };

    next();
  } catch (error) {
    // Handle specific JWT errors
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        error: "Invalid authentication token",
        code: "INVALID_TOKEN",
        details: error.message,
      });
    }

    // Handle database errors
    if (error.code === "ECONNREFUSED") {
      return res.status(503).json({
        error: "Database unavailable",
        code: "DATABASE_UNAVAILABLE",
      });
    }

    // Generic error handler
    console.error("Authentication Error:", error);
    res.status(500).json({
      error: "Authentication system error",
      code: "AUTH_SYSTEM_FAILURE",
    });
  }
};
