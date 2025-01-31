const { pool } = require("../config/db");
const Group = {
  // Insert a new group
  createGroup: async (groupTitle) => {
    try {
      const result = await pool.query(
        "INSERT INTO `groups` (group_title) VALUES (?)",
        [groupTitle]
      );
      return result[0];
    } catch (err) {
      throw new Error(err);
    }
  },

  // Get all groups
  getAllGroups: async () => {
    try {
      const [rows] = await pool.query("SELECT * FROM `groups`");
      return rows;
    } catch (err) {
      throw new Error(err);
    }
  },

  // Get group by ID
  getGroupById: async (id) => {
    try {
      const [rows] = await pool.query("SELECT * FROM `groups` WHERE `id` = ?", [
        id,
      ]);
      return rows[0];
    } catch (err) {
      throw new Error(err);
    }
  },
};

module.exports = Group;
