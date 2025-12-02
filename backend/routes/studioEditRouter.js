const express = require('express');
const {stocksEdit,addItem,addExpense} = require('../controllers/studioEditCont.js');

const router = express.Router();

router.post('/stocksEdit',stocksEdit);
router.post('/addItem',addItem);
router.post('/addExpense',addExpense);


module.exports = router;