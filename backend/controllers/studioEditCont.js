const pool = require("../db/db");
const { getUser } = require("../utils/authUtil");

const insertOperatorLog = async (connection ,operatorData) => {
  let operatorLogSql = `insert into operatorLogs (studio, role, operatorId, action, details,operatorName)
          values (?,?,?,?,?,?)`;
  await connection.query(operatorLogSql, operatorData);
  
};

// edit stocks of an item

const stocksEdit = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const { stockSno, stockAmount ,stockName,prevStocks} = req.body;

    const uid = req.cookies.uid;
    let user = getUser(uid);

    let studio = user.Studio;
    let operatorId = user.operatorId;
    let operatorName = user.name;
    let stocksAdded = stockAmount - prevStocks;

    if (!isNaN(stockSno) && !isNaN(stockAmount)) {
      let stockChangeSql = `update masteritem SET Stocks = ? where sno = ?`;
      let value = [stockAmount, stockSno];
      await connection.query(stockChangeSql, value);

      let operatorValue = [
        studio,
        operatorId ? "operator":"admin",
        operatorId || null,
        "Stocks updated",
        `${stocksAdded} Stocks added for ${stockName}`,
        operatorName || "admin",
      ];

      await insertOperatorLog(connection ,operatorValue);

      await connection.commit();

      return res
        .status(200)
        .json({ success: true, message: "Stocks updated successfully." });
    } else {
      return res
        .status(400)
        .json({ success: false, message: "Invalid input." });
    }
  } catch (error) {
    await connection.rollback();
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Internal server error.",
      error: error.message,
    });
  } finally {
    connection.release();
  }
};

// add item to inventory

const addItem = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const { itemName, itemPrice, itemStock } = req.body;

    const uid = req.cookies.uid;
    let user = getUser(uid);
    let { Studio, operatorId ,operatorName} = user;

    if (!isNaN(itemPrice) && !isNaN(itemStock)) {
      let addItemSql = `Insert into masteritem (itemname, price , stocks , studio) values(?,?,?,?)`;
      let value = [itemName, itemPrice, itemStock, Studio];
      await connection.query(addItemSql, value);

      let operatorValue = [
        Studio,
        operatorId ? "operator" : "admin",
        operatorId || null,
        `New item added`,
        `${itemName} added to inventory with price ${itemPrice} and stocks ${itemStock}`,
        operatorName || "admin",
      ];

      await insertOperatorLog(connection ,operatorValue);

      await connection.commit();

      return res
        .status(200)
        .json({ success: true, message: "Item added successfully." });
    } else {
      return res
        .status(400)
        .json({ success: false, message: "Invalid input." });
    }
  } catch (error) {
    await connection.rollback();
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Internal server error.",
      error: error.message,
    });
  } finally {
    connection.release();
  }
};

// add expense 

const addExpense = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const {expense,description,password} = req.body[0];

    const uid = req.cookies.uid;
    let user = getUser(uid);

    let { Studio,role, operatorId ,name : operatorName} = user;

    let validPass = false;

    if(role == "admin"){
      let checkPass = `select * from masterstudio where Studio = ? and ownerPass = ?`;
      let checkValue = [Studio,password];
      let [checkPassRes] = await connection.query(checkPass,checkValue);
      if(checkPassRes.length == 0){
        await connection.rollback();
        console.log(" Invalid Admin Password");
        return res.status(401).json({success:false, message :"Invalid Password" });
      }else{
        validPass = true;
        
      }
    }

    if(role == "operator"){
      let checkPass = `Select * from operators where Operator_name = ? and password = ?`;
      let checkValue = [operatorName,password];
      let [checkPassRes] = await connection.query(checkPass,checkValue);
      if(checkPassRes.length == 0){
        await connection.rollback();
        console.log(" Invalid Operator Password");
        return res.status(401).json({success:false, message :"Invalid Password" });
      }else{
        validPass = true;
      }
    }

    if(validPass){
      let addExpenseSql = `Insert into expense (studio, amount, purpose) values(?,?,?)`;
      let value = [Studio, expense,description];
      await connection.query(addExpenseSql, value);
      
      let operatorValue = [
        Studio,
        operatorId ? "operator" : "admin",
        operatorId || null,
        `Expense of Rs. ${expense} added`,
        `Rs. ${expense} added to expenses for ${description}`,
        operatorName || "admin",
      ];

      try {
        await insertOperatorLog(connection, operatorValue);
        
      } catch (error) {
        await connection.rollback();
        console.error("Failed to insert log:", error);
        return res.status(500).json({ success: false, message: "Failed to log expense action." });
      }

      await connection.commit();

      return res
        .status(200)
        .json({ success: true, message: "Expense added successfully." });
    }  
  } catch (error) { 
    await connection.rollback();
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Internal server error.",
      error: error.message,
    });
  } finally { 
    connection.release();
  }
}

module.exports = { stocksEdit, addItem ,addExpense};
