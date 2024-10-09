const crypto = require("crypto");
const VerificationCode = require("../../models/VerificationCode");
const { sendVerificationEmail } = require("../../utils/emailService");
const { User } = require("../../models/User");
const responseMessages = require("../../constants/responsesMessages");
const Session = require("../../models/Session");
const createResponse = require("../../utils/createResponse");
const verifyCode = require("../../utils/verifyCode");

// Utility function to generate response messages


exports.requestAccountDeletion = async (req, res) => {
  const userId = req.user.id; // Get the user ID from the request

  try {
    // Find user by userId
    const user = await User.findById(userId);
    if (!user) {
      // If the user is not found, return a 404 response
      return res.status(404).json(createResponse("User not found.", "error", 404));
    }

    // Send verification code to user email
    const result = await sendVerificationEmail(user.email, "user-delete-account");
    if (!result.success) {
      // If sending email fails, return a 400 response with the error message
      return res.status(400).json(createResponse(result.message, "error", 400));
    }

    // Return success response when verification code is sent
    res.status(200).json(createResponse("Verification code sent to your email.", "success", 200));
  } catch (error) {
    // Handle server error and return a generic error response
    res.status(500).json(responseMessages.serverError);
  }
};

exports.deleteAccount = async (req, res) => {
  const { code } = req.body; // Get the verification code from the request body
  const userId = req.user.id; // Get the user ID from the request

  try {
    // Find user by userId
    const user = await User.findById(userId);
    if (!user) {
      // If the user is not found, return a 404 response
      return res.status(404).json(createResponse("User not found.", "error", 404));
    }


         // Verify the code using the utility function
         const verificationResult = await verifyCode(code,user.email,"user-delete-account");

         // If the verification fails, return an error message
         if (!verificationResult.success) {
           return res.status(400).json(createResponse(verificationResult.message, "error", 400));
         }

    try {
      // Delete user account from the database
      await User.findByIdAndDelete(userId);
    } catch (error) {
      // If deletion fails, return an error response
      return res.status(400).json(createResponse("Error on Delete User!", "error", 400));
    }

    try {
      // Delete the verification code from the database
      await VerificationCode.deleteOne({ email: user.email , code , type:"user-delete-account"});
    } catch (error) {
      // If deletion fails, return an error response
      return res.status(400).json(createResponse("Error on Delete verification!", "error", 400));
    }

    const token = req.headers["authorization"]?.split(" ")[1]; // Get the access token from headers
    try {
      // Delete the user's session based on access token and system type
      await Session.deleteOne({
        "session.accessToken": token,
        "session.systemType": req.headers["user-agent"],
      }).select("session");
    } catch (err) {
      // If deletion fails, return an error response
      return res.status(400).json(createResponse("Error on Delete session!", "error", 400));
    }

    // Return success response when the account is deleted
    res.status(200).json(createResponse("Account deleted successfully.", "success", 200));
  } catch (error) {
    // Handle server error and return a generic error response
    res.status(500).json(responseMessages.serverError);
  }
};
