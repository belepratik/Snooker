const express = require("express");
const {editPlayer,lockNfc} = require('../controllers/editPlayerCont');

const router = express.Router();

router.post('/editPlayer',editPlayer);
router.post('/nfcOption',lockNfc);

module.exports = router ;