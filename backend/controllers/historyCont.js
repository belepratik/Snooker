const express = require("express");
const pool = require("../db/db");

const records = async (req, res) => {
  let table = req.params.table;
  let studio = req.params.studio;
  let loadValue = req.params.loadValue;
  try {
    let sql = "";
    if (loadValue > 0) {
      sql = `Select * from ${table}  where studio = "${studio}" ORDER BY RecordID DESC LIMIT ${loadValue};`;
    } else {
      sql = `Select * from ${table}  where studio = "${studio}" ORDER BY RecordID DESC ;`;
    }
    let [result] = await pool.query(sql);
    if (result.length > 0) {
      return res.status(200).json({ success: true, result: result });
    } else {
      return res
        .status(400)
        .json({ success: false, error: "NO data found for this studio " });
    }
  } catch (error) {
    console.error("Error add Player :", error);
    res.status(500).json({ success: false, error: "Failed to add Player" });
  }
};

module.exports = { records };
