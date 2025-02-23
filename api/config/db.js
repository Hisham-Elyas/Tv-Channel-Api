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
  connectTimeout: 28800, // 10 seconds
  ssl: {
    rejectUnauthorized: false, // Enable SSL for secure connection
  },
});
const initializeDatabase = async () => {
  try {
    // Verify database connection
    const connection = await pool.getConnection();
    connection.release();
    console.log("✅ Database connection successful");
  } catch (error) {
    console.error("❌ Database connection failed:", error);
    process.exit(1);
  }

  try {
    // Execute table creation in transaction
    await pool.query("START TRANSACTION");

    // Create tables with proper constraints
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(255) NOT NULL UNIQUE,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        phone VARCHAR(20) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
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
    matchDate VARCHAR(255)
  )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS channels_of_matches (
        id INT AUTO_INCREMENT PRIMARY KEY,
        match_id INT ,
        channel VARCHAR(255),
        commentator VARCHAR(255),
        FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS \`groups\` (
        id INT AUTO_INCREMENT PRIMARY KEY,
        group_title VARCHAR(255) NOT NULL UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS \`channels\` (
        id INT AUTO_INCREMENT PRIMARY KEY,
        group_id INT NOT NULL,
        tvg_id VARCHAR(255),
        tvg_name VARCHAR(255) NOT NULL,
        tvg_logo TEXT,
        name VARCHAR(255) NOT NULL,
        url VARCHAR(255) NOT NULL UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (group_id) REFERENCES \`groups\`(id) ON DELETE CASCADE
      )
    `);
    //-- Create the categories table
    await pool.query(`
     CREATE TABLE IF NOT EXISTS \`categories\` (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
     )
    `);
    // -- Create the category_channels table (join table)
    await pool.query(`
     CREATE TABLE IF NOT EXISTS \`category_channels\` (
        category_id INT NOT NULL,
        channel_id INT NOT NULL,
        channel_name VARCHAR(255) NOT NULL,
        PRIMARY KEY (category_id, channel_id),
        FOREIGN KEY (category_id) REFERENCES \`categories\`(id) ON DELETE CASCADE,
        FOREIGN KEY (channel_id) REFERENCES \`channels\`(id) ON DELETE CASCADE  )
    `);
    await pool.query(`
CREATE TABLE IF NOT EXISTS category_channel_links (
    id INT AUTO_INCREMENT PRIMARY KEY,
    category_id INT NOT NULL,
    channel_id INT NOT NULL,
    name VARCHAR(255) NOT NULL, -- Custom name for the link
    url TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
    FOREIGN KEY (channel_id) REFERENCES channels(id) ON DELETE CASCADE
)
    `);
    await pool.query(`
CREATE TABLE IF NOT EXISTS \`settings\` (
    id INT AUTO_INCREMENT PRIMARY KEY, 
    host VARCHAR(255) NOT NULL,
    username VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    allow_use BOOLEAN DEFAULT FALSE
);
    `);

    await pool.query("COMMIT");
    console.log("✅ Database initialized successfully");
  } catch (error) {
    await pool.query("ROLLBACK");
    console.error("❌ Database initialization failed:", error);
    process.exit(1);
  }
};

module.exports = {
  pool,
  initializeDatabase,
};
