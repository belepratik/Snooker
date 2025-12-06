const express = require("express");
const router = express.Router();

const { sendGG } = require("../controllers/ggCont");

// POST /frames/sendGG
router.post("/frames/sendGG", sendGG);

module.exports = router;
