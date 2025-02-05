// controllers/categoryController.js
const Category = require("../models/categoryModel");
const CategoryChannel = require("../models/categoryChannelModel");

const categoryController = {
  // Create a new category
  async createCategory(req, res) {
    try {
      const { name } = req.body;
      if (!name) {
        return res.status(400).json({ error: "Name is required." });
      }
      const newCategory = await Category.create(name);
      res.status(201).json(newCategory);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Server error while creating category." });
    }
  },

  // Get all categories
  async getCategories(req, res) {
    try {
      const categories = await Category.getAll();
      res.json(categories);
    } catch (error) {
      console.error(error);
      res
        .status(500)
        .json({ error: "Server error while fetching categories." });
    }
  },

  // Add a channel to a category
  async addChannelToCategory(req, res) {
    try {
      const category_id = req.params.id;
      const { channel_id } = req.body;
      if (!channel_id) {
        return res.status(400).json({ error: "channel_id is required." });
      }
      // Optionally, check if the category and channel exist here.
      await CategoryChannel.addChannelToCategory(category_id, channel_id);
      res
        .status(201)
        .json({ message: "Channel added to category successfully." });
    } catch (error) {
      console.error(error);
      res
        .status(500)
        .json({ error: "Server error while adding channel to category." });
    }
  },

  // Get channels for a specific category
  async getCategoryChannels(req, res) {
    try {
      const category_id = req.params.id;
      const channels = await CategoryChannel.getChannelsByCategory(category_id);
      res.status(200).json({
        count: channels.length,
        channels: channels,
      });
    } catch (error) {
      console.error(error);
      res
        .status(500)
        .json({ error: "Server error while fetching channels for category." });
    }
  },
};

module.exports = categoryController;
