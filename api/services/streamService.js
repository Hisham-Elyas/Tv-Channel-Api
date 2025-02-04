const uuid = require("uuid");
const { startFFmpegProcess } = require("./ffmpegService");
const { cleanupHlsFiles } = require("../utils/fileUtils");
const config = require("../config/config");

const activeStreams = new Map();

const startStream = (sourceUrl, preset) => {
  const streamId = uuid.v4();
  const hlsUrls = {
    "1080p": `${config.baseUrl}/${streamId}_1080p.m3u8`,
    "720p": `${config.baseUrl}/${streamId}_720p.m3u8`,
    "480p": `${config.baseUrl}/${streamId}_480p.m3u8`,
  };

  const ffmpegProcess = startFFmpegProcess(
    sourceUrl,
    streamId,
    preset,
    config.rtmpServer
  );

  ffmpegProcess.stderr.on("data", (data) => {
    console.error(`[${streamId}] FFmpeg Error: ${data}`);
  });

  ffmpegProcess.on("exit", () => {
    console.log(`[${streamId}] Stream stopped`);
    activeStreams.delete(streamId);
    cleanupHlsFiles(streamId);
  });

  activeStreams.set(streamId, ffmpegProcess);

  return { streamId, hlsUrls, preset };
};

const stopStream = (streamId) => {
  const process = activeStreams.get(streamId);
  if (!process) return null;

  process.kill("SIGINT");
  activeStreams.delete(streamId);
  cleanupHlsFiles(streamId);

  return streamId;
};

const stopAllStreams = () => {
  const stoppedStreams = [];

  activeStreams.forEach((process, streamId) => {
    process.kill("SIGINT");
    activeStreams.delete(streamId);
    cleanupHlsFiles(streamId);
    stoppedStreams.push(streamId);
  });

  return stoppedStreams;
};

module.exports = { startStream, stopStream, stopAllStreams };
