const { getUser } = require("../utils/authUtil");
const pool = require("../db/db");
const { print } = require("../utils/printReciptUtil");

const getTime = (timeStamp) => {
  const now = timeStamp ? new Date(timeStamp) : new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0"); // Months are 0-indexed
  const day = String(now.getDate()).padStart(2, "0");

  const dayOfWeek = now.getDay();

  // Array to map day index to day name
  const dayNames = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  // Get the name of the day
  const dayName = dayNames[dayOfWeek];
  // Combine them into the desired format
  const date = `${year}-${month}-${day}`;

  const time = now.toTimeString().split(" ")[0]; // Get time
  const dateTime = date + " " + time;
  return [dateTime, dayName];
};

const topup = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    let clubName = req.cookies.clubName;
    let uid = req.cookies.uid;

    let user = getUser(uid);

    let studio = user.Studio;
    let role = user.role;
    let operatorName = user.name;

    await connection.beginTransaction();

    let {
      playerId,
      name: player,
      amount,
      mode,
      lastBalance: lastTotal,
    } = req.body;

    lastTotal = parseFloat(lastTotal.split(" ")[1]);
    amount = parseInt(amount);
    const [dateTime, dayName] = getTime();

    let reciptData = {
      playerName: player,
      clubName: clubName,
      mode: mode,
      topupAmount: amount,
    };

    // getting previous  records

    // 1. last topup date ,last total amount

    let lastTopupSql = `SELECT RecordDate ,amount, lastTotal FROM topup WHERE  RecordDate = (
      SELECT MAX(RecordDate) FROM topup 
      WHERE Username = ? AND Studio = ?);`;

    let lastTopupValue = [player, studio];
    const [lastTopupResult] = await connection.query(
      lastTopupSql,
      lastTopupValue
    );

    // if last topup record exists
    if (lastTopupResult.length > 0) {
      let {
        RecordDate: lastTopupDate,
        amount: lastTopAmount,
        lastTotal: lastTotalAmount,
      } = lastTopupResult[0];

      const lastTopupDateFormatted = getTime(lastTopupDate)[0];
      
      let lastBalance = lastTotalAmount - lastTopAmount;
      reciptData.lastBalance = lastBalance;

      //  2. Last frames total

      const lastFrameSql = `SELECT SUM(share * occurrences) AS total FROM (SELECT FrameId,share,OffTime,(
                            (CASE WHEN LP01 = ? THEN 1 ELSE 0 END) +
                            (CASE WHEN LP02 = ? THEN 1 ELSE 0 END) +
                            (CASE WHEN LP03 = ? THEN 1 ELSE 0 END) +
                            (CASE WHEN LP04 = ? THEN 1 ELSE 0 END) +
                            (CASE WHEN LP05 = ? THEN 1 ELSE 0 END) +
                            (CASE WHEN LP06 = ? THEN 1 ELSE 0 END)
                            ) AS occurrences
                            FROM frames
                            WHERE Studio = ? 
                            AND OffTime > ?) AS frame_occurrences WHERE occurrences > 0;`;

      const lastFrameValue = [
        player,
        player,
        player,
        player,
        player,
        player,
        studio,
        lastTopupDateFormatted,
      ];
      const [lastFrameResult] = await connection.query(
        lastFrameSql,
        lastFrameValue
      );
      let frameTotal = lastFrameResult[0].total || 0;

      reciptData.frameTotal = frameTotal;

      // 3. Last purchases

      const purchase = `SELECT sum(amount) as total FROM purchase WHERE UserName = ? AND Studio = ? AND RecordDate > ?;`;
      const purchaseValue = [player, studio, lastTopupDateFormatted];
      const [purchaseResult] = await connection.query(purchase, purchaseValue);
      let purchaseTotal = purchaseResult[0].total || 0;
      reciptData.purchaseTotal = purchaseTotal;
    } 

    // If no previous topup record
    else {

      reciptData.lastBalance = 0;

      const lastFrameSql = `SELECT SUM(share * occurrences) AS total FROM (SELECT FrameId,share,OffTime,(
        (CASE WHEN LP01 = ? THEN 1 ELSE 0 END) +
        (CASE WHEN LP02 = ? THEN 1 ELSE 0 END) +
        (CASE WHEN LP03 = ? THEN 1 ELSE 0 END) +
        (CASE WHEN LP04 = ? THEN 1 ELSE 0 END) +
        (CASE WHEN LP05 = ? THEN 1 ELSE 0 END) +
        (CASE WHEN LP06 = ? THEN 1 ELSE 0 END)
        ) AS occurrences
        FROM frames
        WHERE Studio = ? ) AS frame_occurrences WHERE occurrences > 0;`;

      const lastFrameValue = [
        player,
        player,
        player,
        player,
        player,
        player,
        studio,
      ];
      const [lastFrameResult] = await connection.query(
        lastFrameSql,
        lastFrameValue
      );
      let frameTotal = lastFrameResult[0].total || 0;

      reciptData.frameTotal = frameTotal;

      // 3. Last purchases

      const purchase = `SELECT sum(amount) as total FROM purchase WHERE UserName = ? AND Studio = ?;`;
      const purchaseValue = [player, studio];
      const [purchaseResult] = await connection.query(purchase, purchaseValue);
      let purchaseTotal = purchaseResult[0].total || 0;

      reciptData.purchaseTotal = purchaseTotal;

    }

    // console.log(reciptData);

    // Insert into topup table
    const sql =
      "INSERT INTO topup (RecordDate, UserName, amount, studio, Mode ,lastTotal,operator) VALUES (?, ?, ?, ?,?, ?,?)";
    const values = [dateTime, player, amount, studio, mode, lastTotal,role == "operator"? operatorName : "admin"];
    await connection.query(sql, values);

    // Update masterplayer table
    const sql2 =
      "UPDATE masterplayer SET `Total` = `Total` - ? , `TableMoney` = `TableMoney` - ? WHERE S_No = ?  ";
    const value2 = [amount, amount, playerId];
    await connection.query(sql2, value2);

    // Commit the transaction
    await connection.commit();
    // print(reciptData);
    if (studio == "Studio 313" || studio == "Studio 810") {
      res.json({
        success: true,
        data: reciptData,
        msg: "Top-up added successfully.",
      });
    } else {
      res.json({
        success: true,
        msg: "Top-up added successfully.",
      });
    }
  } catch (error) {
    // Rollback the transaction in case of error
    await connection.rollback();
    console.error("Error during top-up:", error);
    res.status(500).json({ success: false, error: "Failed to top-up." });
  } finally {
    // Release the connection back to the pool
    connection.release();
  }
};

