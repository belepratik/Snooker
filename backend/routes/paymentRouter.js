const express = require('express');
const {topup,purchase,adjustment} = require('../controllers/paymentCont.js');

const router = express.Router();

router.post('/topup',topup);
router.post('/purchase',purchase);
router.post('/adjustment',adjustment);

module.exports = router;
