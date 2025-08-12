const fixturesService = require("../services/sportmonksService");

exports.getFixtures = async (req, res) => {
  try {
    const { date, timezone = "Asia/Riyadh", locale = "en" } = req.query;

    if (!date) {
      return res.status(400).json({
        error: "❌ 'date' query parameter is required in format YYYY-MM-DD.",
      });
    }

    const data = await fixturesService.getFixturesByDate(
      date,
      timezone,
      locale
    );

    if (!data?.data || (Array.isArray(data.data) && data.data.length === 0)) {
      return res
        .status(204)
        .json({ message: "⚠️ No matches found for this date." });
    }
    const filtered = {
      data: data.data || [],
      pagination: data.pagination || {},
      timezone: data.timezone || "UTC",
    };

    res.json(filtered);
  } catch (err) {
    if (err.status === 204) {
      return res
        .status(204)
        .json({ message: "⚠️ No matches found for this date." });
    }

    console.error("❌", err.message);
    res.status(500).json({ error: "Something went wrong." });
  }
};

exports.getFixtureById = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      timezone = "Asia/Riyadh",
      locale = "en",
      channel_commm_id,
    } = req.query;

    if (!id) {
      return res.status(400).json({ error: "❌ Fixture ID is required." });
    }

    const data = await fixturesService.getFixtureById(
      id,
      channel_commm_id,
      timezone,
      locale
    );

    if (!data?.data) {
      return res.status(404).json({ message: "⚠️ Fixture not found." });
    }
    const filtered = {
      data: data.data || [],
      timezone: data.timezone || "UTC",
    };

    res.json(filtered);
  } catch (err) {
    console.error("❌ Error fetching fixture:", err.message);
    res.status(err.status || 500).json({ error: err.message });
  }
};

exports.getTeamMatches = async (req, res) => {
  try {
    const { id } = req.params;
    const { timezone = "Asia/Riyadh", locale = "en" } = req.query;

    if (!id) {
      return res.status(400).json({ error: "❌ Team ID is required." });
    }

    const response = await fixturesService.getTeamMatches(id, timezone, locale);

    const { data, timezone: tz } = response || {};
    if (!data) {
      return res.status(404).json({ error: "⚠️ Team not found or empty." });
    }

    res.json({
      data,
      timezone: tz || "UTC",
    });
  } catch (err) {
    console.error("❌ Error fetching team matches:", err.message);
    res.status(err.status || 500).json({ error: err.message });
  }
};

exports.getStandingsBySeason = async (req, res) => {
  try {
    const { seasonId } = req.params;
    const { timezone = "Asia/Riyadh", locale = "en" } = req.query;

    if (!seasonId) {
      return res.status(400).json({ error: "❌ Season ID is required." });
    }

    const data = await fixturesService.getStandingsBySeason(
      seasonId,
      timezone,
      locale
    );

    const filtered = {
      data: data.data || [],
      timezone: data.timezone || "UTC",
    };

    res.json(filtered);
  } catch (err) {
    console.error("❌ Error fetching standings:", err.message);
    res.status(err.status || 500).json({ error: err.message });
  }
};

exports.getTopScorersBySeason = async (req, res) => {
  try {
    const { seasonId } = req.params;
    const {
      type = "goals",
      timezone = "Asia/Riyadh",
      locale = "en",
    } = req.query;

    if (!seasonId) {
      return res.status(400).json({ error: "❌ Season ID is required." });
    }

    const topScorerTypeMap = {
      goals: 208,
      assists: 209,
      yellowCards: 84,
      redCards: 83,
    };

    const typeId = topScorerTypeMap[type];
    if (!typeId) {
      return res.status(400).json({
        error:
          "❌ Invalid type. Use one of: goals, assists, yellowCards, redCards",
      });
    }

    const data = await fixturesService.getTopScorersBySeason(
      seasonId,
      typeId,
      timezone,
      locale
    );

    const filtered = {
      data: data.data || [],
      timezone: data.timezone || "UTC",
    };

    res.json(filtered);
  } catch (err) {
    console.error("❌ Error fetching top scorers:", err.message);
    res.status(err.status || 500).json({ error: err.message });
  }
};

exports.getLeagueMatches = async (req, res) => {
  try {
    const { id: leagueId } = req.params;
    const { timezone = "Asia/Riyadh", locale = "en" } = req.query;

    if (!leagueId) {
      return res.status(400).json({ error: "❌ League ID is required." });
    }

    const data = await fixturesService.getLeagueMatches(
      leagueId,
      timezone,
      locale
    );

    // if (!data?.data || (Array.isArray(data.data) && data.data.length === 0)) {
    //   return res.status(204).json({ message: "⚠️ No matches found for this league." });
    // }
    const filtered = {
      data: data.data || [],
      timezone: data.timezone || "UTC",
    };

    res.json(filtered);
  } catch (err) {
    console.error("❌ Error fetching league matches:", err.message);
    res.status(err.status || 500).json({ error: err.message });
  }
};
exports.getAllLeagues = async (req, res) => {
  try {
    const { timezone = "Asia/Riyadh", locale = "en" } = req.query;

    const data = await fixturesService.getAllLeagues(timezone, locale);

    if (!data?.data || (Array.isArray(data.data) && data.data.length === 0)) {
      return res.status(204).json({ message: "⚠️ No leagues found." });
    }
    const filtered = {
      data: data.data || [],
      timezone: data.timezone || "UTC",
    };

    res.json(filtered);
  } catch (err) {
    console.error("❌ Error fetching leagues:", err.message);
    res.status(err.status || 500).json({ error: err.message });
  }
};
