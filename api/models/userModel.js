const { pool } = require("../config/db");
const bcrypt = require("bcrypt");

const User = {
  // Register a new user
  register: async ({ username, email, password, phone }) => {
    const hashedPassword = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      "INSERT INTO users (username, email, password, phone) VALUES (?, ?, ?, ?)",
      [username, email, hashedPassword, phone]
    );
    return result.insertId;
  },

  // Find user by email
  findByEmail: async (email) => {
    const [users] = await pool.query("SELECT * FROM users WHERE email = ?", [
      email,
    ]);
    return users.length > 0 ? users[0] : null;
  },

  // Find user by ID
  findById: async (id) => {
    const [users] = await pool.query("SELECT * FROM users WHERE id = ?", [id]);
    return users.length > 0 ? users[0] : null;
  },
};

module.exports = User;
