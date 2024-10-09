const crypto = require("crypto");
const VerificationCode = require("../../models/VerificationCode");
const { sendVerificationEmail } = require("../../utils/emailService");
const responseMessages = require("../../constants/responsesMessages");
const { User } = require("../../models/User");
const createResponse = require("../../utils/createResponse");

// Function to validate email format
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Request verification code for email
exports.requestVerificationCode = async (req, res) => {
  const { email } = req.body;

  // Check if email is provided and valid
  if (!email) {
    return res.status(400).json(createResponse("Invalid email address" , "error" , 400));
  }
  if (!isValidEmail(email)) {
    return res.status(400).json(createResponse("Invalid email format.","error" ,400));
  }

  try {
    // Check if the user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json(createResponse("User with this email already exists.","error" , 400));
    }

    // Send verification email
    const result = await sendVerificationEmail(email,"new-user");
    if (!result.success) {
      return res.status(400).json(createResponse(result.message,"error", 400));
    }

    // Successfully sent verification email
    res.status(200).json(createResponse("Verification code sent to your email", " success" , 200));
  } catch (error) {
    res.status(500).json(responseMessages.serverError);
  }
};

// Verify the verification code for the email
exports.verifyCode = async (req, res) => {
  const { email, code } = req.body;

  try {
    // Find existing verification code entry
    const existingCodeEntry = await VerificationCode.findOne({ email, type:"new-user" });

    // Check if the code has expired
    if (existingCodeEntry) {
      if (new Date(existingCodeEntry.expiresAt) < new Date()) {
        return res.status(400).json(createResponse("The previous verification code has expired. Please request a new one.", "error" , 400));
      }
    }

    // Verify the code
    if (!existingCodeEntry || existingCodeEntry.code !== code) {
      return res.status(400).json(createResponse("Invalid verification code","error", 400));
    }

    if (new Date() > existingCodeEntry.expiresAt) {
      return res.status(400).json(createResponse("Verification code expired","error",400));
    }

    // Mark code as verified
    existingCodeEntry.isVerified = true;
    await existingCodeEntry.save();

    // Respond with success
    res.status(200).json(createResponse("Email verified successfully", "success" , 200));
  } catch (error) {
    res.status(500).json(responseMessages.serverError);
  }
};
