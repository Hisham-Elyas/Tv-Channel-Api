// models/categoryChannelModel.js
const { pool } = require("../config/db");

const CategoryChannel = {
  async addChannelToCategory(categoryId, channelId) {
    try {
      // Check if the category-channel pair already exists
      const [existing] = await pool.query(
        "SELECT * FROM category_channels WHERE category_id = ? AND channel_id = ?",
        [categoryId, channelId]
      );

      if (existing.length > 0) {
        return { message: "Channel is already assigned to this category" };
      }

      // Insert only if it doesn't exist
      await pool.query(
        "INSERT INTO category_channels (category_id, channel_id) VALUES (?, ?)",
        [categoryId, channelId]
      );

      return { message: "Channel added to category successfully" };
    } catch (err) {
      throw new Error(err);
    }
  },

  getChannelsByCategory: async (categoryId) => {
    try {
      // Get category name
      const [category] = await pool.query(
        "SELECT id, name FROM `categories` WHERE id = ?",
        [categoryId]
      );

      if (category.length === 0) {
        return null; // Category not found
      }

      // Get channels related to this category
      const [channels] = await pool.query(
        `SELECT c.* 
           FROM channels c
           JOIN category_channels cc ON c.id = cc.channel_id
           WHERE cc.category_id = ?`,
        [categoryId]
      );

      return {
        categoryId: category[0].id,
        categoryName: category[0].name,
        count: channels.length,
        channels: channels,
      };
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
  removeChannelFromCategory: async (req, res) => {
    try {
      const { categoryId, channelId } = req.params;

      const result = await CategoryChannel.removeChannelFromCategory(
        categoryId,
        channelId
      );

      if (!result.deleted) {
        return res.status(404).json({ message: result.message });
      }

      res.status(200).json(result);
    } catch (error) {
      console.error(error);
      res
        .status(500)
        .json({ error: "Server error while removing channel from category." });
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