const purchase = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    let uid = req.cookies.uid;

    let user = getUser(uid);

    let role = user.role;
    let operatorName = user.name;

    let data = req.body;
    let player = data.name;
    let amount = parseInt(data.amount);
    let item = data.item.replace(/,\s*$/, "");

    let itemList = item.split(",");
    let studio = data.studio;
    const [dateTime, dayName] = getTime();

    // Insert into purchase table
    const sql =
      "INSERT INTO purchase (RecordDate, UserName, amount, studio, Item, operator) VALUES (?, ?, ?, ?, ?, ?)";
    let values = [dateTime, player, amount, studio, item, role == "operator"? operatorName : "admin"];
    await connection.query(sql, values);

    // Update stock for each item
    for (const items of itemList) {
      const stockSql =
        "UPDATE masteritem SET `stocks` = `stocks` - 1 WHERE itemName = ? AND studio = ?";
      let stockValue = [items, studio];
      await connection.query(stockSql, stockValue);
    }

    // Update player's total
    const sql2 =
      "UPDATE masterplayer SET `Total` = `Total` + ? WHERE `Players` = ? AND FIND_IN_SET(?, Studio)>0 ";
    let value2 = [amount, player, studio];
    await connection.query(sql2, value2);

    // Update masterstudio for goods
    const studioSql =
      "UPDATE masterstudio SET `Goods` = `Goods` + ? WHERE `Studio` = ?";
    let value3 = [amount, studio];
    await connection.query(studioSql, value3);

    let date = dateTime.split(" ")[0];

    // Update studioDaily for goods
    const checkSql =
      "SELECT COUNT(*) as count FROM studioDaily WHERE `Studio` = ? AND `date` = ?";
    const [checkResult] = await connection.query(checkSql, [studio, date]);

    if (checkResult[0].count > 0) {
      // Update studioDaily if record exists
      const dailySql =
        "UPDATE studioDaily SET `Goods` = `Goods` + ? WHERE `Studio` = ? AND `date` = ?";
      const dailyValue = [amount, studio, date];
      await connection.query(dailySql, dailyValue);
    } else {
      // Insert into studioDaily if record does not exist
      const InsertDaily =
        "INSERT INTO studioDaily (Date, day, Studio, Goods) VALUES (?, ?, ?, ?)";
      const insertValues = [date, dayName, studio, amount];
      await connection.query(InsertDaily, insertValues);
    }
    // Commit the transaction
    await connection.commit();
    res.json({ success: true });
  } catch (error) {
    // Rollback the transaction in case of error
    await connection.rollback();
    console.error("Error during purchase:", error);
    res.status(500).json({ success: false, error: "Failed purchase" });
  } finally {
    // Release the connection back to the pool
    connection.release();
  }
};

const adjustment = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    // Start a transaction
    await connection.beginTransaction();

    let data = req.body;

    let winnerName = data.winnerName;
    let loserName = data.loserName;
    let amount = parseInt(data.amount);
    let studio = data.studio;
    const [dateTime, dayName] = getTime();

    // Insert into adjustment table
    const sql =
      "INSERT INTO adjustment (RecordDate, amount, studio, losser, winner) VALUES (?, ?, ?, ?, ?)";
    let adjustValues = [dateTime, amount, studio, loserName, winnerName];
    await connection.query(sql, adjustValues);

    // Update winner's total
    const sql1 =
      "UPDATE masterplayer SET `Total` = `Total` - ? WHERE `Players` = ? AND FIND_IN_SET(?, Studio)>0";
    let values = [amount, winnerName, studio];
    await connection.query(sql1, values);

    // Update loser's total
    const sql2 =
      "UPDATE masterplayer SET `Total` = `Total` + ? WHERE `Players` = ? AND FIND_IN_SET(?, Studio)>0";
    let value = [amount, loserName, studio];
    await connection.query(sql2, value);

    // Commit the transaction
    await connection.commit();
    res.json({ success: true, msg: "Adjustment completed successfully." });
  } catch (error) {
    // Rollback the transaction in case of error
    await connection.rollback();
    console.error("Error during adjustment:", error);
    res.status(500).json({ success: false, error: "Failed to adjust." });
  } finally {
    // Release the connection back to the pool
    connection.release();
  }
};

module.exports = {
  topup,
  purchase,
  adjustment,
};
