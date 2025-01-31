const Channel = require("../models/channelModel");

const ChannelController = {
  // Create a new channel
  createChannel: async (req, res) => {
    try {
      const { groupId, tvgId, tvgName, tvgLogo, name, url } = req.body;
      const result = await Channel.createChannel(
        groupId,
        tvgId,
        tvgName,
        tvgLogo,
        name,
        url
      );
      res.status(201).json({
        message: "Channel created successfully",
        channelId: result.insertId,
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // Get all channels
  getAllChannels: async (req, res) => {
    try {
      const channels = await Channel.getAllChannels();
      res.status(200).json({
        count: channels.length,
        channels: channels,
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // Get channels by group ID
  getChannelsByGroupId: async (req, res) => {
    try {
      const { groupId } = req.params;
      const channels = await Channel.getChannelsByGroupId(groupId);
      if (channels.length > 0) {
        res.status(200).json({
          count: channels.length,
          channels: channels,
        });
      } else {
        res.status(404).json({ message: "No channels found for this group" });
      }
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
};

module.exports = ChannelController;
