const fs = require("fs");
const { pool } = require("./api/config/db");
const mysql = require("mysql2/promise");

exports.parseM3UtoJSONtoDB = async function () {
  const m3uPath = "playlist.m3u";
  const jsonPath = "IP_TV_Playlist.json";
  const groupsPath = "ip-tv-channel-group.js";
  const arGroupsPath = "ip-tv-channel-group-Ar.js";
  const data = fs.readFileSync(m3uPath, "utf8");
  const lines = data.split("\n");
  const groups = {};

  let currentEntry = null;
  let totalChannels = 0;

  lines.forEach((line) => {
    line = line.trim();
    if (line.startsWith("#EXTINF")) {
      currentEntry = {};

      // Extract attributes using regex
      const attrRegex = /([a-z-]+)="(.*?)"/gi;
      let match;
      while ((match = attrRegex.exec(line)) !== null) {
        currentEntry[match[1]] = match[2];
      }

      // Extract channel name (after last comma)
      const name = line.split(",").pop();
      currentEntry.name = name.trim();
    } else if (line.startsWith("http")) {
      if (currentEntry) {
        currentEntry.url = line;

        // Get or create group
        const groupTitle = currentEntry["group-title"] || "UNGROUPED";
        if (!groups[groupTitle]) {
          groups[groupTitle] = [];
        }

        // Add to group
        groups[groupTitle].push({
          "tvg-id": currentEntry["tvg-id"] || "",
          "tvg-name": currentEntry["tvg-name"] || "",
          "tvg-logo": currentEntry["tvg-logo"] || "",
          name: currentEntry.name,
          url: currentEntry.url,
        });

        totalChannels++;
        currentEntry = null;
      }
    }
  });

  // Save JSON file
  const result = Object.keys(groups).map((groupTitle) => ({
    "group-title": groupTitle,
    channels: groups[groupTitle],
  }));
  await insertChannelsAndGroups(result);

  // fs.writeFileSync(jsonPath, JSON.stringify(result, null, 4));

  // Save group names to JS file
  const groupNames = Object.keys(groups);
  // const groupsFileContent = `// Auto-generated channel groups list\nconst channelGroups = ${JSON.stringify(
  //   groupNames,
  //   null,
  //   4
  // )};\n\nmodule.exports = channelGroups;`;
  // fs.writeFileSync(groupsPath, groupsFileContent);

  // filterARGroups(groupsPath, arGroupsPath);
  console.log(`
   ✅ Conversion and inserted complete!✅
    ===================================
    Total channels: ${totalChannels}
    Total groups: ${groupNames.length}
    `);
};

function filterARGroups(inputFile, outputFile) {
  // Read the groups file
  const groupsData = fs.readFileSync(inputFile, "utf8");

  // Extract the array from the JS file
  const groupsArray = eval(groupsData.match(/\[.*\]/s)[0]);

  // Filter groups starting with AR|
  const arGroups = groupsArray.filter((group) => group.startsWith("AR|"));

  // Create new JS file content
  const fileContent = `// Auto-generated AR-prefixed channel groups\nconst arChannelGroups = ${JSON.stringify(
    arGroups,
    null,
    4
  )};\n\nmodule.exports = arChannelGroups;`;

  // Write to file
  fs.writeFileSync(outputFile, fileContent);
  console.log(`AR groups saved to ${outputFile} (${arGroups.length} groups)`);
}

// Initialize database connection pool

// Create a MySQL connection pool (ensure it's outside of the function)
// const pool = mysql.createPool({
//   host: "MYSQL1001.site4now.net", // Make sure this is correct (localhost or IP address)
//   user: "db_ab2571_ftv2003", // Replace with your MySQL username
//   password: "Faisal@15557", // Replace with your MySQL password
//   database: "ab2571_ftv2003", // Replace with your database name
//   connectionLimit: 100,
//   port: 3306, // Ensure it's the correct port
//   waitForConnections: true,
//   queueLimit: 0,
//   ssl: {
//     rejectUnauthorized: false, // Enable SSL for secure connection
//   },
// });

// Initialize the database
let connection;
async function initializeDatabase() {
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction(); // Start transaction on the same connection
    // Check if 'groups' table exists
    const [tables] = await connection.query("SHOW TABLES LIKE 'groups'");

    if (tables.length === 0) {
      console.log("'groups' table does not exist. Creating it...");

      // Create 'groups' table
      await connection.query(`
        CREATE TABLE IF NOT EXISTS \`groups\` (
          \`id\` INT AUTO_INCREMENT PRIMARY KEY,
          \`group_title\` VARCHAR(255) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log("Table 'groups' created or already exists!");

      // Create 'channels' table
      await connection.query(`
        CREATE TABLE IF NOT EXISTS \`channels\` (
          \`id\` INT AUTO_INCREMENT PRIMARY KEY,
          \`group_id\` INT NOT NULL,
          \`tvg_id\` VARCHAR(255),
          \`tvg_name\` VARCHAR(255),
          \`tvg_logo\` VARCHAR(255),
          \`name\` VARCHAR(255),
          \`url\` VARCHAR(255),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (\`group_id\`) REFERENCES \`groups\`(\`id\`) ON DELETE CASCADE
        )
      `);
      console.log("Table 'channels' created or already exists!");
    } else {
      console.log("'groups' table exists.");
    }
  } catch (err) {
    console.error("Error during database initialization:", err);
  }
}

// async function insertChannelsAndGroups(data) {
//   await initializeDatabase();

//   try {
//     //Step 1: Check if there is any existing data in the 'groups' table
//     const [rows] = await connection.query(
//       "SELECT COUNT(*) AS count FROM `groups`"
//     );

