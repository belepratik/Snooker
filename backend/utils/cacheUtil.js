// utils/cacheUtils.js
const NodeCache = require("node-cache");
const cache = new NodeCache({ stdTTL: 604800 }); // Cache TTL set to 600 seconds (10 minutes)

const getCache = (key) => {
  return cache.get(key);
};

const setCache = (key, value) => {
  cache.set(key, value);
};

const delCache = (key) => {
  cache.del(key);
};

const clearCacheByPrefix = (prefix) => {
  const keys = cache.keys();
  keys.forEach((key) => {
    if (key.startsWith(prefix)) {
      cache.del(key);
    }
  });
};

module.exports = {
  getCache,
  setCache,
  delCache,
  clearCacheByPrefix,
};
