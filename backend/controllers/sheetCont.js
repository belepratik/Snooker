// controllers/sheetController.js
const cacheUtils = require('../utils/cacheUtil');
require("dotenv").config();
var express = require("express");
const cors = require("cors");

var app = express();
app.use(cors());

var sheet_id = process.env.sheet_id;
var API_KEY = process.env.API_KEY;

var sheetData = async (req, res) => {
  var sheet_name = req.params.sheet_name;
  var range = req.params.range || null;

  if (!sheet_name) {
    return res.status(400).json({ error: "sheet_name is required" });
  }

  var url = range 
    ? `https://sheets.googleapis.com/v4/spreadsheets/${sheet_id}/values/${sheet_name}!${range}?key=${API_KEY}`
    : `https://sheets.googleapis.com/v4/spreadsheets/${sheet_id}/values/${sheet_name}?key=${API_KEY}`;

  // Check if the data is in the cache
  const cacheKey = `${sheet_name}-${range}`;
  const cachedData = cacheUtils.getCache(cacheKey);

  if (cachedData) {
    console.log("Returning cached data");
    return res.json(cachedData);
  }

  try {
    const fetch = await import("node-fetch");
    const response = await fetch.default(url);
    const data = await response.json();

    // Store the data in the cache
    cacheUtils.setCache(cacheKey, data);

    res.json(data);
    console.log("Data sent and cached");
  } catch (error) {
    console.log("An error occurred", error);
    res.status(500).json({ error: "An error occurred", details: error.message });
  }
};

exports.sheetData = sheetData;
