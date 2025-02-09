const streamService = require("../services/streamService");

exports.startStream = async (req, res) => {
  try {
    const { url, id, name, resolution } = req.body;

    if (!url || !id || !name || !resolution) {
      return res.status(400).json({
        error: "URL, stream ID, name, and resolution settings are required",
      });
    }

    const streams = streamService.processStream(url, id, name, resolution);

    return res.status(200).json({
      message: "Streams are being processed...",
      streams,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ error: "Error processing video", details: error.message });
  }
};

exports.stopStreams = (req, res) => {
  try {
    streamService.stopAllStreams();
    return res
      .status(200)
      .json({ message: "All streams stopped successfully." });
  } catch (error) {
    return res
      .status(500)
      .json({ error: "Error stopping streams", details: error.message });
  }
};
