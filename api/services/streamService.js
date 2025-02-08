const fluentFFmpeg = require("fluent-ffmpeg");
const path = require("path");
const config = require("../config/config");

let activeStreams = {}; // Store active streams with their IDs

const RESOLUTIONS = {
  "1080p": "-s 1920x1080",
  "720p": "-s 1280x720",
  "480p": "-s 854x480",
};

exports.processStream = (url, id, name, resolution) => {
  if (activeStreams[id]) {
    console.log(`Stream for ID: ${id} is already running.`);
    return activeStreams[id].streamLinks;
  }

  let activeResolutions = Object.keys(resolution).filter(
    (key) => resolution[key]
  );

  if (activeResolutions.length === 0) {
    activeResolutions.push("720p"); // Default resolution if none provided
  }

  let streamLinks = [];
  let processes = [];

  activeResolutions.forEach((res) => {
    const resolutionOption = RESOLUTIONS[res] || RESOLUTIONS["720p"];
    const outputDir = path.resolve(__dirname, "../../output");
    const outputFileName = path.join(
      outputDir,
      `${id}_${name}_${res}_stream.m3u8`
    );
    const segmentFilePattern = path.join(
      outputDir,
      `${id}_${name}_${res}_segment%03d.ts`
    );

    const ffmpegProcess = fluentFFmpeg(url)
      .inputOptions(["-re"]) // Ensures smooth re-streaming by reading input in real-time
      .videoCodec("libx264")
      .audioCodec("aac")
      .audioBitrate("128k")
      .outputOptions([
        "-f hls",
        "-hls_time 6", // Reduce segment time for lower latency
        "-hls_list_size 10", // Keep only last 10 segments to avoid excessive memory usage
        `-hls_segment_filename ${segmentFilePattern}`,
        resolutionOption,
        "-preset veryfast", // Faster encoding
        "-g 48", // Keyframe interval for better stream quality
        "-keyint_min 48",
        "-sc_threshold 0",
        "-hls_flags delete_segments+append_list", // Remove old segments, keep new ones
        "-fflags +genpts", // Fix timestamp issues when re-streaming live video
      ])
      .output(outputFileName)
      .on("start", (commandLine) => {
        console.log(`FFmpeg started: ${commandLine}`);
      })
      .on("end", () => {
        console.log(`${res} processing finished for ${id}`);
        processes = processes.filter((p) => p !== ffmpegProcess);
        if (processes.length === 0) delete activeStreams[id];
      })
      .on("error", (err, stdout, stderr) => {
        console.error(`FFmpeg Error for ${id} (${res}):`, err);
        processes = processes.filter((p) => p !== ffmpegProcess);
        if (processes.length === 0) delete activeStreams[id];
      });

    ffmpegProcess.run();
    processes.push(ffmpegProcess);

    streamLinks.push(
      `${config.baseUrl}:${config.port}/output/${id}_${name}_${res}_stream.m3u8`
    );
  });

  activeStreams[id] = { processes, streamLinks };
  return streamLinks;
};

exports.stopStream = (id) => {
  if (!activeStreams[id]) {
    console.log(`No active stream found for ID: ${id}`);
    return;
  }

  activeStreams[id].processes.forEach((process) => {
    process.kill();
    console.log(`Stream stopped: ${id}`);
  });

  delete activeStreams[id];
};

exports.stopAllStreams = () => {
  Object.keys(activeStreams).forEach((id) => {
    exports.stopStream(id);
  });

  console.log("All streams stopped.");
};
