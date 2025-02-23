const express = require("express");
const { loadIPTVConfig, IPTV_CONFIG } = require("../config/config");
const pool = require("../config/db");

const router = express.Router();

// 🔹 Add a New Setting
router.post("/add", async (req, res) => {
  const { host, username, password } = req.body;

  if (!host || !username || !password) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const connection = await pool.getConnection();

    await connection.query(
      "INSERT INTO settings (host, username, password) VALUES (?, ?, ?)",
      [host, username, password]
    );

    connection.release();
    res.json({ message: "Setting added successfully!" });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Failed to add setting", details: error.message });
  }
});

// 🔹 Set One Setting as Active (Allow Use)
router.post("/set-allow-use", async (req, res) => {
  const { id } = req.body;

  if (!id) {
    return res.status(400).json({ error: "Missing setting ID" });
  }

  try {
    const connection = await pool.getConnection();

    // ❌ Set all settings to `false`
    await connection.query("UPDATE settings SET allow_use = FALSE");

    // ✅ Set the selected setting to `true`
    const [result] = await connection.query(
      "UPDATE settings SET allow_use = TRUE WHERE id = ?",
      [id]
    );

    connection.release();

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Setting ID not found" });
    }

    // ✅ Reload the active config
    await loadIPTVConfig();

    res.json({ message: `Setting ID ${id} is now active!`, IPTV_CONFIG });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Failed to update settings", details: error.message });
  }
});

router.get("/get-all-settings", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM settings");

    if (rows.length === 0) {
      return res.status(404).json({ error: "No settings found" });
    }

    res.json(rows);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Failed to fetch settings", details: error.message });
  }
});

// 🔹 Get Active Settings
router.get("/get-config", async (req, res) => {
  if (!IPTV_CONFIG) {
    return res.status(404).json({ error: "No active IPTV settings found" });
  }
  res.json(IPTV_CONFIG);
});

module.exports = router;
