const express = require('express');
const {topup,purchase,adjustment,getTopups} = require('../controllers/paymentCont.js');

const router = express.Router();

router.post('/topup',topup);
router.post('/purchase',purchase);
router.post('/adjustment',adjustment);
router.get('/topup', getTopups);

module.exports = router;
