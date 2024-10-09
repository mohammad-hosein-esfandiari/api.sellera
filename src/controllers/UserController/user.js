
const { User } = require("../../models/User");
const createResponse = require("../../utils/createResponse");
const bcrypt = require('bcrypt');
const { body, validationResult } = require('express-validator');
require('dotenv').config();





// Get user information
exports.getUserInfo = async (req, res) => {
  try {
    let user;
    let selectFields =
      "wishlist first_name last_name email phone_number profile_image address roles";

    // Adjust selected fields based on user's roles
    if (req.user.roles.includes("seller")) {
      selectFields += " isAuthorized website_id payment_method national_code";
    }
    if (req.user.roles.includes("support")) {
      selectFields += " permissions";
    }

    // Retrieve user information with the adjusted fields
    user = await User.findById(req.user.id).select(selectFields);

    if (!user) {
      return res
        .status(404)
        .json(createResponse("User not found", "error", 404));
    }

    // Convert Mongoose document to a plain object
    let userObject = user.toObject();

    // Remove the _id field or any other fields that shouldn't be returned
    delete userObject._id;

    // Send user data along with new access token if it exists
    res.status(200).json({
      status: "success",
      statusCode: 200,
      message: "Data returned successfully",
      data: req.user.newAccessToken
        ? { ...userObject, newAccessToken: req.user.newAccessToken }
        : userObject,
    });
  } catch (error) {
    res.status(500).json(createResponse("Internal Server Error", "error", 500));
  }
};








// Update user information
exports.updateUser = async (req, res) => {
  try {
    const userId = req.user.id; // Get user ID from token
    const updates = req.body; // Get update information from the request body

    const user = await User.findById(userId);
    if (!user) {
      return res
        .status(404)
        .json(createResponse("User not found", "error", 404));
    }

    // Define editable fields (excluding email and phone number)
    let editableFields = [
      "first_name",
      "last_name",
      "profile_image",
      "birthdate",
      "address",
    ];


    // Check and prevent email and phone number changes
    if (updates.email || updates.phone_number) {
      return res
        .status(400)
        .json(
          createResponse(
            "Email and phone number cannot be edited.",
            "error",
            400
          )
        );
    }

    // Update only editable fields
    Object.keys(updates).forEach((key) => {
      if (editableFields.includes(key)) {
        user[key] = updates[key];
      }
    });

    await user.save(); // Save changes to the database

    return res
      .status(200)
      .json(
        createResponse("User updated successfully", "success", 200, { data: user })
      );
  } catch (error) {
    return res
      .status(500)
      .json(createResponse("Internal Server Error", "error", 500));
  }
};









// Validation rules for the change password request
exports.validationChangePassword = [
  body('currentPassword')
    .notEmpty().withMessage('Current password is required.'),
  body('newPassword')
    .isLength({ min: 8 }).withMessage('New password must be at least 8 characters long.')
    .matches(/[A-Z]/).withMessage('New password must contain at least one uppercase letter.')
    .matches(/[a-z]/).withMessage('New password must contain at least one lowercase letter.')
    .matches(/\d/).withMessage('New password must contain at least one number.')
    .matches(/[\W]/).withMessage('New password must contain at least one special character.')
];

// Change Password Controller
exports.changePassword = async (req, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).send(createResponse(errors.array(), 'error', 400));
  }

  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id; // Get user ID from token

    // Find the user in the database
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).send(createResponse('User not found.', 'error', 404));
    }

    // Compare current password with the one stored in the database
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).send(createResponse('Current password is incorrect.', 'error', 400));
    }

    // Hash the new password
    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS, 10); // You can use your configured salt rounds
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update the password in the database
    user.password = hashedPassword;
    await user.save();

    // Send success response
    return res.send(createResponse('Password changed successfully.', 'success', 200));
  } catch (error) {
    return res.status(500).send(createResponse('Error changing password.', 'error', 500));
  }
};
