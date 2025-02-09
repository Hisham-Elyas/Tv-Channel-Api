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
};

module.exports = CategoryChannel;
