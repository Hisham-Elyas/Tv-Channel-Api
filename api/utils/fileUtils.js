const fs = require("fs");
const path = require("path");
const config = require("../config/config");

const cleanupHlsFiles = (streamId) => {
  try {
    const hlsDir = config.hlsPath;
    const files = fs.readdirSync(hlsDir);

    files.forEach((file) => {
      if (file.startsWith(streamId)) {
        fs.unlinkSync(path.join(hlsDir, file));
        console.log(`Deleted ${file}`);
      }
    });
  } catch (error) {
    console.error("Cleanup error:", error);
  }
};

module.exports = { cleanupHlsFiles };
