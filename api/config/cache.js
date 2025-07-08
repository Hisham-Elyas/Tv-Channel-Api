// cache.js
const NodeCache = require("node-cache");

// Default TTL = 5 minutes; check period = 2 minutes
const cache = new NodeCache({ stdTTL: 300, checkperiod: 120 });

module.exports = cache;
