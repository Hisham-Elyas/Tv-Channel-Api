const express = require("express");
const router = express.Router();
const GroupController = require("../controller/groupController");

// Create a new group
router.post("/", GroupController.createGroup);

// Get all groups
router.get("/", GroupController.getAllGroups);

// Get group by ID
router.get("/:id", GroupController.getGroupById);
// Route to search groups by title

// GET /api/groups/search?title=Sports

router.get("/groups/search", GroupController.searchGroups);

module.exports = router;
