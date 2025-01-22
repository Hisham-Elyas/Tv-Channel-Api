const express = require("express");
const router = express.Router();
const usersController = require("../controller/users");
const authMiddleware = require("../middleware/authMiddleware");

router.post("/signup", usersController.signup);
router.post("/login", usersController.login);
router.delete("/delete", authMiddleware, usersController.deleteUser);

module.exports = router;
