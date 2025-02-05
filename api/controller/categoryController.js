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

      const result = await CategoryChannel.addChannelToCategory(
        category_id,
        channel_id
      );

      if (result.message === "Channel is already assigned to this category") {
        return res.status(409).json({ message: result.message }); // 409 Conflict
      }

      res.status(201).json(result);
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

      const data = await CategoryChannel.getChannelsByCategory(category_id);

      if (!data) {
        return res.status(404).json({ message: "Category not found" });
      }

      res.status(200).json(data);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Server error while fetching channels." });
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
  deleteCategory: async (req, res) => {
    try {
      const { categoryId } = req.params;

      const result = await CategoryChannel.deleteCategory(categoryId);

      if (!result.deleted) {
        return res.status(404).json({ message: result.message });
      }

      res.status(200).json(result);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Server error while deleting category." });
    }
  },
};

module.exports = categoryController;
