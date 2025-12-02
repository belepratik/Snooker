const express = require("express");
const {records} = require("../controllers/historyCont")

const router = express.Router();

router.get("/:table/:studio/:loadValue",records);


module.exports = router;
