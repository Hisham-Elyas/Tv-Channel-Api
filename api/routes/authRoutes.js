const express = require("express");
const router = express.Router();
const AuthController = require("../controller/authController");

router.post("/register", AuthController.register);
router.post("/login", AuthController.login);
router.put("/update/:id", AuthController.updateUserDetails);
router.put("/update-password/:id", AuthController.updateUserPassword);
router.put("/update-email/:id", AuthController.updateUserEmail);
router.delete("/delete/:id", AuthController.deleteUser);
router.get("/all-users", AuthController.getAllUsers);

module.exports = router;
