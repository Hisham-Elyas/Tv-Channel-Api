const express = require("express");
const router = express.Router();
const AuthController = require("../controller/authController");
const authMiddleware = require("../middleware/authMiddleware");

const otpLimiter = require("../utils/otpLimiter");
const resetLimiter = require("../utils/resetLimiter");
router.post("/send-reset-otp", otpLimiter, AuthController.sendResetOtp);
router.post(
  "/reset-password-with-otp",
  resetLimiter,
  AuthController.resetPasswordWithOtp
);
router.post("/register", AuthController.register);
router.post("/login", AuthController.login);
router.put("/update/:id", authMiddleware, AuthController.updateUserDetails);
router.put(
  "/update-password/:id",
  authMiddleware,
  AuthController.updateUserPassword
);
router.put("/update-email/:id", authMiddleware, AuthController.updateUserEmail);
router.delete("/delete/:id", authMiddleware, AuthController.deleteUser);
router.get("/all-users", authMiddleware, AuthController.getAllUsers);
router.get("/user/:id", authMiddleware, AuthController.getUserData);

module.exports = router;
