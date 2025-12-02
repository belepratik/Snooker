const express = require("express");
const router = express.Router();
const { dashData,peakData,tableData } = require("../controllers/dashDataCont");

router.get("/dashData", dashData);
router.get("/tableData", tableData);
router.get("/peakData", peakData);

module.exports = router;