// routes/categoryRoutes.js
const express = require("express");
const router = express.Router();
const categoryController = require("../controller/categoryController");

// Create a new category
router.post("/", categoryController.createCategory);

// Get all categories
router.get("/", categoryController.getCategories);

// Add a channel to a category
router.post("/:id/channels", categoryController.addChannelToCategory);

// Get channels of a category
router.get("/:id/channels", categoryController.getCategoryChannels);

module.exports = router;
