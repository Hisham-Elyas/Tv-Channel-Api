const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const fs = require("fs");
const { pool } = require("./api/config/db");
async function insertMatches(matches) {
  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction(); // Start transaction on the same connection

    // Check if there is existing data
    const [rows] = await connection.query(
      "SELECT COUNT(*) as count FROM matches"
    );
    if (rows[0].count > 0) {
      console.log("Old data found. Deleting...");

      // Delete old matches and related channels
      await connection.query("DELETE FROM channels_of_matches"); // Channels depend on matches, so delete them first
      await connection.query("DELETE FROM matches");

      console.log("Old data deleted successfully!");
    } else {
      console.log("No old data found. Proceeding with insertion...");
    }

    // Insert new matches
    for (const [index, match] of matches.entries()) {
      console.log(
        `Inserting match ${index + 1} of ${matches.length}: ${
          match.homeTeam
        } vs ${match.awayTeam}`
      );
      // Insert match data into `matches` table
      const [matchResult] = await connection.query(
        `INSERT INTO \`matches\` (league, leagueLogo, homeTeam, awayTeam, homeTeamLogo, awayTeamLogo, time, matchTime, matchDate)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          match.league,
          match.leagueLogo,
          match.homeTeam,
          match.awayTeam,
          match.homeTeamLogo,
          match.awayTeamLogo,
          match.time,
          match.matchTime,
          match.matchDate,
        ]
      );

      const matchId = matchResult.insertId; // Get the inserted match ID

      // Insert channels if they exist
      for (const channel of match.channelsAndCommentators) {
        await connection.query(
          `INSERT INTO \`channels_of_matches\` (match_id, channel, commentator) VALUES (?, ?, ?)`,
          [matchId, channel.Channel, channel.Commentator]
        );
      }
    }
    await connection.commit();
    console.log("✅ Matchs Data inserted successfully!");
  } catch (error) {
    console.error("❌ Error inserting data:", error);
  }
}
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
// Enable stealth plugin
puppeteer.use(StealthPlugin());
log = (message) => {
  const logMessage = `${new Date().toISOString()} - ${message}\n`;
  // fs.appendFileSync("./api/Logs/log.txt", logMessage);
  console.log(logMessage); // Optional: Log to console
};
exports.log = (message) => {
  const logMessage = `${new Date().toISOString()} - ${message}\n`;
  // fs.appendFileSync("./api/Logs/log.txt", logMessage);
  console.log(logMessage); // Optional: Log to console
};

// Configure realistic user agents
const userAgents = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36 Edg/121.0.0.0",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_3) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15",
  "Mozilla/5.0 (X11; Linux x86_64; rv:122.0) Gecko/20100101 Firefox/122.0",
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1",
];

// Utility functions

function addHour(timeStr) {
  // Validate time format and values
  // console.log(timeStr);
  const match = timeStr.match(/^(\d{1,2}):(\d{2})\s*(am|pm)$/i);
  // if (!match) throw new Error("Invalid time format");
  if (!match) return timeStr;

  const [_, hours, minutes, period] = match;
  const hoursInt = parseInt(hours, 10);
  const minutesInt = parseInt(minutes, 10);

  if (hoursInt < 1 || hoursInt > 12 || minutesInt < 0 || minutesInt > 59) {
    return timeStr;
  }

  // Convert to 24-hour format
  let hours24 = hoursInt;
  if (period.toLowerCase() === "pm" && hours24 !== 12) {
    hours24 += 12;
  } else if (period.toLowerCase() === "am" && hours24 === 12) {
    hours24 = 0;
  }

  // Add 1 hour
  const date = new Date(1970, 0, 1, hours24, minutesInt);
  date.setHours(date.getHours() + 1);

  // Convert back to 12-hour format
  const newHours24 = date.getHours();
  const newMinutes = date.getMinutes().toString().padStart(2, "0");
  const newPeriod = newHours24 >= 12 ? "PM" : "AM";
  let newHours12 = newHours24 % 12;
  newHours12 = newHours12 === 0 ? 12 : newHours12;

  return `${newHours12}:${newMinutes} ${newPeriod}`;
}

