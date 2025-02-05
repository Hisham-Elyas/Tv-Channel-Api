const { exec } = require("child_process");
const config = require("../config/config");

const ffmpegPresets = {
  "480p": (source, streamKey) =>
    `ffmpeg -re -i "${source}" \
    -vf "scale=854:480" -c:v libx264 -preset veryfast -b:v 1200k -maxrate 1200k -bufsize 2400k \
    -c:a aac -b:a 128k -ar 44100 \
    -hls_time 4 -hls_list_size 10 -hls_flags delete_segments \
    -f hls "${config.hlsPath}/${streamKey}_480p.m3u8"`,

  "720p-1080p": (source, streamKey) =>
    `ffmpeg -re -i "${source}" \
    -filter_complex "[v:0]split=2[in1][in2]; \
    [in1]scale=1920:1080[1080p]; \
    [in2]scale=1280:720[720p]" \
    -map "[1080p]" -c:v:0 libx264 -preset veryfast -b:v:0 4000k -maxrate 4000k -bufsize 8000k \
    -map "[720p]" -c:v:1 libx264 -preset veryfast -b:v:1 2500k -maxrate 2500k -bufsize 5000k \
    -map 0:a -c:a aac -b:a 128k -ar 44100 \
    -hls_time 4 -hls_list_size 10 -hls_flags delete_segments \
    -f hls "${config.hlsPath}/${streamKey}_1080p.m3u8" \
    -f hls "${config.hlsPath}/${streamKey}_720p.m3u8"`,
};

const startFFmpegProcess = (sourceUrl, streamKey, preset) => {
  const ffmpegCmd = ffmpegPresets[preset](sourceUrl, streamKey);
  return exec(ffmpegCmd);
};

module.exports = { startFFmpegProcess };
