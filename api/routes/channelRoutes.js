const express = require("express");
const router = express.Router();
const ChannelController = require("../controller/channelController");

// Create a new channel
router.post("/", ChannelController.createChannel);

// Get all channels
router.get("/", ChannelController.getAllChannels);

// Get channels by group ID
router.get("/group/:groupId", ChannelController.getChannelsByGroupId);

module.exports = router;
