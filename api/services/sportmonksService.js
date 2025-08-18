const axios = require("axios");
const dayjs = require("dayjs");
const Fuse = require("fuse.js");
const utc = require("dayjs/plugin/utc");
const timezone = require("dayjs/plugin/timezone");
const cache = require("../config/cache");
const { calculateTTL } = require("../utils/timeUtil");
const { pool } = require("../config/db");
require("dotenv").config();

dayjs.extend(utc);
dayjs.extend(timezone);

const API_TOKEN = process.env.API_TOKEN;
const api1Url = (date) =>
  `https://api-en.ysscores.com/api/matches/matches_date_get/${date}/["90322", "58234", "83188", "482176", "639187", "425169", "128170", "884138", "475137", "38371", "37399", "334157", "91130", "30067", "26232", "41480", "75166", "13178", "970117", "573139", "474185", "47037", "47821", "79123", "901130", "610129", "94164", "41019"]/L/120`;

async function getMatchesApi1(date, tz = "Asia/Riyadh") {
  const cacheKey = `api1:${date}`;
  const cached = cache.get(cacheKey);
  if (cached) {
    console.log("✅ Served from cache");
    return cached;
  }

  try {
    const response = await axios.get(api1Url(date));
    const data = response.data;
    const matches = data.data.map((match) => ({
      matchName: `${match.home_team.title} vs ${match.away_team.title}`,
      matchId: match.match_id,
    }));

    const ttl = 30 * 24 * 60 * 60 * 1000;
    cache.set(cacheKey, matches, ttl);

    return matches;
  } catch (error) {
    console.error("Error fetching API 1:", error);
    return [];
  }
}
async function getChannelComm(matchId, locale = "en") {
  const cacheKey = `channelComm:${matchId}:${locale}`;
  const cached = cache.get(cacheKey);
  if (cached) {
    console.log("✅ Channel comm data served from cache");
    return cached;
  }

  // Determine the appropriate base URL based on locale
  let baseUrl;
  if (locale === "ar") {
    baseUrl = "https://api-ar.ysscores.com";
  } else {
    baseUrl = "https://api-en.ysscores.com";
  }

  const url = `${baseUrl}/api/matches/match_info/${matchId}`;

  try {
    const response = await axios.get(url);
    const data = response.data;
    const channelCommData = data.data ? data.data.channel_commm || [] : [];
    const ttl = 30 * 24 * 60 * 60 * 1000;

    cache.set(cacheKey, channelCommData, ttl);
    return channelCommData;
  } catch (error) {
    console.error(
      `Error fetching channel comm data for match ${matchId}:`,
      error
    );
    return [];
  }
}

async function searchChannelsByName(channelNames) {
  try {
    // Step 1: Get all AR| channels from 'channels' table
    const [allChannels] = await pool.query(`
      SELECT c.*, g.group_title
      FROM channels c
      JOIN \`groups\` g ON c.group_id = g.id
      WHERE g.group_title LIKE 'AR|%'
    `);

    // Step 2: Set up Fuse.js for fuzzy searching
    const fuse = new Fuse(allChannels, {
      keys: ["name", "tvg_name"],
      threshold: 0.24,
    });

    // Step 3: Search for each channel name provided
    const searchResultsByChannel = [];

    for (const channelName of channelNames) {
      const searchResults = fuse.search(channelName).map((res) => res.item);

      console.log(
        `🔍 Searching for: "${channelName}" ➜ Found: ${searchResults.length}`
      );

      searchResultsByChannel.push({
        search: channelName,
        results: searchResults,
      });
    }

    return searchResultsByChannel;
  } catch (error) {
    console.error("❌ Error:", error.message);
    throw error;
  }
}

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

  // Fetch matches from API 1 for fuzzy matching
  const api1Matches = await getMatchesApi1(date);
  const fuse = new Fuse(api1Matches, { keys: ["matchName"], threshold: 0.3 });

  // Enrich the matches in API 2 response with the match ID from API 1
  data.data.forEach((dayData) => {
    dayData.today.forEach((match) => {
      const results = fuse.search(match.name);
      if (results.length > 0) {
        match.channel_commm_id = results[0].item.matchId;
        // console.log(
        //   `Added channel_commm_id for match: ${match.name}, ID: ${results[0].item.matchId}`
        // );
      } else {
        match.channel_commm_id = 0;
      }
    });
  });

  const ttl = calculateTTL(date, tz); // Make sure calculateTTL is defined in your environment
  cache.set(cacheKey, data, ttl);

  return data;
};

