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
      const [rows] = await pool.query(
        "SELECT * FROM `channels` WHERE `group_id` = ?",
        [groupId]
      );
      return rows;
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
