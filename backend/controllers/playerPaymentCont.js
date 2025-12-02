const { createRazorpayInstance } = require("../config/razorpayConfig.js");
const crypto = require("crypto");
const dotenv = require("dotenv");
const pool = require("../db/db");
const { getUser } = require("../utils/authUtil");

dotenv.config();
const razorpayInstance = createRazorpayInstance();

const createOrders = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const uid = req.cookies.uid;
    let user = getUser(uid);
    const playerId = user.S_No;

    console.log('uid for payment :>> ', playerId );

    // ✅ get player's balance (or Total, depending on schema)
    const amountSql = "SELECT Total, onlinePay FROM masterplayer WHERE S_No = ?";
    const [amountResult] = await connection.query(amountSql, [playerId]);
    const balance = amountResult[0]?.Total || 0;
    const payOnline = amountResult[0]?.onlinePay || 0;

    if (!payOnline) {
      console.error("Online payment not enabled for this player");
      return res.status(400).json({
        success: false,
        message: "Online payment not enabled for this player",
      });
    }

    const options = {
      amount: balance * 100, // smallest currency unit
      currency: "INR",
      receipt: `receipt_${playerId}`,
    };

    razorpayInstance.orders.create(options, (err, order) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: "Error creating order",
          error: err.message,
        });
      }
      return res.status(200).json({
        success: true,
        order,
      });
    });
  } catch (error) {
    console.log("error ",error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  } finally {
    connection.release();
  }
};

const verifyPayment = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { orderId, paymentId, signature } = req.body;

    const uid = req.cookies.uid;
    let user = getUser(uid);
    const playerId = user.S_No;

    const amountSql = "SELECT Total FROM masterplayer WHERE S_No = ?";
    const [amountResult] = await connection.query(amountSql, [playerId]);
    const balance = amountResult[0]?.Total || 0;

    const secret = process.env.RAZORPAY_KEY_SECRET;
    
console.log("Razorpay Secret:", process.env.RAZORPAY_KEY_SECRET);
 
    const hmac = crypto.createHmac("sha256", secret);
    hmac.update(orderId + "|" + paymentId);

    const generatedSign = hmac.digest("hex");

    if (generatedSign !== signature) {
      return res.status(400).json({
        success: false,
        message: "Payment verification failed",
      });
    }

    // ✅ Razorpay verified
    await connection.beginTransaction();

    try {
      const sql = `
        UPDATE masterplayer 
        SET Total = Total - ?, TableMoney = TableMoney - ?
        WHERE S_No = ?
      `;
      const values = [balance, balance, playerId];

      const [updateResult] = await connection.query(sql, values);

      if (updateResult.affectedRows === 0) {
        throw new Error("Player not found or balance not updated.");
      }

      await connection.commit();

      return res.status(200).json({
        success: true,
        message: "Payment verified successfully and balance updated",
      });
    } catch (dbErr) {
      await connection.rollback();
      console.error("DB Error after payment verification:", dbErr);

      return res.status(500).json({
        success: false,
        message:
          "Payment was verified with Razorpay, but balance update failed.",
        error: dbErr.message,
      });
    }
  } catch (error) {
    console.error("Error in verifyPayment:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  } finally {
    connection.release();
  }
};

module.exports = {
  createOrders,
  verifyPayment,
};
