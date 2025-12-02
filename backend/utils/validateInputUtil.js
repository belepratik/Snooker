function validateInput(name, mobile) {
  // Name checks
  if (name) {
    name = name.trim();
    if (!/^[a-zA-Z\s'-]+$/.test(name)) {

      return false;
    }
    if (name.length < 2 || name.length > 50) {
      return false;
    }
  }

  // Mobile number checks
  if (mobile) {
    mobile = mobile.replace(/\s+/g, "");
    if (!/^\d{10}$/.test(mobile)) {
      return false;
    }
  }
  return true;
}

module.exports = { validateInput };
