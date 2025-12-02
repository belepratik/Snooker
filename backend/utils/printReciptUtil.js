const escpos = require("escpos");

escpos.USB = require("escpos-usb");

const print = (data) => {
  let device;
  let printer;

  // Connect to the printer (USB in this case)
  try {
    device = new escpos.USB(); // Adjust for your connection type
    printer = new escpos.Printer(device);
  } catch (error) {
    console.log("Error initializing the printer:", error.message);
    return; // Exit gracefully
  }

  // const reciptData = {
  //   playerName: "Test Player",
  //   clubName: "Test Club",
  //   mode: "cash",
  //   lastBalance: 100,
  //   framesTotal: 100,
  //   purchases: 100,
  //   topAmount: 100,
  // };

  const {
    playerName,
    clubName,
    mode,
    topupAmount,
    lastBalance,
    frameTotal,
    purchaseTotal: purchases,
  } = data;

  console.log("printData", data);

  const totalBalance =
    parseFloat(lastBalance) + parseFloat(purchases) + parseFloat(frameTotal);
  const newBalance = totalBalance - parseFloat(topupAmount);

  try {
    device.open(function (err) {
      if (err) {
        console.error(
          "Printer device not connected or not accessible:",
          err.message
        );
        return; // Exit gracefully
      }

      printer
        .align("ct") // Center-align all content
        .text(Snookerplus) // Business name
        .text(clubName) // Business name
        .text("") // Empty line
        .text(`Name: ${playerName}`)
        // .text(`Player ID: `)
        .text("") // Empty line
        .drawLine() // Separator
        .text("Prev Balance: Rs. " + lastBalance)
        .text("Matches Total: Rs. " + frameTotal)
        .text("") // Empty line
        .text("Total Purchases: Rs. " + purchases)
        // .text("Chips: ₹________")
        // .text("Water: ₹________")
        // .text("Biscuits: ₹________")
        .text("") // Empty line
        .text("Total: Rs. " + totalBalance)
        .drawLine() // Separator
        .text("Topup: Rs. " + topupAmount)
        .text("New Balance: Rs. " + newBalance)
        .text("Modeof Payment: " + mode)
        .drawLine() // Separator
        .text(`Thank you for playing at ${clubName}!`)
        .cut() // Auto-cut
        .close(); // Finish the printing process
    });

    console.log("Printing completed successfully!");
    return;
  } catch (error) {
    console.error("An error occurred during the printing process:", error);
  }
};

module.exports = { print };
