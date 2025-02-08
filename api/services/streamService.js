const fluentFFmpeg = require("fluent-ffmpeg");

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

    const outputFileName = `../../output/${id}_${name}_${res}_stream.m3u8`;

    const ffmpegProcess = fluentFFmpeg(url)
      .outputOptions([
        "-f hls",
        "-hls_time 10",
        "-hls_list_size 0",
        `-hls_segment_filename ../../output/${id}_${name}_${res}_segment%03d.ts`,
        resolutionOption,
      ])
      .output(outputFileName)
      .on("start", (commandLine) =>
        console.log(`FFmpeg started: ${commandLine}`)
      )
      .on("end", () => {
        console.log(`${res} processing finished`);
        currentStreamProcesses = currentStreamProcesses.filter(
          (p) => p !== ffmpegProcess
        );
      })
      .on("error", (err) => console.error("FFmpeg Error:", err));

    ffmpegProcess.run();
    currentStreamProcesses.push(ffmpegProcess);

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

  currentStreamProcesses.forEach((process) => process.kill());
  currentStreamProcesses = [];
};
