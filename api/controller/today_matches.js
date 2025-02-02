const path = require("path");
const fs = require("fs");
const { pool } = require("../config/db");

exports.get_all_matches = async (req, res) => {
  try {
    // Fetch matches
    const [matches] = await pool.execute("SELECT * FROM matches");

    // Fetch channels for all matches
    const [channels] = await pool.execute("SELECT * FROM filteredLeaguesList");

    // Map channels to their respective matches
    const matchesWithChannels = matches.map((match) => {
      match.channelsAndCommentators = channels
        .filter((channel) => channel.match_id === match.id)
        .map((channel) => ({
          Channel: channel.channel,
          Commentator: channel.commentator,
        }));
      return match;
    });

    // Return matches with their channels
    res.json(matchesWithChannels);
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({ error: "Failed to fetch matches from database" });
  }
};
exports.get_all_matches_from_file = async (req, res, next) => {
  const filePath = path.join(__dirname, "../../filter_matches.json");

  // try {

  // Read the JSON file after scraping
  fs.readFile(filePath, "utf-8", (err, data) => {
    if (err) {
      console.error("Error reading file:", err);
      return res.status(500).json({ error: "Failed to read the file" });
    }

    try {
      // Parse the JSON data and send it as the response
      const jsonData = JSON.parse(data);
      res.json(jsonData);
    } catch (parseErr) {
      console.error("Error parsing JSON:", parseErr);
      res.status(500).json({ error: "Invalid JSON format in the file" });
    }
  });
  // } catch (scrapeErr) {
  //   // Read the JSON file after scraping
  //   fs.readFile(filePath, "utf-8", (err, data) => {
  //     if (err) {
  //       console.error("Error reading file:", err);
  //       return res.status(500).json({ error: "Failed to read the file" });
  //     }

  //     try {
  //       // Parse the JSON data and send it as the response
  //       const jsonData = JSON.parse(data);
  //       res.json(jsonData);
  //     } catch (parseErr) {
  //       console.error("Error parsing JSON:", parseErr);
  //       res.status(500).json({ error: "Invalid JSON format in the file" });
  //     }
  //   });
  // console.error("Error during scraping:", scrapeErr);
  // res.status(500).json({ error: "Failed to scrape matches" });
  // }
};
