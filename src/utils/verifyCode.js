const VerificationCode = require("../models/VerificationCode");


// Utility function to verify and delete verification code
const verifyCode = async (code , email , type) => {
  // Find the verification code in the database
  const verificationEntry = await VerificationCode.findOne({ code , email , type});

  // Step 1: Check if the verification code exists
  if (!verificationEntry) {
    return { success: false, message: "Verification code is incorrect." };
  }

  // Step 2: Check if the verification code has expired
  if (new Date(verificationEntry.expiresAt) < new Date()) {
    return { success: false, message: "The verification code has expired. Please request a new one." };
  }



  // Return success if everything is valid
  return { success: true };
};

module.exports = verifyCode;
