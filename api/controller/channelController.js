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
  // Search channels within a specific group by channel name
  searchChannelsInGroup: async (req, res) => {
    const { group_id } = req.params;
    const { title } = req.query;

    if (!group_id || !title) {
      return res
        .status(400)
        .json({ message: "Please provide both group ID and search title" });
    }

    try {
      const channels = await Channel.searchChannelsInGroupByTitle(
        group_id,
        title
      );
      res.status(200).json({
        count: channels.length,
        channels: channels,
      });
    } catch (err) {
      res.status(500).json({
        error: true,
        message: "Error while searching for channels in group",
        details: err.message,
      });
    }
  },
};

module.exports = ChannelController;
