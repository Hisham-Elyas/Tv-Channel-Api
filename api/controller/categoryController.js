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
  updateCategory: async (req, res) => {
    try {
      const { categoryId } = req.params;
      const { name } = req.body;

      if (!name) {
        return res
          .status(400)
          .json({ message: "New category name is required." });
      }

      const result = await CategoryChannel.updateCategory(categoryId, name);

      if (!result.updated) {
        return res.status(404).json({ message: result.message });
      }

      res.status(200).json(result);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Server error while updating category." });
    }
  },

  // Add a channel to a category

  addChannelToCategory: async (req, res) => {
    try {
      const { categoryId, channelId, channelName, channelUrl } = req.body;

      if (!categoryId || !channelId || !channelName) {
        return res.status(400).json({
          message:
            "categoryId, channelId, channelUrl, and channelName are required",
        });
      }

      const result = await CategoryChannel.addChannelToCategory(
        categoryId,
        channelId,
        channelName
      );

      res.status(201).json(result);
    } catch (error) {
      console.error(error);
      res
        .status(500)
        .json({ error: "Server error while adding channel to category." });
    }
  },
  // async addChannelToCategory(req, res) {
  //   try {
  //     const category_id = req.params.id;
  //     const { channel_id } = req.body;
  //     if (!channel_id) {
  //       return res.status(400).json({ error: "channel_id is required." });
  //     }
  //     // Optionally, check if the category and channel exist here.

  //     const result = await CategoryChannel.addChannelToCategory(
  //       category_id,
  //       channel_id
  //     );

  //     if (result.message === "Channel is already assigned to this category") {
  //       return res.status(409).json({ message: result.message }); // 409 Conflict
  //     }

  //     res.status(201).json(result);
  //   } catch (error) {
  //     console.error(error);
  //     res
  //       .status(500)
  //       .json({ error: "Server error while adding channel to category." });
  //   }
  // },

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
  async getCategoriesWithChannels(req, res) {
    try {
      const data = await CategoryChannel.getAllCategoriesWithChannels();
      res.status(200).json(data);
    } catch (error) {
      console.error(error);
      res.status(500).json({
        error: "Server error while fetching categories with channels.",
      });
    }
  },
  // Add a new link to a category-channel
  async addLink(req, res) {
    try {
      const { categoryId, channelId, linkName, linkUrl } = req.body;

      if (!categoryId || !channelId || !linkName || !linkUrl) {
        return res.status(400).json({ error: "All fields are required." });
      }

      const result = await CategoryChannel.addLink(
        categoryId,
        channelId,
        linkName,
        linkUrl
      );
      res.status(201).json(result);
    } catch (error) {
      console.error(error);
      res.status(500).json({
        error: "Server error while adding the link.",
      });
    }
  },

  // Remove a link from a category-channel
  async removeLink(req, res) {
    try {
      const { categoryId, channelId, linkUrl } = req.body;

      if (!categoryId || !channelId || !linkUrl) {
        return res.status(400).json({ error: "All fields are required." });
      }

      const result = await CategoryChannel.removeLink(
        categoryId,
        channelId,
        linkUrl
      );
      res.status(200).json(result);
    } catch (error) {
      console.error(error);
      res.status(500).json({
        error: "Server error while removing the link.",
      });
    }
  },
};

module.exports = categoryController;
