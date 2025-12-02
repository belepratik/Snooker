const express = require('express');
const {sheetData} = require('../controllers/sheetCont');

const router = express.Router();

router.get("/sheet/:sheet_name",sheetData);
router.get("/sheet/:sheet_name/:range",sheetData);

module.exports = router;