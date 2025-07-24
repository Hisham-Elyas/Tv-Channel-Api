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

exports.getFixturesByDate = async (date, tz = "Asia/Riyadh", locale = "en") => {
  if (!date) {
    throw new Error("❌ Date is required in format YYYY-MM-DD.");
  }

  const cacheKey = `calendar:${date}:${tz}:${locale}`;
  const cached = cache.get(cacheKey);
  if (cached) {
    console.log("✅ Served from cache");
    return cached;
  }

  const url = `https://api.sportmonks.com/v3/football/leagues/date/${date}?include=today.scores;today.participants;today.stage;today.group;today.round&timezone=${tz}&locale=${locale}&api_token=${API_TOKEN}`;
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
exports.getFixtureById = async (
  fixtureId,
  tz = "Asia/Riyadh",
  locale = "en"
) => {
  if (!fixtureId) throw new Error("❌ Fixture ID is required.");

  const cacheKey = `fixture:${fixtureId}:${tz}:${locale}`;
  const cached = cache.get(cacheKey);
  if (cached) {
    console.log("✅ Fixture served from cache");
    return cached;
  }

  // console.log("🌐 Fetching fixture from API");
  const url = `https://api.sportmonks.com/v3/football/fixtures/${fixtureId}?api_token=${API_TOKEN}&include=participants;league;venue;state;scores;events.type;events.period;events.player;statistics.type;sidelined.sideline.player;sidelined.sideline.type;weatherReport&timezone=${tz}&locale=${locale}`;
  const response = await axios.get(url);
  const data = response.data;

  if (!data || !data.data) {
    const error = new Error("⚠️ Fixture not found.");
    error.status = 404;
    throw error;
  }

  // Determine TTL (short if live or today, longer if old match)
  const fixtureDate = data.data.starting_at;
  const ttl = calculateTTL(fixtureDate, tz);
  cache.set(cacheKey, data, ttl);

  return data;
};
exports.getTeamMatches = async (teamId, tz = "Asia/Riyadh", locale = "en") => {
  if (!teamId) throw new Error("❌ Team ID is required.");

  const cacheKey = `teamMatches:${teamId}:${tz}:${locale}`;
  const cached = cache.get(cacheKey);
  if (cached) {
    console.log("✅ Team matches served from cache");
    return cached;
  }

  const url = `https://api.sportmonks.com/v3/football/teams/${teamId}?include=upcoming.participants;upcoming.league;latest.participants;latest.scores;latest.league&timezone=${tz}&api_token=${API_TOKEN}&locale=${locale}`;
  const response = await axios.get(url);
  const data = response.data;

  if (!data || !data.data) {
    const error = new Error("⚠️ Team not found or no match data.");
    error.status = 404;
    throw error;
  }

  // Use short TTL (e.g., 30s) since this is recent/upcoming data
  const ttl = 30;
  cache.set(cacheKey, data, ttl);

  return data;
};
exports.getStandingsBySeason = async (
  seasonId,
  tz = "Asia/Riyadh",
  locale = "en"
) => {
  if (!seasonId) throw new Error("❌ Season ID is required.");

  const cacheKey = `standings:${seasonId}:${tz}:${locale}`;
  const cached = cache.get(cacheKey);
  if (cached) {
    console.log("✅ Standings served from cache");
    return cached;
  }

  const url = `https://api.sportmonks.com/v3/football/standings/seasons/${seasonId}?include=participant;rule.type;details.type;form;stage;league;group&api_token=${API_TOKEN}&timezone=${tz}&locale=${locale}`;
  const response = await axios.get(url);
  const data = response.data;
  // console.log(data);
  if (!data || !data.data) {
    const error = new Error("⚠️ Standings not found.");
    error.status = 404;
    throw error;
  }

  // Cache for 1 hour (can be increased depending on update frequency)
  const ttl = 60 * 60;
  cache.set(cacheKey, data, ttl);

  return data;
};
exports.getTopScorersBySeason = async (
  seasonId,
  type = 208,
  tz = "Asia/Riyadh",
  locale = "en"
) => {
  if (!seasonId) throw new Error("❌ Season ID is required.");

  const cacheKey = `topscorers:${seasonId}:${type}:${tz}:${locale}`;
  const cached = cache.get(cacheKey);
  if (cached) {
    console.log("✅ Top scorers served from cache");
    return cached;
  }

  const url = `https://api.sportmonks.com/v3/football/topscorers/seasons/${seasonId}?include=player.nationality;player.position;participant;type;season.league&filters=seasontopscorerTypes:${type}&api_token=${API_TOKEN}&timezone=${tz}&locale=${locale}`;

  const response = await axios.get(url);
  const data = response.data;

  if (!data || !data.data) {
    const error = new Error("⚠️ Top scorers not found.");
    error.status = 404;
    throw error;
  }

  // Cache for 1 hours
  const ttl = 60 * 60;
  cache.set(cacheKey, data, ttl);

  return data;
};
