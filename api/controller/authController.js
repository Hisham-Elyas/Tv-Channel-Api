const User = require("../models/userModel");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { errorHandler } = require("../utils/errorHandler");

const AuthController = {
  // Register User
  register: async (req, res) => {
    try {
      const { username, email, password, phone } = req.body;

      // Check if user already exists
      const existingUser = await User.findByEmail(email);
      if (existingUser) {
        return res.status(400).json(errorHandler(400, "Email already in use"));
      }

      // Create user
      const userId = await User.register({ username, email, password, phone });
      res.status(201).json({
        status: 201,
        message: "User registered successfully",
        userId,
      });
    } catch (err) {
      res.status(500).json(errorHandler(500, err.message));
    }
  },

  // Login User
  login: async (req, res) => {
    try {
      const { email, password } = req.body;

      // Find user by email
      const user = await User.findByEmail(email);
      if (!user) {
        return res
          .status(401)
          .json(errorHandler(401, "Invalid email or password"));
      }

      // Check password
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res
          .status(401)
          .json(errorHandler(401, "Invalid email or password"));
      }

      // Generate JWT token
      const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
        expiresIn: "7d",
      });

      res.status(200).json({
        status: 200,
        message: "Login successful",
        token,
      });
    } catch (err) {
      res.status(500).json(errorHandler(500, err.message));
    }
  },
};

module.exports = AuthController;
