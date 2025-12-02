const dotenv = require("dotenv")
const jwt = require("jsonwebtoken");

dotenv.config({
  path:'./.env'
})

var privateKey = process.env.privateKey;
function setUser(user){
    return jwt.sign(user,privateKey);
}

function getUser(token){
  if(!token) return null ; 
  try {
    let user = jwt.verify(token,privateKey);
  return user;
  } catch (error) {
    return null ; 
  }
}

module.exports = {
    setUser, getUser
}
