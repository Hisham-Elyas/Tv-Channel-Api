const fixturesService = require("../services/sportmonksService");

exports.getFixtures = async (req, res) => {
  try {
    const { date, timezone = "Asia/Riyadh" } = req.query;

    if (!date) {
      return res.status(400).json({
        error: "❌ 'date' query parameter is required in format YYYY-MM-DD.",
      });
    }

    const data = await fixturesService.getFixturesByDate(date, timezone);

    // Optional: Fallback if no matches found but API doesn't throw
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
      return res.status(204).json({ message: err.message });
    }

    console.error("❌", err.message);
    res.status(500).json({ error: "Something went wrong." });
  }
};

exports.getFixtureById = async (req, res) => {
  try {
    const { id } = req.params;
    const { timezone = "Asia/Riyadh" } = req.query;

    if (!id) {
      return res.status(400).json({ error: "❌ Fixture ID is required." });
    }

    const data = await fixturesService.getFixtureById(id, timezone);

    if (!data?.data) {
      return res.status(404).json({ message: "⚠️ Fixture not found." });
    }
    const filtered = {
      data: data.data || [],
      timezone: data.timezone || "UTC",
    };

    // Return only main fixture data
    res.json(filtered);
  } catch (err) {
    console.error("❌ Error fetching fixture:", err.message);
    res.status(err.status || 500).json({ error: err.message });
  }
};
