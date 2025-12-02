const express = require("express");
    
const route = express.Router();

const {
  createOrders,
  verifyPayment,
} = require("../controllers/playerPaymentCont");

route.post("/createOrder", createOrders);
route.post("/verifyOrder", verifyPayment);

module.exports = route;