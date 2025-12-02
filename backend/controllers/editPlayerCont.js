const pool = require("../db/db");
const {validateInput} = require("../utils/validateInputUtil");
var {getUser } = require("../utils/authUtil");


const editPlayer = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    console.log("req.body", req.body);

    let data = req.body;
    let Sno = data.Sno;
    let mobile = data.mobile;
    let name = data.name;

    console.log('mobile ,name', mobile ,name);
    console.log("validate",validateInput(name, mobile));
    
    if (!validateInput(name, mobile)) {
      return res.status(400).json({ success: false, message: "Invalid input." });
    }

    if (Sno && mobile) {
      console.log(mobile);
      
      let mobileCheckSql = `Select S_no from masterplayer where mobileNo = ?`;
      let mobileCheck = await connection.query(mobileCheckSql, [mobile.trim()]);

      if(mobileCheck[0].length >0){
        return res.status(400).json({ success: false, message: "Mobile number already exists." });
      }
      else{
        let mobileChangeSql = `update masterplayer SET mobileNo = ? where S_no = ?`;
        await connection.query(mobileChangeSql,[mobile.trim(),Sno]);
      }

    }
    if (Sno && name) {
      console.log("name",name);
      let nameCheckSql = `Select S_no from masterplayer where Players = ?`;
      let nameCheck = await connection.query(nameCheckSql, [name.trim()]);

      if(nameCheck[0].length >0){
        return res.status(400).json({ success: false, message: "name already exists." });
      }
      else{
        let nameChangeSql = `update masterplayer SET Players = ? where S_no = ?`;
        await connection.query(nameChangeSql,[name.trim(),Sno]);
      }
      
    }
    await connection.commit();
    return res.status(200).json({ success: true, message: "Player details updated successfully." });

  } catch (error) {
    console.error("Error adding player:", error);
    await connection.rollback();
    return res
      .status(500)
      .json({ success: false, error: "Failed to add player" });
  } finally {
    connection.release();
  }
};
const lockNfc = async(req, res) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const { nfcOption, playerName, studioId } = req.body;
    const uid = req.cookies.uid;
    const user = getUser(uid);

    // Update only for this player in this studio
    const updateSql = `
      UPDATE masterplayer 
      SET nfcOption = ? 
      WHERE Players = ? AND Studio = ?`;
    
    const [result] = await connection.query(updateSql, [
      nfcOption, 
      playerName, 
      studioId
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ 
        success: false, 
        message: "Player not found in specified studio" 
      });
    }

    await connection.commit();
    return res.status(200).json({ 
      success: true, 
      message: "NFC option updated successfully" 
    });
  } catch(error) {
    await connection.rollback();
    console.error("Error updating NFC:", error);
    return res.status(500).json({ 
      success: false, 
      error: "Failed to update NFC Option" 
    });
  } finally {
    connection.release();
  }
}

module.exports = { editPlayer, lockNfc };