exports.getFixtureById = async (
  fixtureId,
  channel_commm_id,
  tz = "Asia/Riyadh",
  locale = "en"
) => {
  if (!fixtureId) throw new Error("❌ Fixture ID is required.");
  if (!channel_commm_id) throw new Error("❌ channel_commm_id ID is required.");

  const cacheKey = `fixture:${fixtureId}:${tz}:${locale}`;
  const cached = cache.get(cacheKey);
  if (cached) {
    console.log("✅ Fixture served from cache");
    return cached;
  }

  const url = `https://api.sportmonks.com/v3/football/fixtures/${fixtureId}?api_token=${API_TOKEN}&include=participants;league;venue;state;scores;events.type;events.period;events.player;statistics.type;sidelined.sideline.player;sidelined.sideline.type;weatherReport&timezone=${tz}&locale=${locale}`;
  const response = await axios.get(url);
  const data = response.data;

  if (!data || !data.data) {
    const error = new Error("⚠️ Fixture not found.");
    error.status = 404;
    throw error;
  }

  // Fetch channel commentary info and enrich the data
  const channelCommData = await getChannelComm(channel_commm_id);

  // ** Extract channel names and perform the search **
  const channelNames = channelCommData.map((entry) => entry.channel_name);
  const tv_channel_link = await searchChannelsByName(channelNames);

  // ** Add the search results to each channel entry **
  channelCommData.forEach((entry, index) => {
    entry.tv_channel_link = tv_channel_link[index]?.results || [];
    // console.log(`${searchResults[index].tvg_name}`);
    // console.log(`${searchResults[index].name}`);
  });

  data.data.channel_commm = channelCommData;
  data.data.channel_commm_id = channel_commm_id;

  // Determine TTL (short if live or today, longer if old match)
  const fixtureDate = data.data.starting_at;
  const ttl = calculateTTL(fixtureDate, tz);
  cache.set(cacheKey, data, ttl);

  return data;
};
// exports.getFixturesByDate = async (date, tz = "Asia/Riyadh", locale = "en") => {
//   if (!date) {
//     throw new Error("❌ Date is required in format YYYY-MM-DD.");
//   }

//   const cacheKey = `calendar:${date}:${tz}:${locale}`;
//   const cached = cache.get(cacheKey);
//   if (cached) {
//     console.log("✅ Served from cache");
//     return cached;
//   }

//   const url = `https://api.sportmonks.com/v3/football/leagues/date/${date}?include=today.scores;today.participants;today.stage;today.group;today.round&timezone=${tz}&locale=${locale}&api_token=${API_TOKEN}`;
//   const response = await axios.get(url);
//   const data = response.data;

//   if (data.message?.includes("No result")) {
//     const error = new Error("⚠️ No matches found for this date.");
//     error.status = 204;
//     throw error;
//   }

//   const ttl = calculateTTL(date, tz);
//   cache.set(cacheKey, data, ttl);

//   return data;
// };
// exports.getFixtureById = async (
//   fixtureId,
//   tz = "Asia/Riyadh",
//   locale = "en"
// ) => {
//   if (!fixtureId) throw new Error("❌ Fixture ID is required.");

//   const cacheKey = `fixture:${fixtureId}:${tz}:${locale}`;
//   const cached = cache.get(cacheKey);
//   if (cached) {
//     console.log("✅ Fixture served from cache");
//     return cached;
//   }

//   // console.log("🌐 Fetching fixture from API");
//   const url = `https://api.sportmonks.com/v3/football/fixtures/${fixtureId}?api_token=${API_TOKEN}&include=participants;league;venue;state;scores;events.type;events.period;events.player;statistics.type;sidelined.sideline.player;sidelined.sideline.type;weatherReport&timezone=${tz}&locale=${locale}`;
//   const response = await axios.get(url);
//   const data = response.data;

//   if (!data || !data.data) {
//     const error = new Error("⚠️ Fixture not found.");
//     error.status = 404;
//     throw error;
//   }

//   // Determine TTL (short if live or today, longer if old match)
//   const fixtureDate = data.data.starting_at;
//   const ttl = calculateTTL(fixtureDate, tz);
//   cache.set(cacheKey, data, ttl);

//   return data;
// };
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

exports.getAllLeagues = async (tz = "Asia/Riyadh", locale = "en") => {
  const cacheKey = `leagues:${tz}:${locale}`;
  const cached = cache.get(cacheKey);
  if (cached) {
    console.log("✅ Leagues data served from cache");
    return cached;
  }

  const url = `https://api.sportmonks.com/v3/football/leagues?api_token=${API_TOKEN}&include=currentSeason&timezone=${tz}&locale=${locale}`;

  try {
    const response = await axios.get(url);
    const data = response.data;

    if (!data || !data.data) {
      const error = new Error("⚠️ Leagues not found.");
      error.status = 404;
      throw error;
    }

    // Cache for 1 day
    const ttl = 24 * 60 * 60;
    cache.set(cacheKey, data, ttl);

    return data;
  } catch (error) {
    console.error("❌ Error fetching leagues data:", error);
    throw error;
  }
};

exports.getLeagueMatches = async (
  leagueId,
  tz = "Asia/Riyadh",
  locale = "en"
) => {
  if (!leagueId) throw new Error("❌ League ID is required.");

  const cacheKey = `leagueMatches:${leagueId}:${tz}:${locale}`;
  const cached = cache.get(cacheKey);
  if (cached) {
    console.log("✅ League matches data served from cache");
    return cached;
  }

  const url = `https://api.sportmonks.com/v3/football/leagues/${leagueId}?api_token=${API_TOKEN}&include=upcoming.participants;latest.participants;upcoming.round;latest.round;latest.scores&timezone=${tz}&locale=${locale}`;

  try {
    const response = await axios.get(url);
    const data = response.data;

    if (!data || !data.data) {
      const error = new Error("⚠️ League matches not found.");
      error.status = 404;
      throw error;
    }

    // Cache for 1 hour
    const ttl = 60 * 60;
    cache.set(cacheKey, data, ttl);

    return data;
  } catch (error) {
    console.error("❌ Error fetching league matches data:", error);
    throw error;
  }
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
