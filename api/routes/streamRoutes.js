const express = require("express");
const {
  startStreamHandler,
  stopStreamHandler,
  stopAllStreamsHandler,
} = require("../controller/streamController");

const router = express.Router();

router.post("/start", startStreamHandler);
router.post("/stop/:streamId", stopStreamHandler);
router.post("/stop-all", stopAllStreamsHandler);

module.exports = router;
