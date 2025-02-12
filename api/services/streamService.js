const fluentFFmpeg = require("fluent-ffmpeg");
const path = require("path");
const config = require("../config/config");

const RESOLUTION_SIZES = {
  "1080p": "1920:1080",
  "720p": "1280:720",
  "480p": "854:480",
};

let activeStreams = {}; // Keyed by unique link id

exports.processStream = (url, id, name, resolutionOptions) => {
  // If this link is already being processed, return its stream links
  if (activeStreams[id]) {
    console.log(`Stream for ID: ${id} is already running.`);
    return activeStreams[id].streamLinks;
  }

  // Determine which resolutions are enabled.
  let activeResolutions = Object.keys(resolutionOptions).filter(
    (key) => resolutionOptions[key]
  );
  if (activeResolutions.length === 0) {
    activeResolutions.push("720p");
  }

  const outputDir = path.resolve(__dirname, "../../output");

  // Create a single FFmpeg command for this IPTV link
  const ffmpegCommand = fluentFFmpeg(url).inputOptions([
    "-reconnect 1",
    "-reconnect_streamed 1",
    "-reconnect_delay_max 5",
  ]);

  activeResolutions.forEach((res) => {
    const scaleDimensions = RESOLUTION_SIZES[res] || RESOLUTION_SIZES["720p"];
    const outputFileName = path.join(
      outputDir,
      `${id}_${name}_${res}_stream.m3u8`
    );

    ffmpegCommand
      .output(outputFileName)
      .videoCodec("libx264")
      .audioCodec("aac")
      .videoFilters(`scale=${scaleDimensions}`)
      .outputOptions([
        "-f hls",
        "-hls_time 5",
        "-hls_list_size 6",
        "-hls_flags delete_segments",
        "-preset veryfast",
        "-g 50",
        "-sc_threshold 0",
      ]);
  });

  ffmpegCommand
    .on("start", (commandLine) => {
      console.log(`FFmpeg started with command: ${commandLine}`);
    })
    .on("end", () => {
      console.log(`FFmpeg processing finished for stream ${id}`);
      delete activeStreams[id];
    })
    .on("error", (err, stdout, stderr) => {
      console.error("❌ FFmpeg Error:", err.message);
      console.error("🔹 FFmpeg stdout:", stdout);
      console.error("🔹 FFmpeg stderr:", stderr);
      delete activeStreams[id];
    });

  ffmpegCommand.run();

  const streamLinks = activeResolutions.map(
    (res) =>
      `${config.baseUrl}:${config.port}/output/${id}_${name}_${res}_stream.m3u8`
  );
  activeStreams[id] = { process: ffmpegCommand, streamLinks };

  return streamLinks;
};

exports.stopStream = (id) => {
  if (!activeStreams[id]) {
    console.log(`No active stream found for ID: ${id}`);
    return;
  }
  // Stop the FFmpeg process for this IPTV link
  activeStreams[id].process.kill();
  console.log(`Stream stopped: ${id}`);
  delete activeStreams[id];
};

exports.stopAllStreams = () => {
  Object.keys(activeStreams).forEach((id) => {
    exports.stopStream(id);
  });
  console.log("All streams stopped.");
};
