// models/categoryChannelModel.js
const { pool } = require("../config/db");
const { modifyIPTVUrl, loadIPTVConfig } = require("../config/config"); // Import the function

const CategoryChannel = {
  // async addChannelToCategory(categoryId, channelId, channelName) {
  //   try {
  //     // Check if the category-channel pair already exists
  //     const [existing] = await pool.query(
  //       "SELECT * FROM category_channels WHERE category_id = ? AND channel_id = ?",
  //       [categoryId, channelId]
  //     );

  //     if (existing.length > 0) {
  //       return { message: "Channel is already assigned to this category" };
  //     }

  //     // Insert the category-channel relation with the provided channel name
  //     await pool.query(
  //       "INSERT INTO category_channels (category_id, channel_id, channel_name) VALUES (?, ?, ?)",
  //       [categoryId, channelId, channelName]
  //     );

  //     return {
  //       message: "Channel added to category successfully",
  //       channel: {
  //         id: channelId,
  //         name: channelName,
  //       },
  //     };
  //   } catch (err) {
  //     throw new Error(err);
  //   }
  // },
  async addChannelToCategory(categoryId, channelId, channelName, channelUrl) {
    try {
      const [existing] = await pool.query(
        "SELECT * FROM category_channels WHERE category_id = ? AND channel_id = ?",
        [categoryId, channelId]
      );

      if (existing.length === 0) {
        // Insert into category_channels only if not exists
        await pool.query(
          "INSERT INTO category_channels (category_id, channel_id, channel_name) VALUES (?, ?, ?)",
          [categoryId, channelId, channelName]
        );
      }

      // // Insert into category_channel_links
      // await pool.query(
      //   "INSERT INTO category_channel_links (category_id, channel_id, name, url) VALUES (?, ?, ?, ?)",
      //   [categoryId, channelId, channelName, channelUrl]
      // );

      return {
        message: "Channel added to category successfully",
        channel: {
          id: channelId,
          name: channelName,
          links: [{ name: channelName, url: channelUrl }], // Store the first link
        },
      };
    } catch (err) {
      throw new Error(err);
    }
  },
  // async getChannelsByCategory(categoryId) {
  //   try {
  //     // Get category info
  //     const [category] = await pool.query(
  //       "SELECT id, name FROM `categories` WHERE id = ?",
  //       [categoryId]
  //     );

  //     if (category.length === 0) {
  //       return null; // Category not found
  //     }

  //     // Fetch channels with category-specific names
  //     const [rows] = await pool.query(
  //       `SELECT
  //               c.id AS channelId,
  //               c.group_id,
  //               c.tvg_id,
  //               c.tvg_name,
  //               c.tvg_logo,
  //               c.name AS originalName,
  //               c.url AS defaultUrl,
  //               c.created_at,
  //               cc.channel_name AS customName
  //           FROM channels c
  //           JOIN category_channels cc ON c.id = cc.channel_id
  //           WHERE cc.category_id = ?`,
  //       [categoryId]
  //     );

  //     // Map channels and include links
  //     const channelMap = new Map();

  //     for (const row of rows) {
  //       if (!channelMap.has(row.channelId)) {
  //         channelMap.set(row.channelId, {
  //           id: row.channelId,
  //           group_id: row.group_id,
  //           tvg_id: row.tvg_id,
  //           tvg_name: row.tvg_name,
  //           url: row.defaultUrl,
  //           tvg_logo: row.tvg_logo,
  //           name: row.originalName,
  //           customName: row.customName,
  //           created_at: row.created_at,
  //           links: [],
  //         });
  //       }
  //     }

  //     // Fetch additional links from category_channel_links
  //     const [links] = await pool.query(
  //       `SELECT channel_id, name, url
  //            FROM category_channel_links
  //            WHERE category_id = ?`,
  //       [categoryId]
  //     );

  //     // Assign links to their respective channels
  //     links.forEach((link) => {
  //       if (channelMap.has(link.channel_id)) {
  //         channelMap.get(link.channel_id).links.push({
  //           name: link.name,
  //           url: link.url,
  //         });
  //       }
  //     });

  //     // Ensure each channel has a default link
  //     for (const channel of channelMap.values()) {
  //       if (!channel.links.find((link) => link.url === channel.defaultUrl)) {
  //         channel.links.push({
  //           name: channel.customName,
  //           url: channel.url,
  //         });
  //       }
  //     }

  //     return {
  //       categoryName: category[0].name,
  //       categoryId: category[0].id,
  //       count: channelMap.size,
  //       channels: Array.from(channelMap.values()),
  //     };
  //   } catch (err) {
  //     throw new Error(err);
  //   }
  // },
  async getChannelsByCategory(categoryId) {
    try {
      // Get category info
      const [category] = await pool.query(
        "SELECT id, name FROM `categories` WHERE id = ?",
        [categoryId]
      );

      if (category.length === 0) {
        return null; // Category not found
      }

      // Fetch channels with category-specific names
      const [rows] = await pool.query(
        `SELECT 
                  c.id AS channelId, 
                  c.group_id, 
                  c.tvg_id, 
                  c.tvg_name, 
                  c.tvg_logo, 
                  c.name AS originalName, 
                  c.url AS defaultUrl, 
                  c.created_at, 
                  cc.channel_name AS customName
              FROM channels c
              JOIN category_channels cc ON c.id = cc.channel_id
              WHERE cc.category_id = ?`,
        [categoryId]
      );

      // Map channels and include links
      const channelMap = new Map();

      for (const row of rows) {
        if (!channelMap.has(row.channelId)) {
          channelMap.set(row.channelId, {
            id: row.channelId,
            group_id: row.group_id,
            tvg_id: row.tvg_id,
            tvg_name: row.tvg_name,
            url: modifyIPTVUrl(row.defaultUrl), // Modify the IPTV URL
            tvg_logo: row.tvg_logo,
            name: row.originalName,
            customName: row.customName,
            created_at: row.created_at,
            links: [],
          });
        }
      }

      // Fetch additional links from category_channel_links
      const [links] = await pool.query(
        `SELECT channel_id, name, url 
         FROM category_channel_links 
         WHERE category_id = ?`,
        [categoryId]
      );

      // Assign links to their respective channels and modify the URL
      links.forEach((link) => {
        if (channelMap.has(link.channel_id)) {
          channelMap.get(link.channel_id).links.push({
            name: link.name,
            url: modifyIPTVUrl(link.url), // Modify the IPTV URL for additional links
          });
        }
      });

      // Ensure each channel has a default link
      for (const channel of channelMap.values()) {
        if (!channel.links.find((link) => link.url === channel.url)) {
          channel.links.push({
            name: channel.customName,
            url: channel.url, // Use the modified URL here
          });
        }
      }

      return {
        categoryName: category[0].name,
        categoryId: category[0].id,
        count: channelMap.size,
        channels: Array.from(channelMap.values()),
      };
    } catch (err) {
      throw new Error(err);
    }
  },

  removeChannelFromCategory: async (categoryId, channelId) => {
    try {
      const [result] = await pool.query(
        "DELETE FROM category_channels WHERE category_id = ? AND channel_id = ?",
        [categoryId, channelId]
      );

      if (result.affectedRows === 0) {
        return {
          message: "Channel not found in this category",
          deleted: false,
        };
      }

      return {
        message: "Channel removed from category successfully",
        deleted: true,
      };
    } catch (err) {
      throw new Error(err);
    }
  },
  // Update category name
  updateCategory: async (categoryId, newName) => {
    try {
      const [result] = await pool.query(
        "UPDATE categories SET name = ? WHERE id = ?",
        [newName, categoryId]
      );

      if (result.affectedRows === 0) {
        return { message: "Category not found", updated: false };
      }

      return { message: "Category updated successfully", updated: true };
    } catch (err) {
      throw new Error(err);
    }
  },

  // Remove a channel from a category
  removeChannelFromCategory: async (categoryId, channelId) => {
    try {
      const [result] = await pool.query(
        "DELETE FROM category_channels WHERE category_id = ? AND channel_id = ?",
        [categoryId, channelId]
      );

      if (result.affectedRows === 0) {
        return {
          message: "Channel not found in this category",
          deleted: false,
        };
      }

      return {
        message: "Channel removed from category successfully",
        deleted: true,
      };
    } catch (err) {
      throw new Error(err);
    }
  },

  deleteCategory: async (categoryId) => {
    try {
      // First, delete category-channel relationships
      await pool.query("DELETE FROM category_channels WHERE category_id = ?", [
        categoryId,
      ]);

      // Then, delete the category itself
      const [result] = await pool.query("DELETE FROM categories WHERE id = ?", [
        categoryId,
      ]);

      if (result.affectedRows === 0) {
        return { message: "Category not found", deleted: false };
      }

      return { message: "Category deleted successfully", deleted: true };
    } catch (err) {
      throw new Error(err);
    }
  },
  // getAllCategoriesWithChannels: async () => {
  //   // Query that LEFT JOINs categories to their channels via category_channels.
  //   try {
  //     const [rows] = await pool.query(`
  //       SELECT
  //         c.id AS categoryId,
  //         c.name AS categoryName,
  //         ch.id AS channelId,
  //         ch.group_id,
  //         ch.tvg_id,
  //         ch.tvg_name,
  //         ch.tvg_logo,
  //         ch.name AS channelName,
  //         ch.url,
  //         ch.created_at,
  //         cc.channel_name AS customName
  //       FROM categories c
  //       LEFT JOIN category_channels cc ON c.id = cc.category_id
  //       LEFT JOIN channels ch ON cc.channel_id = ch.id
  //       ORDER BY c.id, ch.id;
  //     `);

  //     // Aggregate results into categories
  //     const categoriesMap = new Map();

  //     rows.forEach((row) => {
  //       if (!categoriesMap.has(row.categoryId)) {
  //         categoriesMap.set(row.categoryId, {
  //           categoryId: row.categoryId,
  //           categoryName: row.categoryName,
  //           count: 0,
  //           channels: [],
  //         });
  //       }

  //       if (row.channelId) {
  //         categoriesMap.get(row.categoryId).channels.push({
  //           id: row.channelId,
  //           group_id: row.group_id,
  //           tvg_id: row.tvg_id,
  //           tvg_name: row.tvg_name,
  //           tvg_logo: row.tvg_logo,
  //           name: row.channelName,
  //           url: row.url,
  //           created_at: row.created_at,
  //           customName: row.customName, // Include custom name from category_channels
  //         });

  //         categoriesMap.get(row.categoryId).count++;
  //       }
  //     });

  //     return Array.from(categoriesMap.values());
  //   } catch (err) {
  //     console.error("Error fetching categories with channels:", err);
  //     throw new Error("Error retrieving categories with channels");
  //   }
  // },
  // getAllCategoriesWithChannels: async () => {
  //   try {
  //     const [rows] = await pool.query(
  //       `SELECT
  //         c.id AS categoryId,
  //         c.name AS categoryName,
  //         ch.id AS channelId,
  //         ch.group_id,
  //         ch.tvg_id,
  //         ch.tvg_name,
  //         ch.tvg_logo,
  //         ch.name AS channelName,
  //         ch.url AS defaultUrl,
  //         ch.created_at,
  //         cc.channel_name AS customName,
  //         cl.name AS linkName,
  //         cl.url AS extraUrl
  //       FROM categories c
  //       LEFT JOIN category_channels cc ON c.id = cc.category_id
  //       LEFT JOIN channels ch ON cc.channel_id = ch.id
  //       LEFT JOIN category_channel_links cl ON cc.category_id = cl.category_id AND cc.channel_id = cl.channel_id
  //       ORDER BY c.id, ch.id, cl.id;`
  //     );

  //     // Aggregate data
  //     const categoriesMap = new Map();

  //     rows.forEach((row) => {
  //       if (!categoriesMap.has(row.categoryId)) {
  //         categoriesMap.set(row.categoryId, {
  //           categoryId: row.categoryId,
  //           categoryName: row.categoryName,
  //           count: 0,
  //           channels: [],
  //         });
  //       }

  //       let category = categoriesMap.get(row.categoryId);

  //       let channel = category.channels.find((ch) => ch.id === row.channelId);
  //       if (!channel) {
  //         channel = {
  //           id: row.channelId,
  //           group_id: row.group_id,
  //           tvg_id: row.tvg_id,
  //           tvg_name: row.tvg_name,
  //           tvg_logo: row.tvg_logo,
  //           name: row.channelName,
  //           url: row.defaultUrl,
  //           created_at: row.created_at,
  //           customName: row.customName,
  //           links: [], // Store links as an array [{name, url}]
  //         };
  //         category.channels.push(channel);
  //         category.count++;
  //       }

  //       if (row.extraUrl) {
  //         channel.links.push({ name: row.linkName, url: row.extraUrl });
  //       }

  //       if (!channel.links.find((link) => link.url === row.defaultUrl)) {
  //         channel.links.push({ name: row.customName, url: row.defaultUrl });
  //       }
  //     });

  //     return Array.from(categoriesMap.values());
  //   } catch (err) {
  //     console.error("Error fetching categories with channels:", err);
  //     throw new Error("Error retrieving categories with channels");
  //   }
  // },
  getAllCategoriesWithChannels: async () => {
    try {
      const [categories] = await pool.query(
        `SELECT id AS categoryId, name AS categoryName FROM categories`
      );

      const [rows] = await pool.query(
        `SELECT
          c.id AS categoryId,
          ch.id AS channelId,
          ch.group_id,
          ch.tvg_id,
          ch.tvg_name,
          ch.tvg_logo,
          ch.name AS channelName,
          ch.url AS defaultUrl,
          ch.created_at,
          cc.channel_name AS customName,
          cl.name AS linkName,
          cl.url AS extraUrl
        FROM categories c
        LEFT JOIN category_channels cc ON c.id = cc.category_id
        LEFT JOIN channels ch ON cc.channel_id = ch.id
        LEFT JOIN category_channel_links cl ON cc.category_id = cl.category_id AND cc.channel_id = cl.channel_id
        ORDER BY c.id, ch.id, cl.id;`
      );

      // Initialize category map with empty channels
      const categoriesMap = new Map();
      categories.forEach((category) => {
        categoriesMap.set(category.categoryId, {
          categoryId: category.categoryId,
          categoryName: category.categoryName,
          count: 0,
          channels: [],
        });
      });

      rows.forEach((row) => {
        let category = categoriesMap.get(row.categoryId);

        if (!category) return;

        let channel = category.channels.find((ch) => ch.id === row.channelId);

        if (!channel && row.channelId) {
          channel = {
            id: row.channelId,
            group_id: row.group_id,
            tvg_id: row.tvg_id,
            tvg_name: row.tvg_name,
            tvg_logo: row.tvg_logo,
            name: row.channelName,
            url: row.defaultUrl ? modifyIPTVUrl(row.defaultUrl) : null,
            created_at: row.created_at,
            customName: row.customName,
            links: [],
          };
          category.channels.push(channel);
          category.count++;
        }

        // ✅ Ensure `channel` exists before accessing `links`
        if (channel && row.extraUrl) {
          channel.links.push({
            name: row.linkName,
            url: modifyIPTVUrl(row.extraUrl),
          });
        }

        // ✅ Ensure `channel` exists before checking `links`
        if (
          channel &&
          !channel.links.find((link) => link.url === row.defaultUrl)
        ) {
          channel.links.push({
            name: row.customName,
            url: modifyIPTVUrl(row.defaultUrl),
          });
        }
      });

      return Array.from(categoriesMap.values());
    } catch (err) {
      console.error("Error fetching categories with channels:", err);
      throw new Error("Error retrieving categories with channels");
    }
  },

  async addLink(categoryId, channelId, linkName, linkUrl) {
    try {
      // Check if the link already exists
      const [existing] = await pool.query(
        "SELECT * FROM category_channel_links WHERE category_id = ? AND channel_id = ? AND url = ?",
        [categoryId, channelId, linkUrl]
      );

      if (existing.length > 0) {
        return { message: "This link is already assigned to this channel" };
      }

      // Insert new link
      await pool.query(
        "INSERT INTO category_channel_links (category_id, channel_id, name, url) VALUES (?, ?, ?, ?)",
        [categoryId, channelId, linkName, linkUrl]
      );

      return {
        message: "Link added successfully",
        link: {
          name: linkName,
          url: linkUrl,
        },
      };
    } catch (err) {
      throw new Error(err);
    }
  },
  async removeLink(categoryId, channelId, linkUrl) {
    try {
      const [result] = await pool.query(
        "DELETE FROM category_channel_links WHERE category_id = ? AND channel_id = ? AND url = ?",
        [categoryId, channelId, linkUrl]
      );

      if (result.affectedRows === 0) {
        return { message: "Link not found", deleted: false };
      }

      return { message: "Link removed successfully", deleted: true };
    } catch (err) {
      throw new Error(err);
    }
  },
};

module.exports = CategoryChannel;
