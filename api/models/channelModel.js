const { pool } = require("../config/db");
const Channel = {
  // Insert a new channel
  createChannel: async (groupId, tvgId, tvgName, tvgLogo, name, url) => {
    try {
      const result = await pool.query(
        "INSERT INTO `channels` (group_id, tvg_id, tvg_name, tvg_logo, name, url) VALUES (?, ?, ?, ?, ?, ?)",
        [groupId, tvgId, tvgName, tvgLogo, name, url]
      );
      return result[0];
    } catch (err) {
      throw new Error(err);
    }
  },

  // Get all channels
  getAllChannels: async () => {
    try {
      const [rows] = await pool.query("SELECT * FROM `channels`");
      return rows;
    } catch (err) {
      throw new Error(err);
    }
  },

  // Get channels by group ID
  getChannelsByGroupId: async (groupId) => {
    try {
      const [group] = await pool.query(
        "SELECT id, group_title FROM `groups` WHERE id = ?",
        [groupId]
      );

      if (group.length === 0) {
        return null; // Group not found
      }

      const [channels] = await pool.query(
        "SELECT * FROM `channels` WHERE `group_id` = ?",
        [groupId]
      );

      return {
        groupId: group[0].id,
        groupName: group[0].group_title,
        count: channels.length,
        channels: channels,
      };
    } catch (err) {
      throw new Error(err);
    }
  },
  searchChannelsInGroupByTitle: async (group_id, title) => {
    try {
      const [channels] = await db.query(
        `
        SELECT * 
        FROM channels 
        WHERE group_id = ? AND name LIKE ?
      `,
        [group_id, `%${title}%`]
      );
      return channels;
    } catch (err) {
      throw new Error(err);
    }
  },
};

module.exports = Channel;
