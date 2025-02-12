// models/categoryChannelModel.js
const { pool } = require("../config/db");

const CategoryChannel = {
  async addChannelToCategory(categoryId, channelId, channelName) {
    try {
      // Check if the category-channel pair already exists
      const [existing] = await pool.query(
        "SELECT * FROM category_channels WHERE category_id = ? AND channel_id = ?",
        [categoryId, channelId]
      );

      if (existing.length > 0) {
        return { message: "Channel is already assigned to this category" };
      }

      // Insert the category-channel relation with the provided channel name
      await pool.query(
        "INSERT INTO category_channels (category_id, channel_id, channel_name) VALUES (?, ?, ?)",
        [categoryId, channelId, channelName]
      );

      return {
        message: "Channel added to category successfully",
        channel: {
          id: channelId,
          name: channelName,
        },
      };
    } catch (err) {
      throw new Error(err);
    }
  },
  // async addChannelToCategory(categoryId, channelId) {
  //   try {
  //     // Check if the category-channel pair already exists
  //     const [existing] = await pool.query(
  //       "SELECT * FROM category_channels WHERE category_id = ? AND channel_id = ?",
  //       [categoryId, channelId]
  //     );

  //     if (existing.length > 0) {
  //       return { message: "Channel is already assigned to this category" };
  //     }

  //     // Insert only if it doesn't exist
  //     await pool.query(
  //       "INSERT INTO category_channels (category_id, channel_id) VALUES (?, ?)",
  //       [categoryId, channelId]
  //     );

  //     return { message: "Channel added to category successfully" };
  //   } catch (err) {
  //     throw new Error(err);
  //   }
  // },

  async getChannelsByCategory(categoryId) {
    try {
      // Get category name
      const [category] = await pool.query(
        "SELECT id, name FROM `categories` WHERE id = ?",
        [categoryId]
      );

      if (category.length === 0) {
        return null; // Category not found
      }

      // Get channels with both the original name and custom name
      const [channels] = await pool.query(
        `SELECT 
                c.id, 
                c.group_id, 
                c.tvg_id, 
                c.tvg_name, 
                c.tvg_logo, 
                c.name, 
                c.url, 
                c.created_at, 
                cc.channel_name AS customName
            FROM channels c
            JOIN category_channels cc ON c.id = cc.channel_id
            WHERE cc.category_id = ?`,
        [categoryId]
      );

      return {
        categoryName: category[0].name,
        categoryId: category[0].id,
        count: channels.length,
        channels: channels,
      };
    } catch (err) {
      throw new Error(err);
    }
  },
  // getChannelsByCategory: async (categoryId) => {
  //   try {
  //     // Get category name
  //     const [category] = await pool.query(
  //       "SELECT id, name FROM `categories` WHERE id = ?",
  //       [categoryId]
  //     );

  //     if (category.length === 0) {
  //       return null; // Category not found
  //     }

  //     // Get channels related to this category
  //     const [channels] = await pool.query(
  //       `SELECT c.*
  //          FROM channels c
  //          JOIN category_channels cc ON c.id = cc.channel_id
  //          WHERE cc.category_id = ?`,
  //       [categoryId]
  //     );

  //     return {
  //       categoryId: category[0].id,
  //       categoryName: category[0].name,
  //       count: channels.length,
  //       channels: channels,
  //     };
  //   } catch (err) {
  //     throw new Error(err);
  //   }
  // },
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
  getAllCategoriesWithChannels: async () => {
    // Query that LEFT JOINs categories to their channels via category_channels.
    try {
      const [rows] = await pool.query(`
        SELECT
          c.id AS categoryId,
          c.name AS categoryName,
          ch.id AS channelId,
          ch.group_id,
          ch.tvg_id,
          ch.tvg_name,
          ch.tvg_logo,
          ch.name AS channelName,
          ch.url,
          ch.created_at,
          cc.channel_name AS customName
        FROM categories c
        LEFT JOIN category_channels cc ON c.id = cc.category_id
        LEFT JOIN channels ch ON cc.channel_id = ch.id
        ORDER BY c.id, ch.id;
      `);

      // Aggregate results into categories
      const categoriesMap = new Map();

      rows.forEach((row) => {
        if (!categoriesMap.has(row.categoryId)) {
          categoriesMap.set(row.categoryId, {
            categoryId: row.categoryId,
            categoryName: row.categoryName,
            count: 0,
            channels: [],
          });
        }

        if (row.channelId) {
          categoriesMap.get(row.categoryId).channels.push({
            id: row.channelId,
            group_id: row.group_id,
            tvg_id: row.tvg_id,
            tvg_name: row.tvg_name,
            tvg_logo: row.tvg_logo,
            name: row.channelName,
            url: row.url,
            created_at: row.created_at,
            customName: row.customName, // Include custom name from category_channels
          });

          categoriesMap.get(row.categoryId).count++;
        }
      });

      return Array.from(categoriesMap.values());
    } catch (err) {
      console.error("Error fetching categories with channels:", err);
      throw new Error("Error retrieving categories with channels");
    }
  },
};

module.exports = CategoryChannel;
