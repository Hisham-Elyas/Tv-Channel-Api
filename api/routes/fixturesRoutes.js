const express = require("express");
const router = express.Router();
const fixturesController = require("../controller/fixturesController");

router.get("/leagues", fixturesController.getAllLeagues);
// Fetch all leagues with current season details.
// GET /api/fixtures/leagues?timezone=Africa/Khartoum

router.get("/league/:id/matches", fixturesController.getLeagueMatches);
// Fetch upcoming and latest matches for a specific league.
// GET /api/fixtures/league/2/matches?timezone=Africa/Khartoum
router.get("/calendar", fixturesController.getFixtures);
// Fetch matches by date.
// GET /api/fixtures/calendar?date=2025-08-15&timezone=Africa/Khartoum

router.get("/:id", fixturesController.getFixtureById);
// Fetch full details for a single fixture (match).
// GET /api/fixtures/19439255?timezone=Africa/Khartoum

router.get("/team/:id/matches", fixturesController.getTeamMatches);
// Fetch a team's latest & upcoming matches.
// GET /api/fixtures/team/8/matches?timezone=Africa/Khartoum

router.get("/standings/:seasonId", fixturesController.getStandingsBySeason);
// Get standings for a specific season.
// GET /api/fixtures/standings/25583?timezone=Africa/Khartoum

router.get("/topscorers/:seasonId", fixturesController.getTopScorersBySeason);
// Fetch top scorers (goals, assists, yellow/red cards) by season.
// GET /api/fixtures/topscorers/23614?type=goals
// GET /api/fixtures/topscorers/23614?type=assists
// GET /api/fixtures/topscorers/23614?type=yellowCards
// GET /api/fixtures/topscorers/23614?type=redCards

module.exports = router;
