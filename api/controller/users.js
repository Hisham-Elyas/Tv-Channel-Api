const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { pool } = require("../config/db");

exports.signup = async (req, res) => {
  const { username, email, password, phone } = req.body;

  // Validation
  if (!username || !email || !password || !phone) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    // Check existing user
    const [existing] = await pool.query(
      "SELECT id FROM users WHERE email = ? OR username = ?",
      [email, username]
    );

    if (existing.length > 0) {
      return res
        .status(409)
        .json({ error: "Username or email already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const [result] = await pool.query(
      "INSERT INTO users (username, email, password, phone) VALUES (?, ?, ?, ?)",
      [username, email, hashedPassword, phone]
    );

    res.status(201).json({
      message: "User created successfully",
      userId: result.insertId,
    });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password required" });
  }

  try {
    // Find user
    const [users] = await pool.query("SELECT * FROM users WHERE email = ?", [
      email,
    ]);

    if (users.length === 0) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const user = users[0];
    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Generate JWT
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // User data without password
    const userData = {
      id: user.id,
      username: user.username,
      email: user.email,
      phone: user.phone,
      created_at: user.created_at,
    };

    res.json({
      message: "Login successful",
      token,
      user: userData,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Server error" });
  }
};
exports.deleteUser = async (req, res) => {
  const userId = req.params.id; // Assuming user ID is passed as a URL parameter
};
