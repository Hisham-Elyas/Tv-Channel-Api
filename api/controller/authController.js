const User = require("../models/userModel");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { errorHandler } = require("../utils/errorHandler");

const { sendOtpEmail } = require("../utils/mailer");
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

const AuthController = {
  // Register User
  register: async (req, res) => {
    try {
      const { username, email, password, phone } = req.body;

      // Check if user already exists
      const existingUser = await User.findByEmail(email);
      if (existingUser) {
        return res
          .status(409)
          .json(
            errorHandler(
              409,
              "This email is already registered. Please use a different email."
            )
          );
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
          .json(errorHandler(401, "Invalid credentials. Please try again."));
      }

      // Check password
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res
          .status(401)
          .json(errorHandler(401, "Invalid email or password"));
      }

      // Generate JWT token
      const token = jwt.sign(
        {
          userId: user.id,
          email: user.email,
        },
        process.env.JWT_SECRET,
        {
          expiresIn: "30d",
        }
      );

      res.status(200).json({
        status: 200,
        message: "Login successful",
        token,
      });
    } catch (err) {
      res.status(500).json(errorHandler(500, err.message));
    }
  },
  // Update user details
  updateUserDetails: async (req, res) => {
    try {
      const { id } = req.params;
      const { username, phone } = req.body;

      // Update user details
      const isUpdated = await User.updateUserDetails({ id, username, phone });
      if (!isUpdated) {
        return res
          .status(404)
          .json(errorHandler(404, "User not found or no changes made."));
      }

      res.status(200).json({
        status: 200,
        message: "User details updated successfully",
      });
    } catch (err) {
      res.status(500).json(errorHandler(500, err.message));
    }
  },

  // Update user password
  updateUserPassword: async (req, res) => {
    try {
      const { id } = req.params;
      const { password } = req.body;

      const isUpdated = await User.updateUserPassword({ id, password });
      if (!isUpdated) {
        return res
          .status(404)
          .json(errorHandler(404, "User not found or no changes made."));
      }

      res.status(200).json({
        status: 200,
        message: "Password updated successfully",
      });
    } catch (err) {
      res.status(500).json(errorHandler(500, err.message));
    }
  },

  // Update user email
  updateUserEmail: async (req, res) => {
    try {
      const { id } = req.params;
      const { email } = req.body;

      const isUpdated = await User.updateUserEmail({ id, email });
      if (!isUpdated) {
        return res
          .status(404)
          .json(errorHandler(404, "User not found or no changes made."));
      }

      res.status(200).json({
        status: 200,
        message: "Email updated successfully",
      });
    } catch (err) {
      res.status(500).json(errorHandler(500, err.message));
    }
  },

  // Delete user account
  deleteUser: async (req, res) => {
    try {
      const { id } = req.params;

      const isDeleted = await User.deleteUser(id);
      if (!isDeleted) {
        return res
          .status(404)
          .json(errorHandler(404, "User not found or already deleted."));
      }

      res.status(200).json({
        status: 200,
        message: "User deleted successfully",
      });
    } catch (err) {
      res.status(500).json(errorHandler(500, err.message));
    }
  },

  // Get all users
  getAllUsers: async (req, res) => {
    try {
      const users = await User.getAllUsers();
      res.status(200).json({
        status: 200,
        users,
      });
    } catch (err) {
      res.status(500).json(errorHandler(500, err.message));
    }
  },

  // Get user data by ID
  getUserData: async (req, res) => {
    try {
      const { id } = req.params;

      // Fetch user data
      const user = await User.findById(id);
      if (!user) {
        return res.status(404).json(errorHandler(404, "User not found."));
      }

      res.status(200).json({
        status: 200,
        user,
      });
    } catch (err) {
      res.status(500).json(errorHandler(500, err.message));
    }
  },

  sendResetOtp: async (req, res) => {
    const { email } = req.body;

    try {
      const user = await User.findByEmail(email);
      if (!user) return res.status(404).json({ message: "User not found" });

      const otp = generateOTP();
      const hashedOtp = await bcrypt.hash(otp, 10);
      const expireTime = new Date(Date.now() + 10 * 60000);

      await User.updateOtp(email, hashedOtp, expireTime);
      await sendOtpEmail(email, otp);

      res.status(200).json({ message: `OTP sent to email ${email}` });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
  },

  resetPasswordWithOtp: async (req, res) => {
    const { email, otp, newPassword } = req.body;

    try {
      const user = await User.verifyOtp(email);
      if (!user)
        return res.status(400).json({ message: "Invalid or expired OTP" });

      const isMatch = await bcrypt.compare(otp, user.reset_otp);
      if (!isMatch) return res.status(400).json({ message: "Incorrect OTP" });

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await User.updatePassword(email, hashedPassword);

      res.status(200).json({ message: "Password reset successfully" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
  },
};

module.exports = AuthController;
