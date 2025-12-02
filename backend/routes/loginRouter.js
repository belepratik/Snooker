const express = require('express');
const {club_login} = require('../controllers/club_loginCont.js');
const {player_login} = require('../controllers/player_loginCont.js');

const router = express.Router();

router.post('/club_login',club_login);
router.post('/player_login',player_login);


module.exports = router;