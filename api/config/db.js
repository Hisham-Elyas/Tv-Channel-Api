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
  // try {
  //   await pool.query(`
  //     CREATE TABLE IF NOT EXISTS users (
  //       id INT AUTO_INCREMENT PRIMARY KEY,
  //       username VARCHAR(255) NOT NULL UNIQUE,
  //       email VARCHAR(255) NOT NULL UNIQUE,
  //       password VARCHAR(255) NOT NULL,
  //       phone VARCHAR(20) NOT NULL,
  //       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  //     )
  //   `);
  //   console.log("Database initialized");
  // } catch (error) {
  //   console.error("Database initialization failed:", error);
  //   process.exit(1);
  // }
};

module.exports = {
  pool,
  initializeDatabase,
};
