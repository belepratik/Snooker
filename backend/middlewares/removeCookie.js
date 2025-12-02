
const removeCookie = (req, res, next) => {
  res.clearCookie('uid'); // Remove the 'uid' cookie
  next(); // Pass control to the next middleware or route handler
};

module.exports = {removeCookie} ;