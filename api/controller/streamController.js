const streamService = require("../services/streamService");
const startStreamHandler = (req, res) => {
  try {
    const { sourceUrl, quality = "480p" } = req.body;
    if (!sourceUrl) throw new Error("Missing sourceUrl");

    const preset = quality === "720p-1080p" ? "720p-1080p" : "480p";
    const streamData = streamService.startStream(sourceUrl, preset);

    res.json(streamData);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const stopStreamHandler = (req, res) => {
  const streamId = req.params.streamId;
  const stoppedStream = streamService.stopStream(streamId);

  if (!stoppedStream)
    return res.status(404).json({ error: "Stream not found" });

  res.json({ message: `Stopped stream ${streamId}` });
};

const stopAllStreamsHandler = (req, res) => {
  const stoppedStreams = streamService.stopAllStreams();
  res.json({
    message: `Stopped ${stoppedStreams.length} streams`,
    stoppedStreams,
  });
};

module.exports = {
  startStreamHandler,
  stopStreamHandler,
  stopAllStreamsHandler,
};
