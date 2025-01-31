const express = require("express");
const router = express.Router();
const GroupController = require("../controller/groupController");

// Create a new group
router.post("/", GroupController.createGroup);

// Get all groups
router.get("/", GroupController.getAllGroups);

// Get group by ID
router.get("/:id", GroupController.getGroupById);

module.exports = router;
