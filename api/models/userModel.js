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
  // Update user details
  updateUserDetails: async ({ id, username, phone }) => {
    const [result] = await pool.query(
      "UPDATE users SET username = ?, phone = ? WHERE id = ?",
      [username, phone, id]
    );
    return result.affectedRows > 0;
  },

  // Update user password
  updateUserPassword: async ({ id, password }) => {
    const hashedPassword = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      "UPDATE users SET password = ? WHERE id = ?",
      [hashedPassword, id]
    );
    return result.affectedRows > 0;
  },
  // update user email
  updateUserEmail: async ({ id, email }) => {
    const [result] = await pool.query(
      "UPDATE users SET email = ? WHERE id = ?",
      [email, id]
    );
    return result.affectedRows > 0;
  },
  // Delete user account
  deleteUser: async (id) => {
    const [result] = await pool.query("DELETE FROM users WHERE id = ?", [id]);
    return result.affectedRows > 0;
  },
  // Get all users
  getAllUsers: async () => {
    const [users] = await pool.query("SELECT * FROM users");
    return users;
  },
};

module.exports = User;