//     if (rows[0].count > 0) {
//       console.log("Old data found. Deleting...");
//       // Step 2: Delete all data from both tables if data exists
//       await connection.query("DELETE FROM `channels`");
//       await connection.query("DELETE FROM `groups`");
//     }

//     // Step 3: Insert new data
//     for (const [index, group] of data.entries()) {
//       // Insert Group Title and get its ID
//       const groupNamber = index;
//       const [groupResult] = await connection.query(
//         "INSERT INTO `groups` (group_title) VALUES (?)",
//         [group["group-title"]]
//       );
//       console.log(
//         `Processing groups    =======>    ${index + 1}/${data.length}`
//       );
//       const groupId = groupResult.insertId;

//       // Insert Channels for the Group
//       for (const [index, channel] of group.channels.entries()) {
//         await connection.query(
//           "INSERT INTO `channels` (group_id, tvg_id, tvg_name, tvg_logo, name, url) VALUES (?, ?, ?, ?, ?, ?)",
//           [
//             groupId,
//             channel["tvg-id"],
//             channel["tvg-name"],
//             channel["tvg-logo"],
//             channel["name"],
//             channel["url"],
//           ]
//         );
//         console.log(
//           `Processing channel ${index + 1}/${group.channels.length} for group ${
//             groupNamber + 1
//           }/${data.length}`
//         );
//       }
//     }
//     await connection.commit();
//     console.log("✅ Data inserted successfully!");
//   } catch (error) {
//     console.error("❌ Error during data insertion:", error);
//   } finally {
//     // Close the connection pool
//     await pool.end();
//   }
// }

// Helper function to split an array into chunks of a given size.
function chunkArray(array, chunkSize) {
  const chunks = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
}

async function insertChannelsAndGroups(data) {
  // Ensure your database/connection is initialized.
  await initializeDatabase();

  // --- Step 1: Clear Existing Data ---
  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    // Check for existing data in the 'groups' table
    const [rows] = await connection.query(
      "SELECT COUNT(*) AS count FROM `groups`"
    );

    if (rows[0].count > 0) {
      console.log("Old data found. Deleting...");

      // Delete from the dependent table first, then the parent table
      await connection.query("DELETE FROM `channels`");
      await connection.query("DELETE FROM `groups`");
      console.log("Old data deleted successfully!");
    } else {
      console.log("No old data found. Proceeding with insertion...");
    }

    await connection.commit();
  } catch (error) {
    console.error("❌ Error during deletion of old data:", error);
    if (connection) await connection.rollback();
  } finally {
    if (connection) connection.release();
  }

  // --- Step 2: Insert New Data in Batches ---
  // For example, process 100 groups per batch.
  const batchSize = 100;
  const groupBatches = chunkArray(data, batchSize);

  for (let batchIndex = 0; batchIndex < groupBatches.length; batchIndex++) {
    const groupBatch = groupBatches[batchIndex];
    let batchConnection;
    try {
      batchConnection = await pool.getConnection();
      await batchConnection.beginTransaction();

      for (const [groupIndex, group] of groupBatch.entries()) {
        // Calculate overall group number for logging
        const globalGroupIndex = batchIndex * batchSize + groupIndex;
        console.log(
          `Processing group ${globalGroupIndex + 1} of ${data.length}`
        );

        // Insert the group record and get its generated ID.
        const [groupResult] = await batchConnection.query(
          "INSERT INTO `groups` (group_title) VALUES (?)",
          [group["group-title"]]
        );
        const groupId = groupResult.insertId;

        // Insert each channel for this group.
        for (const [channelIndex, channel] of group.channels.entries()) {
          console.log(
            `   Processing channel ${channelIndex + 1} of ${
              group.channels.length
            } for group ${globalGroupIndex + 1}`
          );
          await batchConnection.query(
            "INSERT INTO `channels` (group_id, tvg_id, tvg_name, tvg_logo, name, url) VALUES (?, ?, ?, ?, ?, ?)",
            [
              groupId,
              channel["tvg-id"],
              channel["tvg-name"],
              channel["tvg-logo"],
              channel["name"],
              channel["url"],
            ]
          );
        }
      }

      // Commit the batch transaction
      await batchConnection.commit();
      console.log(
        `✅ Batch ${batchIndex + 1} of ${
          groupBatches.length
        } inserted successfully.`
      );
    } catch (error) {
      console.error(`❌ Error inserting batch ${batchIndex + 1}:`, error);
      if (batchConnection) await batchConnection.rollback();
    } finally {
      if (batchConnection) batchConnection.release();
    }
  }

  console.log("✅ All channels and groups data inserted successfully!");

  // Optionally, if this is the final operation, you may close the pool.
}

// // Usage example with your data
// const data = [
//   {
//     "group-title": "4K| RELAX UHD 3840P ☼",
//     channels: [
//       {
//         "tvg-id": "",
//         "tvg-name": "###### RELAX ᵁᴴᴰ 3840P ######",
//         "tvg-logo": "",
//         name: "###### RELAX ᵁᴴᴰ 3840P ######",
//         url: "http://plots95882.cdngold.me:80/5f64535c9e59/75309ce8fa/779156",
//       },
//       // Other channels...
//     ],
//   },
//   {
//     "group-title": "UK| CHRISTMAS ᴴᴰ/ᴿᴬᵂ",
//     channels: [
//       {
//         "tvg-id": "",
//         "tvg-name": "####### CHRISTMAS #######",
//         "tvg-logo": "",
//         name: "####### CHRISTMAS #######",
//         url: "http://plots95882.cdngold.me:80/5f64535c9e59/75309ce8fa/1236032",
//       },
//       // Other channels...
//     ],
//   },
// ];

// Usage
// parseM3UtoJSONtoDB();
