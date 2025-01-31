const express = require("express");
const router = express.Router();
const ChannelController = require("../controller/channelController");

// Create a new channel
router.post("/", ChannelController.createChannel);

// Get all channels
router.get("/", ChannelController.getAllChannels);

// Get channels by group ID
router.get("/group/:groupId", ChannelController.getChannelsByGroupId);

// Route to search channels within a specific group
/// GET /api/groups/groups_id/channels/search?title=Football
router.get(
  "/groups/:group_id/channels/search",
  ChannelController.searchChannelsInGroup
);

module.exports = router;
