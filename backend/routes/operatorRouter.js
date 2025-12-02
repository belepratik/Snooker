let {addOperator} = require("../controllers/operatorEditCont");
const express = require("express");

const router = express.Router();

router.post("/addOperator", addOperator);

module.exports = router;