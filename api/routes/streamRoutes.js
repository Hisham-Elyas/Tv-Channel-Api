const express = require("express");
const router = express.Router();
const streamController = require("../controller/streamController");

router.post("/start", streamController.startStreamHandler);
router.post("/stop/:streamId", streamController.stopStreamHandler);
router.post("/stop-all", streamController.stopAllStreamsHandler);

module.exports = router;