const filterMatches = (matchlist) => {
  // const inputFilePath = "matches.json"; // Input file with all matches
  // const outputFilePath = "filter_matches.json"; // Filtered matches output file

  try {
    // Read the input JSON file
    // const data = fs.readFileSync(inputFilePath, "utf-8");
    // const matches = JSON.parse(data);
    const matches = matchlist;

    // Filter matches
    const filteredMatches = matches.map((match) => {
      // Extract Match Info details
      const matchTime = addHour(
        match.details?.matchInfo.find((info) => info.title === "Match Time")
          ?.content || "N/A"
      );
      // const matchTime =
      //   match.details?.matchInfo.find((info) => info.title === "Match Time")
      //     ?.content || "N/A";
      const matchDate =
        match.details?.matchInfo.find((info) => info.title === "Match Date")
          ?.content || "N/A";

      // Filter and map channels and commentators
      let channelsAndCommentators = [];
      channelsAndCommentators =
        match.details?.matchInfo
          .filter(
            (info) => info.title === "Channel" || info.title === "Commentator"
          )
          .map((info) => {
            if (info.title === "Channel") {
              return { Channel: info.content };
            }
            if (info.title === "Commentator") {
              return { Commentator: info.content };
            }
          }) || [];

      // Fallback to matchInfo if no valid channels or commentators in channelsAndCommentators
      if (!channelsAndCommentators || channelsAndCommentators.length === 0) {
        match.details?.channelsAndCommentators.forEach((entry) => {
          const { channel, commentator } = entry;
          if (channel) {
            channelsAndCommentators.push({ Channel: channel });
          }
          if (commentator) {
            channelsAndCommentators.push({ Commentator: commentator });
          }
        });
      }

      const mergeChannelsAndCommentators = (channelsAndCommentators) => {
        const merged = [];
        for (let i = 0; i < channelsAndCommentators.length; i += 2) {
          const channelObj = channelsAndCommentators[i];
          const commentatorObj = channelsAndCommentators[i + 1];

          if (channelObj?.Channel && commentatorObj?.Commentator) {
            merged.push({
              Channel: channelObj.Channel,
              Commentator: commentatorObj.Commentator,
            });
          }
        }
        return merged.slice(0, 2);
      };
      channelsAndCommentators = mergeChannelsAndCommentators(
        channelsAndCommentators
      );
      // channelsAndCommentators =
      //   channelsAndCommentators.Channel === "Referee"
      //     ? []
      //     : channelsAndCommentators;
      // const timeplusOneh = addOneHour(matchTime);
      // Return the filtered match structure
      return {
        league: match.league,
        leagueLogo: match.leagueLogo,
        homeTeam: match.homeTeam,
        awayTeam: match.awayTeam,
        homeTeamLogo: match.homeTeamLogo,
        awayTeamLogo: match.awayTeamLogo,
        time: match.time,
        matchTime,
        matchDate,

        channelsAndCommentators,
      };
    });

    // Save filtered matches to a new file
    // fs.writeFileSync(
    //   outputFilePath,
    //   JSON.stringify(filteredMatches, null, 2),
    //   "utf-8"
    // );
    insertMatches(filteredMatches);
    // console.log(`Filtered matches saved to ${outputFilePath}`);
    // log(`Filtered matches saved to ${outputFilePath}`);
  } catch (error) {
    console.error("Error processing matches:", error.message || error);
    log(`Error processing matches:${error.message} || ${error}`);
  }
};

