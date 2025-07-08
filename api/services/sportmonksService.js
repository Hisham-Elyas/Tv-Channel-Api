const axios = require("axios");
const dayjs = require("dayjs");
const utc = require("dayjs/plugin/utc");
const timezone = require("dayjs/plugin/timezone");
const cache = require("../config/cache");
const { calculateTTL } = require("../utils/timeUtil");

dayjs.extend(utc);
dayjs.extend(timezone);

// const API_TOKEN = process.env.API_TOKEN;
const API_TOKEN =
  "tIjAU51bCJl6y715qf1LZ38brS1iW0bgWxn1EGMH1b3cWpVS19cERuAQg3L6";

exports.getFixturesByDate = async (date, tz = "Asia/Riyadh") => {
  if (!date) {
    throw new Error("❌ Date is required in format YYYY-MM-DD.");
  }

  const cacheKey = `calendar:${date}:${tz}`;
  const cached = cache.get(cacheKey);
  if (cached) {
    console.log("✅ Served from cache");
    return cached;
  } else {
    console.log("✅ Served from server");
  }

  const url = `https://api.sportmonks.com/v3/football/leagues/date/${date}?include=today.scores;today.participants;today.stage;today.group;today.round&timezone=${tz}&api_token=${API_TOKEN}`;
  const response = await axios.get(url);
  const data = response.data;

  if (data.message?.includes("No result")) {
    const error = new Error("⚠️ No matches found for this date.");
    error.status = 204;
    throw error;
  }

  const ttl = calculateTTL(date, tz);
  cache.set(cacheKey, data, ttl);

  return data;
};
