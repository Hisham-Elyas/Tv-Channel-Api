module.exports = {
  baseUrl: "http://172.105.81.117",
  port: 3000,
};
const { pool } = require("./db");

let IPTV_CONFIG = {
  host: "http://depot52967.cdngold.me:80",
  username: "f2fcc4fcfe80",
  password: "zp4u61b467",
}; // Default values

async function loadIPTVConfig() {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM settings WHERE allow_use = TRUE LIMIT 1"
    );

    if (rows.length > 0) {
      IPTV_CONFIG = {
        host: rows[0].host,
        username: rows[0].username,
        password: rows[0].password,
      };
      console.log("✅ IPTV Config Loaded Host:", IPTV_CONFIG.host);
      console.log("✅ IPTV Config Loaded: User Name", IPTV_CONFIG.username);
    } else {
      IPTV_CONFIG = null;
      console.log("⚠️ No active IPTV settings found.");
    }
  } catch (error) {
    console.error("❌ Failed to load IPTV settings:", error.message);
  }
}

// Function to modify IPTV URL using stored settings
function modifyIPTVUrl(originalUrl) {
  let parts = originalUrl.split("/");

  if (parts.length < 5) return originalUrl;

  // Ensure the host has `http://` protocol
  if (!IPTV_CONFIG.host.startsWith("http://")) {
    IPTV_CONFIG.host = "http://" + IPTV_CONFIG.host; // Add http:// if missing
  }

  // Replace host, username, and password
  parts[2] = IPTV_CONFIG.host.replace(/^https?:\/\//, ""); // Remove any protocol if present
  parts[3] = IPTV_CONFIG.username;
  parts[4] = IPTV_CONFIG.password;

  return parts.join("/");
}

module.exports = { loadIPTVConfig, IPTV_CONFIG, modifyIPTVUrl };
