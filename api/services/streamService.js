const fluentFFmpeg = require("fluent-ffmpeg");
const path = require("path");
const config = require("../config/config");

let currentStreamProcesses = []; // Track active FFmpeg processes

const RESOLUTIONS = {
  "1080p": "-s 1920x1080",
  "720p": "-s 1280x720",
  "480p": "-s 854x480",
};

exports.processStream = (url, id, name, resolution) => {
  let activeResolutions = Object.keys(resolution).filter(
    (key) => resolution[key]
  );

  if (activeResolutions.length === 0) {
    activeResolutions.push("720p"); // Default to 720p if no resolution is provided
  }

  let streamLinks = [];

  activeResolutions.forEach((res) => {
    const resolutionOption = RESOLUTIONS[res] || RESOLUTIONS["720p"];

    // Use absolute path for output
    const outputFileName = path.resolve(
      __dirname,
      `../../output/${id}_${name}_${res}_stream.m3u8`
    );

    const segmentFilePattern = path.resolve(
      __dirname,
      `../../output/${id}_${name}_${res}_segment%03d.ts`
    );

    const ffmpegProcess = fluentFFmpeg(url)
      .videoCodec("libx264") // Use H.264 video codec
      .audioCodec("aac") // Use AAC audio codec
      .audioBitrate("128k") // Set audio bitrate
      .outputOptions([
        "-f hls", // HLS format
        "-hls_time 10", // Segment duration
        "-hls_list_size 0", // Infinite playlist size
        `-hls_segment_filename ${segmentFilePattern}`, // Segment file pattern
        resolutionOption, // Resolution option
        "-preset fast", // FFmpeg preset for faster encoding
        "-g 48", // Set GOP size
        "-keyint_min 48", // Minimum interval between keyframes
        "-sc_threshold 0", // Scene change threshold
        "-hls_flags delete_segments", // Remove old segments
      ])
      .output(outputFileName)
      .on("start", (commandLine) => {
        console.log(`FFmpeg started: ${commandLine}`);
      })
      .on("end", () => {
        console.log(`${res} processing finished`);
        currentStreamProcesses = currentStreamProcesses.filter(
          (p) => p !== ffmpegProcess
        );
      })
      .on("error", (err, stdout, stderr) => {
        console.error("FFmpeg Error:", err);
        console.error("FFmpeg stdout:", stdout);
        console.error("FFmpeg stderr:", stderr);
      });

    ffmpegProcess.run();
    currentStreamProcesses.push(ffmpegProcess);

    // Add the generated stream link to the response array
    streamLinks.push(
      `${config.baseUrl}:${config.port}/output/${id}_${name}_${res}_stream.m3u8`
    );
  });

  return streamLinks;
};

exports.stopAllStreams = () => {
  if (currentStreamProcesses.length === 0) {
    throw new Error("No active streams.");
  }

  currentStreamProcesses.forEach((process) => {
    process.kill();
    console.log("Stream stopped:", process.ffmpegPath);
  });

  currentStreamProcesses = [];
  console.log("All streams stopped.");
};
