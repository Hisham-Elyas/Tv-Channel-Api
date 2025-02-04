const express = require("express");
const streamController = require("../controller/streamController");

const router = express.Router();

router.post("/start", streamController.startStreamHandler);
router.post("/stop/:streamId", streamController.stopStreamHandler);
router.post("/stop-all", streamController.stopAllStreamsHandler);

module.exports = router;
