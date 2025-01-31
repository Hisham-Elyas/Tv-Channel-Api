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
      const [groups] = await pool.query(`
        SELECT g.id, g.group_title, 
               COUNT(c.id) AS channels
        FROM groups g
        LEFT JOIN channels c ON g.id = c.group_id
        GROUP BY g.id
      `);
      // const [rows] = await pool.query("SELECT * FROM `groups`");
      return groups;
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

  searchGroupsByTitle: async (title) => {
    try {
      const [groups] = await db.query(
        `
        SELECT g.id, g.group_title, 
        COUNT(c.id) AS channels
        FROM groups g
        LEFT JOIN channels c ON g.id = c.group_id
      WHERE g.group_title LIKE ?
      GROUP BY g.id
    `,
        [`%${title}%`]
      );
      return groups;
    } catch (err) {
      throw new Error(err);
    }
  },
};

module.exports = Group;
