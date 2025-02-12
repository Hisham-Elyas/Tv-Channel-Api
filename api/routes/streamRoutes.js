const express = require("express");
const router = express.Router();
const streamController = require("../controller/streamController");

router.post("/", streamController.startStream);
router.post("/stop", streamController.stopStreams);

module.exports = router;
