require("dotenv").config();
var express = require("express");
const sheet = require("../utils/sheetApi");

var app = express();
let spreadsheet = "Leaderboard";
let spreadsheetId = process.env.sheet_id;

const sort = async (req,res)=>{
    try {
        sortSheet(spreadsheetId,spreadsheet,9);
        res.json({ success: true ,msg:"sorted"});
    } catch (error) {
        console.error("Error to sort:", error);
    res.status(500).json({ success: false, error: "Failed sorting" });
    }
}

module.exports = sort ;
