const express = require('express');
const {addPlayer} = require('../controllers/addPlayerCont.js');

const router = express.Router();

router.post('/addPlayer',addPlayer);

module.exports = router;
