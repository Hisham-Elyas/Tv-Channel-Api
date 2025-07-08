const express = require("express");
const router = express.Router();
const fixturesController = require("../controller/fixturesController");

router.get("/calendar", fixturesController.getFixtures);

module.exports = router;
