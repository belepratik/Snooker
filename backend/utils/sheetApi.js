require("dotenv").config();
var express = require("express");
var {google} = require("googleapis");

var app = express();
app.use(express.json());

const spreadsheetId = process.env.sheet_id;
console.log(spreadsheetId);

const auth = new google.auth.GoogleAuth({
    keyFile: "accounts_creds.json",
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });


const read = async (range,spreadsheet = spreadsheetId)=>{
  const client = await auth.getClient();
    const googleSheets = google.sheets({ version: "v4", auth: client });

    const response = await googleSheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetId,
      range: range,
    });
    
    const rows = response.data.values;
    // console.log(rows);
    
    return rows;
}
const append = async (range, values, spreadsheet = spreadsheetId) => {
  const client = await auth.getClient();
    const googleSheets = google.sheets({ version: "v4", auth: client });

  return googleSheets.spreadsheets.values.append({
    auth,
    spreadsheetId,
    range,
    valueInputOption: "USER_ENTERED",
    resource: { values },
  });
};

const update = async (range,values,spreadsheet = spreadsheetId)=>{
    const client = await auth.getClient();
    const googleSheets = google.sheets({ version: "v4", auth: client });
    
    return googleSheets.spreadsheets.values.update({
        auth,
        spreadsheetId,
        range: range,
        valueInputOption: "RAW",
        resource:{values},
      });
};



module.exports = { update,read,append};