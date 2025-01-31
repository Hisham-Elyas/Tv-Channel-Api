const Group = require("../models/groupModel");

const GroupController = {
  // Create a new group
  createGroup: async (req, res) => {
    try {
      const { groupTitle } = req.body;
      const result = await Group.createGroup(groupTitle);
      res.status(201).json({
        message: "Group created successfully",
        groupId: result.insertId,
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // Get all groups
  getAllGroups: async (req, res) => {
    try {
      const groups = await Group.getAllGroups();
      res.status(200).json({
        count: groups.length, // Total groups
        groups: groups, // List of groups with channel counts
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // Get group by ID
  getGroupById: async (req, res) => {
    try {
      const { id } = req.params;
      const group = await Group.getGroupById(id);
      if (group) {
        res.status(200).json(group);
      } else {
        res.status(404).json({ message: "Group not found" });
      }
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
  searchGroups: async (req, res) => {
    const { title } = req.query;

    if (!title) {
      return res.status(400).json({ message: "Please provide a search title" });
    }

    try {
      const groups = await Group.searchGroupsByTitle(title);
      res.status(200).json({
        count: groups.length,
        groups: groups,
      });
    } catch (err) {
      res.status(500).json({
        error: true,
        message: "Error while searching for groups",
        details: err.message,
      });
    }
  },
};

module.exports = GroupController;
