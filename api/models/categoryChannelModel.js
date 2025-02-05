// models/categoryChannelModel.js
const pool = require("../config/db");

const CategoryChannel = {
  async addChannelToCategory(category_id, channel_id) {
    const [result] = await pool.query(
      "INSERT INTO category_channels (category_id, channel_id) VALUES (?, ?)",
      [category_id, channel_id]
    );
    return result;
  },

  async getChannelsByCategory(category_id) {
    const [rows] = await pool.query(
      `SELECT c.*
       FROM channels c
       INNER JOIN category_channels cc ON c.id = cc.channel_id
       WHERE cc.category_id = ?`,
      [category_id]
    );
    return rows;
  },
};

module.exports = CategoryChannel;