exports.scrapeTodayMatches = async (dayes) => {
  log("Script executed successfully!");
  const startTime = new Date();
  const browser = await puppeteer.launch({
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage", // Add this for better memory management
      "--disable-gpu",
    ],
    headless: "new",
  });
  console.log(`Browser launched at: ${startTime.toISOString()}`);
  const page = await browser.newPage();

  try {
    // await page.setUserAgent(
    //   "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    // );
    await page.setUserAgent(
      userAgents[Math.floor(Math.random() * userAgents.length)]
    );
    await page.goto("https://www.ysscores.com/en/today_matches", {
      waitUntil: "networkidle2",
      timeout: 30000,
      referer: "https://www.google.com/",
    });

    // Extract matches
    const days = dayes > 0 ? dayes : 1; // Ensure at least 1 day;
    let matches = [];
    let allmatches = [];
    for (let i = 0; i < days; i++) {
      await page.waitForSelector(".matches-wrapper", { timeout: 60000 });
      // await page.screenshot({
      //   path: `${Date.now()}_${i + 1}days.png`,
      //   fullPage: true,
      // });
      matches = await page.evaluate(() => {
        const baseURL = "https://www.ysscores.com";
        return (
          Array.from(document.querySelectorAll(".matches-wrapper"))
            // .slice(0, 1) // for test 2 matches only
            .flatMap((championship) => {
              const leagueName =
                championship
                  .querySelector(".champ-title b")
                  ?.textContent.trim() || "Unknown League";
              const leagueNameLogo =
                championship.querySelector(".champ-title img")?.src ||
                "No Logo";
              const matchItems = Array.from(
                championship.querySelectorAll(".ajax-match-item")
              );

              return matchItems.map((match) => ({
                matchLink: match.getAttribute("href") || "No Link",
                league: leagueName,
                leagueLogo: leagueNameLogo,
                homeTeam:
                  match.querySelector(".first-team b")?.textContent.trim() ||
                  "Unknown Team",
                awayTeam:
                  match.querySelector(".second-team b")?.textContent.trim() ||
                  "Unknown Team",
                awayTeamLogo:
                  match.querySelector(".second-team img")?.src || "No Logo",
                homeTeamLogo:
                  match.querySelector(".first-team img")?.src || "No Logo",
                time:
                  match.querySelector(".match-date")?.textContent.trim() ||
                  "Time not available",
              }));
            })
        );
      });
      allmatches = allmatches.concat(matches);
      // console.log(
      //   `Scraped ${matches.length} matches. Starting detailed scraping...`
      // );
      // log(`Scraped ${allmatches.length} matches. Starting detailed scraping...`);

      console.log(`Scraped ${matches.length} matches for day ${i + 1}`);

      // allMatches.push(matches);
      if (i < days - 1) {
        // Click "Next Date" for the next day
        // console.log(`Clicking next date button for day ${days - 1}`);
        try {
          // await page.screenshot({
          //   path: `${Date.now()}_${i}days.png`,
          //   fullPage: true,
          // });
          await page.waitForSelector(".next-date.date-next-prev.date_c", {
            visible: true,
            timeout: 15000,
          });
          // await page.evaluate(() => {
          //   const button = document.querySelector(
          //     ".next-date.date-next-prev.date_c"
          //   );
          //   if (button) {
          //     button.click();
          //   }
          // });
          await page.$eval(".next-date.date-next-prev.date_c", (el) =>
            el.click()
          );

          // page.click(".next-date.date-next-prev.date_c"),
          // await delay(10000);
          // await page.click(".next-date.date-next-prev.date_c");
          await delay(5000); // Additional safety delay
          const elementExists = await page.$(
            ".next-date.date-next-prev.date_c"
          );
          console.log("Element exists:", !!elementExists); // Debug output
          await page.waitForSelector(".matches-wrapper", { timeout: 60000 });
          // await page.screenshot({
          //   path: `${Date.now()}_${i + 1}days.png`,
          //   fullPage: true,
          // });
          // await page.waitForTimeout(3000); // Wait for new data to load
        } catch (error) {
          console.error("Error clicking next date button:", error);
          // log(`Error clicking next date button: ${error}`);
        }
      }
    }
    // console.log(`allMatches.length}: ${allMatches.length}`);
    console.log(`all_matches ${allmatches.length} matches `);
    for (const [index, match] of allmatches.entries()) {
      if (!match.matchLink) {
        console.log(
          `Skipping match with no link: ${match.homeTeam} vs ${match.awayTeam}`
        );
        // log(
        //   `Skipping match with no link: ${match.homeTeam} vs ${match.awayTeam}`
        // );
        continue;
      }

      try {
        console.log(`Processing match ${index + 1}/${allmatches.length}`);
        // log(`Processing match ${index + 1}/${allMatches.length}`);
        await page.goto(match.matchLink, {
          waitUntil: "networkidle2",
          timeout: 30000,
        });
        // await page.screenshot({
        //   path: `${Date.now()}_error.png`,
        //   fullPage: true,
        // });
        // Scrape detailed match info
        const matchDetails = await page.evaluate(() => {
          // Extract all key-value pairs from "Match Info"
          const matchInfo = Array.from(
            document.querySelectorAll(".match-info-item") // match-info-item
          ).map((info) => ({
            title: info.querySelector(".title")?.textContent.trim() || "N/A",
            content:
              info.querySelector(".content")?.textContent.trim() || "N/A",
          }));

          // Extract all channels and commentators
          const channelsAndCommentators = Array.from(
            document.querySelectorAll(".match-info-item.sub")
          ).map((item) => ({
            channel:
              item.querySelector(".title")?.textContent.trim() ||
              "Channel not available",
            commentator:
              item.querySelector(".content a")?.textContent.trim() ||
              "Commentator not available",
          }));

          return {
            matchInfo,
            channelsAndCommentators,
          };
        });

        match.details = matchDetails;
      } catch (error) {
        console.error(`Error scraping details for ${match.matchLink}:`, error);
        log(`Error scraping details for ${match.matchLink}: ${error}`);
        match.details = { error: "Failed to retrieve details" };
      }
    }

    // console.log("Detailed Matches:");
    // matches.forEach((match) => {
    //   console.log(`Match: ${match.homeTeam} vs ${match.awayTeam}`);
    //   console.log(`League: ${match.league}`);
    //   console.log("Match Info:");
    //   (match.details?.matchInfo || []).forEach((info) =>
    //     console.log(`  ${info.title}: ${info.content}`)
    //   );
    //   console.log("Channels and Commentators:");
    //   (match.details?.channelsAndCommentators || []).forEach((info) => {
    //     console.log(
    //       `  Channel: ${info.channel}, Commentator: ${info.commentator}`
    //     );
    //   });
    //   console.log("====================================");
    // });

    // Save the data to a JSON file

    // const filePath = "matches.json";
    // fs.writeFileSync(filePath, JSON.stringify(allmatches, null, 2), "utf-8");
    // console.log("Data saved to matches.json");
    // log("Data saved to matches.json");

    // Run the filter function
    filterMatches(allmatches);
  } catch (error) {
    console.error("Error scraping matches:", error);
    log(`Error scraping matches:${error}`);
  } finally {
    await browser.close();
  }
};
// scrapeMatches();
// filterMatches();
// scrapeTodayMatches(2);
