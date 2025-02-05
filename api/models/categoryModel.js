// models/categoryModel.js
const { pool } = require("../config/db");

const Category = {
  async create(name) {
    const [result] = await pool.query(
      "INSERT INTO categories (name) VALUES (?)",
      [name]
    );
    return { id: result.insertId, name };
  },

  async getAll() {
    const [rows] = await pool.query(`
        SELECT 
          c.id, 
          c.name, 
          COUNT(cc.channel_id) AS channels
        FROM categories c
        LEFT JOIN category_channels cc ON c.id = cc.category_id
        GROUP BY c.id
      `);
    return rows;
  },

  async getById(id) {
    const [rows] = await pool.query("SELECT * FROM categories WHERE id = ?", [
      id,
    ]);
    return rows[0];
  },
};

module.exports = Category;
