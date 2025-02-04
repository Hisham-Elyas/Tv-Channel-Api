const { exec } = require("child_process");

const ffmpegPresets = {
  "low-cpu": (source, streamKey, rtmpServer) =>
    `ffmpeg -re -i "${source}" \
    -filter_complex \
    "[0:v]split=3[v1][v2][v3]; \
    [v1]scale=1920:1080[1080p]; \
    [v2]scale=1280:720[720p]; \
    [v3]scale=854:480[480p]" \
    -map "[1080p]" -c:v libx264 -preset veryfast -b:v 4000k \
    -map "[720p]" -c:v libx264 -preset veryfast -b:v 2500k \
    -map "[480p]" -c:v libx264 -preset veryfast -b:v 1200k \
    -map 0:a -c:a aac -b:a 128k -ar 44100 \
    -f hls -hls_time 4 -hls_list_size 5 -hls_flags delete_segments /var/www/hls/${streamKey}_1080p.m3u8 \
    -f hls -hls_time 4 -hls_list_size 5 -hls_flags delete_segments /var/www/hls/${streamKey}_720p.m3u8 \
    -f hls -hls_time 4 -hls_list_size 5 -hls_flags delete_segments /var/www/hls/${streamKey}_480p.m3u8`,
};

const startFFmpegProcess = (sourceUrl, streamKey, preset, rtmpServer) => {
  const ffmpegCmd = ffmpegPresets[preset](sourceUrl, streamKey, rtmpServer);
  return exec(ffmpegCmd);
};

module.exports = { startFFmpegProcess };
