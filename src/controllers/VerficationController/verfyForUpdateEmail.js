const crypto = require("crypto");
const VerificationCode = require("../../models/VerificationCode");
const { sendVerificationEmail } = require("../../utils/emailService");
const { User } = require("../../models/User");
const createResponse = require("../../utils/createResponse");
const verifyCode = require("../../utils/verifyCode");
const { isValidEmail } = require("../../utils/isValidEmail");






// Request verification code for old email
exports.requestVerificationCodeForOldEmail = async (req, res) => {
  const { oldEmail } = req.body;

  if (!oldEmail) {
    return res.status(400).json(createResponse("Old email is invalid.", "error", 400));
  }
  if (!isValidEmail(oldEmail)) {
    return res.status(400).json(createResponse("Invalid format for old email.", "error", 400));
  }

  try {
    // Send verification code to old email
    const result = await sendVerificationEmail(oldEmail, 'old-email-change');
    if (!result.success) {
      return res.status(400).json(createResponse(result.message, "error", 400));
    }

    res.status(200).json(createResponse("Verification code sent to old email.", "success", 200));
  } catch (error) {
    res.status(500).json(createResponse("Error sending verification code.", "error", 500));
  }
};







// Verify code from old email and request new email
exports.verifyOldEmailCode = async (req, res) => {
  const { oldEmail, code } = req.body;

  if (!oldEmail || !code) {
    return res.status(400).json(createResponse("Old email or verification code is invalid.", "error", 400));
  }

  try {
         // Verify the code using the utility function
         const verificationResult = await verifyCode(code,oldEmail,"old-email-change");

         // If the verification fails, return an error message
         if (!verificationResult.success) {
           return res.status(400).json(createResponse(verificationResult.message, "error", 400));
         }

    // Mark email as verified
    await VerificationCode.findOneAndUpdate({ email: oldEmail , code , type:"old-email-change"}, { isVerified: true });

    // Now ask for the new email from the user
    res.status(200).json(createResponse("Old email verification code verified. Now please enter your new email.", "success", 200));
  } catch (error) {
    res.status(500).json(createResponse("Error verifying the verification code.", "error", 500));
  }
};







// Request verification code for new email
exports.requestVerificationCodeForNewEmail = async (req, res) => {
  const { oldEmail, newEmail } = req.body;

  if (!newEmail) {
    return res.status(400).json(createResponse("New email is invalid.", "error", 400));
  }
  if (!isValidEmail(newEmail)) {
    return res.status(400).json(createResponse("Invalid format for new email.", "error", 400));
  }

  try {
    // Check if the old email is verified
    const oldVerificationEntry = await VerificationCode.findOne({ email: oldEmail , type:"old-email-change" });

    if (!oldVerificationEntry || !oldVerificationEntry.isVerified) {
      return res.status(400).json(createResponse("Old email is not verified.", "error", 400));
    }

    // Delete old email verification entry
    await VerificationCode.deleteOne({ email: oldEmail , type:"old-email-change" });

    // Check if the new email already exists in the system
    const existingUser = await User.findOne({ email: newEmail });
    if (existingUser) {
      return res.status(400).json(createResponse("New email already exists.", "error", 400));
    }

    // Send verification code to new email
    const result = await sendVerificationEmail(newEmail,"new-email-change");
    if (!result.success) {
      return res.status(400).json(createResponse(result.message, "error", 400));
    }

    res.status(200).json(createResponse("Verification code sent to new email.", "success", 200));
  } catch (error) {
    res.status(500).json(createResponse("Error sending verification code.", "error", 500));
  }
};








// Verify code and change email
exports.changeEmail = async (req, res) => {
  const { oldEmail, newEmail, code } = req.body;

  if (!newEmail || !code) {
    return res.status(400).json(createResponse("New email or verification code is invalid.", "error", 400));
  }
  if (!isValidEmail(newEmail)) {
    return res.status(400).json(createResponse("Invalid format for new email.", "error", 400));
  }

  try {
   // Verify the code using the utility function
         const verificationResult = await verifyCode(code,newEmail,"new-email-change");

         // If the verification fails, return an error message
         if (!verificationResult.success) {
           return res.status(400).json(createResponse(verificationResult.message, "error", 400));
         }

    // Change user's email
    const user = await User.findOneAndUpdate(
      { email: oldEmail }, // Find user by old email
      { email: newEmail }, // Update to the new email
      { new: true } // Return the updated document
    );

    if (!user) {
      return res.status(404).json(createResponse("User not found.", "error", 404));
    }

    // Delete verification codes for the new email
    await VerificationCode.deleteMany({ email: newEmail ,code , type:"new-email-change" });

    res.status(200).json(createResponse("User's email successfully changed.", "success", 200));
  } catch (error) {
    res.status(500).json(createResponse("Error changing email.", "error", 500));
  }
};
