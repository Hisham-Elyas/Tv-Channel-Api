const mysql = require("mysql2/promise");

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD, // Replace with your actual password
  database: process.env.DB_NAME,
  port: process.env.DB_PORT | 3306, // Default MySQL port
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  ssl: {
    rejectUnauthorized: false, // Enable SSL for secure connection
  },
});

const initializeDatabase = async () => {
  try {
    const connection = await pool.getConnection();
    console.log("✅ Database connection successful");
    connection.release();
  } catch (error) {
    console.error("❌ Database connection failed:", error);
  }
  try {
    await pool.query(`
  CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
    `);
    await pool.query(`
    CREATE TABLE IF NOT EXISTS matches (
    id INT AUTO_INCREMENT PRIMARY KEY,
    league VARCHAR(255),
    leagueLogo TEXT,
    homeTeam VARCHAR(255),
    awayTeam VARCHAR(255),
    homeTeamLogo TEXT,
    awayTeamLogo TEXT,
    time VARCHAR(255),
    matchTime VARCHAR(255),
    matchDate VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
      `);
    await pool.query(`
    CREATE TABLE IF NOT EXISTS channels_commentator (
    id INT AUTO_INCREMENT PRIMARY KEY,
    match_id INT,
    channel VARCHAR(255),
    commentator VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE
  )
      `);
    await pool.query(`
    CREATE TABLE IF NOT EXISTS \`groups\` (
      \`id\` INT AUTO_INCREMENT PRIMARY KEY,
      \`group_title\` VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
    await pool.query(`
    CREATE TABLE IF NOT EXISTS \`channels\` (
      \`id\` INT AUTO_INCREMENT PRIMARY KEY,
      \`group_id\` INT NOT NULL,
      \`tvg_id\` VARCHAR(255),
      \`tvg_name\` VARCHAR(255),
      \`tvg_logo\` VARCHAR(255),
      \`name\` VARCHAR(255),
      \`url\` VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (\`group_id\`) REFERENCES \`groups\`(\`id\`) ON DELETE CASCADE
    )
  `);
    console.log("✅ Database initialized");
  } catch (error) {
    console.error("❌ Database initialization failed:", error);
    process.exit(1);
  }
};

module.exports = {
  pool,
  initializeDatabase,
};
