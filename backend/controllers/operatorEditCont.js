const pool = require("../db/db");
const { getUser } = require("../utils/authUtil");

const addOperator = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const { operatorName, mobile, pin } = req.body;
    console.log('req.body', req.body);

    const uid = req.cookies.uid;
    const user = getUser(uid);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (!user.role || user.role !== "admin") {
      return res.status(403).json({ error: "Unauthorized access" });
    }

    const studio = user.Studio;
    const securityKey = user.securityKey;
    const clubName = req.cookies.clubName;

    // ✅ Check if operator with the same name already exists in the same studio
    const checkSql = `SELECT * FROM operators WHERE Operator_name = ? AND studio = ?`;
    const [existing] = await connection.query(checkSql, [operatorName, studio]);

    if (existing.length > 0) {
      await connection.rollback();
      return res.status(409).json({ error: "Operator with this name already exists in this studio" });
    }

    // ✅ Insert new operator
    const insertSql = `INSERT INTO operators (Operator_name, Password, Mobile_No, studio, SecurityKey, clubName) VALUES (?, ?, ?, ?, ?, ?)`;
    const insertValues = [operatorName, pin, mobile, studio, securityKey, clubName];

    await connection.query(insertSql, insertValues);

    await connection.commit();
    res.status(200).json({ message: "Operator added successfully" });

  } catch (error) {
    await connection.rollback();
    console.error("Error in addOperator:", error);
    res.status(500).json({ error: "An error occurred while adding the operator" });
  } finally {
    connection.release();
  }
};



module.exports = { addOperator };