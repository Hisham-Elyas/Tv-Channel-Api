require("dotenv").config();
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const userRoutes = require("./api/routes/user");
const authRoutes = require("./api/routes/authRoutes");
const today_matchesRoutes = require("./api/routes/today_matches");
const groupRoutes = require("./api/routes/groupRoutes");
const channelRoutes = require("./api/routes/channelRoutes");
const streamRoutes = require("./api/routes/streamRoutes");
const categoryRoutes = require("./api/routes/categoryRoutes");
const fixturesRoutes = require("./api/routes/fixturesRoutes");

const settingsRoutes = require("./api/routes/settings");
const scrapeTodayMatches = require("./scrape");
const parseM3UtoJSONtoDB = require("./parseM3UtoJSONtoDB");
const cron = require("node-cron");
const path = require("path");

const helmet = require("helmet");
const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));
// Serve HLS output files
app.use("/output", express.static(path.join(__dirname, "output")));
// Routes
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Accept, Authorization"
  );
  if (req.method === "OPTIONS") {
    res.header("Access-Control-Allow-Methods", "PUT, POST, PATCH, DELETE, GET");
    return res.status(200).json({});
  }
  next();
});
// app.use("/api/stream", streamRoutes);
app.use("/api/auth", authRoutes);
// app.use("/api/users", userRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/groups", groupRoutes);
app.use("/api/channels", channelRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/today_matches", today_matchesRoutes);
// Routes
app.use("/api/stream", streamRoutes);

//==========================
app.use("/api/fixtures", fixturesRoutes);
//==========================

// Function to modify the IPTV URL
function modifyIPTVUrl(originalUrl, newHost, newUser, newPass) {
  let parts = originalUrl.split("/");
  if (parts.length < 5) return originalUrl; // Keep original if format is incorrect

  parts[2] = newHost; // Update Host
  parts[3] = newUser; // Update Username
  parts[4] = newPass; // Update Password

  return parts.join("/");
}

// API to update channels in batches
app.post("api/update-channels", async (req, res) => {
  const { newHost, newUser, newPass } = req.body;
  const batchSize = 100; // Update 100 rows per batch

  if (!newHost || !newUser || !newPass) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  let connection;

  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    // Get total count of channels
    const [countResult] = await connection.execute(
      "SELECT COUNT(*) AS total FROM channels"
    );
    const totalChannels = countResult[0].total;
    console.log(`Total Channels: ${totalChannels}`);

    let updatedCount = 0;
    for (let offset = 0; offset < totalChannels; offset += batchSize) {
      console.log(`Processing batch: ${offset} - ${offset + batchSize}`);

      // Fetch 100 channels at a time
      const [channels] = await connection.execute(
        `SELECT id, url FROM channels ORDER BY id LIMIT ? OFFSET ?`,
        [batchSize, offset]
      );

      if (channels.length === 0) break; // No more data

      // Prepare batch updates
      for (let channel of channels) {
        let newUrl = modifyIPTVUrl(channel.url, newHost, newUser, newPass);
        await connection.execute("UPDATE channels SET url = ? WHERE id = ?", [
          newUrl,
          channel.id,
        ]);
      }

      updatedCount += channels.length;
      console.log(`Updated: ${updatedCount}/${totalChannels}`);

      // Commit after each batch
      await connection.commit();
    }

    res.json({ message: `Updated ${updatedCount} channels successfully` });
  } catch (error) {
    console.error("Error updating channels:", error);
    if (connection) await connection.rollback(); // Rollback on failure
    res.status(500).json({ message: "Server error", error });
  } finally {
    if (connection) connection.release(); // Release connection back to pool
  }
});

app.get("/api/run-script", (req, res) => {
  const { nextDaytoScrape = 1 } = req.body;
  scrapeTodayMatches.scrapeTodayMatches(nextDaytoScrape);
  res.json(
    "Script executed successfully! Next day to scrape: " + nextDaytoScrape
  );
});
app.get("/api/run-script-parse", (req, res) => {
  parseM3UtoJSONtoDB.parseM3UtoJSONtoDB();
  res.json("Script to parse M3U to JSON to DB executed successfully! ");
});
// app.get("/api/run-script/log", (req, res) => {
//   const filePath = path.join(__dirname, "./api/Logs/log.txt");

//   // try {
//   console.log(filePath);

//   // Read the Log file after scraping
//   fs.readFile(filePath, "utf-8", (err, data) => {
//     if (err) {
//       console.error("Error reading file:", err);
//       return res.status(500).json({ error: "Failed to read the file" });
//     }

//     try {
//       res.send(data);
//     } catch (parseErr) {
//       console.error("Error parsing JSON:", parseErr);
//       res.status(500).json({ error: "Invalid JSON format in the file" });
//     }
//   });
// });
// API Documentation Route
app.get("/", (req, res) => {
  const documentation = {
    message: "Welcome to the TV API",
    endpoints: [
      {
        method: "POST",
        path: "/api/users/register",
        description: "Create new user",
        body: {
          username: "string",
          email: "string",
          password: "string",
          phone: "string",
        },
      },
      {
        method: "POST",
        path: "/api/auth/login",
        description: "User login",
        body: {
          email: "string",
          password: "string",
        },
      },
      // {
      //   method: "DELETE",
      //   path: "/api/users/delete",
      //   description: "Delete user account",
      //   headers: {
      //     Authorization: "Bearer <token>",
      //   },
      // },
      {
        method: "GET",
        path: "/api/today_matches",
        description: "Get today's matches",
      },
    ],
    note: "All other endpoints will redirect here",
  };
  res.json(documentation);
});
// Return documentation with 404 status
app.use((req, res) => {
  res.status(404).json({
    error: "Endpoint not found",

    availableEndpoints: [
      "/api/auth/register",
      "/api/auth/login",
      "/api/today_matches",
    ],
  });
});
app.use((error, req, res, next) => {
  res.status(error.status || 500);
  res.json({
    error: {
      message: error.message,
    },
  });
});

// Database connection
const db = require("./api/config/db");

const { loadIPTVConfig } = require("./api/config/config");
// db.initializeDatabase();
// loadIPTVConfig();
// scrapeTodayMatches();

cron.schedule(
  "2 21 * * *", // Runs at 21:00 UTC (which is 00:20 in Riyadh)
  async () => {
    try {
      console.log(
        `Runs at 21:00 UTC (which is 00:20 in Riyadh timezone: Asia/Riyadh`
      );
      console.log(`Script schedule running at: ${new Date().toISOString()}`);
      await scrapeTodayMatches.scrapeTodayMatches(1);
      console.log("Scraping completed successfully.");
    } catch (error) {
      console.error("Error occurred in scheduled task:", error);
    }
  },
  {
    timezone: "Asia/Riyadh",
  }
);

cron.schedule(
  "0 0 * * *", // Runs every day at 00:00 UTC
  async () => {
    try {
      console.log(`Runs every day at 00:00 UTC     timezone: -Etc/UTC`);
      console.log(`Script schedule running at: ${new Date().toISOString()}`);
      await scrapeTodayMatches.scrapeTodayMatches(1);
      console.log("Scraping completed successfully.");
    } catch (error) {
      console.error("Error occurred in scheduled task:", error);
    }
  },
  {
    timezone: "Etc/UTC", // ✅ Ensure it's running in UTC
  }
);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server api  running on http://172.105.81.117:${PORT}`);
});
