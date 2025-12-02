const express = require('express');
const {offMatch} = require('../controllers/offMatchCont.js');
const {onMatch} = require('../controllers/onMatchcont.js');
const { pauseMatch,resumeMatch} = require('../controllers/pauseMatchCont');

const router = express.Router();

router.post('/offMatch',offMatch);
router.post('/onMatch',onMatch);

router.post('/pauseMatch', pauseMatch);
router.post('/resumeMatch', resumeMatch);

module.exports = router;
