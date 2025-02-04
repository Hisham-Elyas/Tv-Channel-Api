const { exec } = require("child_process");

const ffmpegPresets = {
  "low-cpu": (source, streamKey, rtmpServer) =>
    `ffmpeg -re -i "${source}" \
    -filter_complex \
    "[v:0]split=3[in1][in2][in3]; \
    [in1]scale=1920:1080[1080p]; \
    [in2]scale=1280:720[720p]; \
    [in3]scale=854:480[480p]" \
    -map "[1080p]" -c:v:0 libx264 -preset veryfast -b:v:0 4000k -maxrate 4000k -bufsize 8000k \
    -map "[720p]" -c:v:1 libx264 -preset veryfast -b:v:1 2500k -maxrate 2500k -bufsize 5000k \
    -map "[480p]" -c:v:2 libx264 -preset veryfast -b:v:2 1200k -maxrate 1200k -bufsize 2400k \
    -map 0:a -c:a aac -b:a 128k -ar 44100 \
    -f hls "${rtmpServer}/${streamKey}_1080p" \
    -f hls "${rtmpServer}/${streamKey}_720p" \
    -f hls "${rtmpServer}/${streamKey}_480p"`,
};

const startFFmpegProcess = (sourceUrl, streamKey, preset, rtmpServer) => {
  const ffmpegCmd = ffmpegPresets[preset](sourceUrl, streamKey, rtmpServer);
  return exec(ffmpegCmd);
};

module.exports = { startFFmpegProcess };
