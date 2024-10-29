const PasswordReset = require('../../models/PasswordReset');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt');

const { body, validationResult } = require('express-validator');
const createResponse = require('../../utils/createResponse');
const { User } = require('../../models/User');
require('dotenv').config();

// Validation for reset password request
exports.validationResetPasswordRequest = [
  body('email')
    .isEmail().withMessage('Please enter a valid email.')
];

// Controller for requesting password reset
exports.requestPasswordReset = async (req, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
      const formattedErrors = errors.array().reduce((acc, error) => {
          const { path, msg } = error;
          if (!acc[path]) {
              acc[path] = []; // Initialize an array for this field
          }
          acc[path].push(msg); // Add the message to the array
          return acc;
      }, {});

      return res.status(400).json(createResponse("Validation failed.", "error", 400, { errors: formattedErrors }));
  }

  try {
    const { email } = req.body;

    // Find user by email (assuming user must exist for password reset)
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).send(createResponse('User not found.', 'error', 404));
    }

      // Check if a verification code has been sent in the last minute
      const existingCodeEntry = await PasswordReset.findOne({ email });
      const now = Date.now();

  
      // If a code exists and is still valid, throw an error
      if (existingCodeEntry && now < new Date(existingCodeEntry.expiresAt).getTime()) {
        const timesLeft = Math.ceil((new Date(existingCodeEntry.expiresAt).getTime() - now) / 1000); // Calculate remaining time in seconds
        return res.status(401).json( createResponse('You can only request a reset password code once every 1 minutes. Time left: ' + timesLeft + ' seconds.' , "error" , 401));
      }

    // Generate a reset token and set expiration (1 hour)
    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(now + 60000); // Code is valid for 60 seconds

    // Save password reset request in PasswordReset model
    await PasswordReset.findOneAndUpdate(
        { email },
        { resetToken, expiresAt },
        { upsert: true } // Create a new entry if it doesn't exist
      );

    // Create reset link
    const resetCode = resetToken;

    // Send email with reset link
    const transporter = nodemailer.createTransport({
        service: 'gmail', 
        auth: {
          user: process.env.EMAIL_USER, // Email user from environment variables
          pass: process.env.EMAIL_PASS, // Email password from environment variables
        },
      });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Password Reset Request',
      html: `<h1>${resetCode}</h1> `,
    };

    await transporter.sendMail(mailOptions);

    return res.send(createResponse('Password reset link sent to your email.', 'success', 200));
  } catch (error) {
    return res.status(500).send(createResponse('Error in sending password reset email.', 'error', 500));
  }
};


// Validation for verifying the reset token
exports.validationVerifyResetToken = [
    body('resetToken')
      .notEmpty().withMessage('Reset token is required.'),
  ];
  
  // Controller for verifying the reset token
  exports.verifyResetToken = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const formattedErrors = errors.array().reduce((acc, error) => {
            const { path, msg } = error;
            if (!acc[path]) {
                acc[path] = []; // Initialize an array for this field
            }
            acc[path].push(msg); // Add the message to the array
            return acc;
        }, {});

        return res.status(400).json(createResponse("Validation failed.", "error", 400, { errors: formattedErrors }));
    }
  
    try {
      const { resetToken } = req.body;
  
      // Find the reset request by token
      const resetRequest = await PasswordReset.findOne({ resetToken });
      if (!resetRequest) {
        return res.status(404).send(createResponse('Invalid or expired reset token.', 'error', 404));
      }
  
      // Check if the reset token has expired
      if (Date.now() > resetRequest.expiresAt) {
        return res.status(400).send(createResponse('Reset token has expired.', 'error', 400));
      }

      resetRequest.isVerified = true
      await resetRequest.save();
  
      return res.send(createResponse('Reset token is valid.', 'success', 200));
    } catch (error) {
      return res.status(500).send(createResponse('Error in verifying reset token.', 'error', 500));
    }
  };





  // Validation for changing the password
exports.validationResetPasswordChange = [
    body('resetToken')
      .notEmpty().withMessage('Reset token is required.'),
    body('newPassword')
      .isLength({ min: 8 }).withMessage('Password must be at least 8 characters long.')
      .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter.')
      .matches(/[a-z]/).withMessage('Password must contain at least one lowercase letter.')
      .matches(/\d/).withMessage('Password must contain at least one number.')
      .matches(/\W/).withMessage('Password must contain at least one special character.'),
  ];
  
  // Controller for changing the password
  exports.resetAndChangePassword = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const formattedErrors = errors.array().reduce((acc, error) => {
            const { path, msg } = error;
            if (!acc[path]) {
                acc[path] = []; // Initialize an array for this field
            }
            acc[path].push(msg); // Add the message to the array
            return acc;
        }, {});

        return res.status(400).json(createResponse("Validation failed.", "error", 400, { errors: formattedErrors }));
    }
    try {
      const { resetToken, newPassword } = req.body;
  
      // Find the reset request by token
      const resetRequest = await PasswordReset.findOne({ resetToken });
      if (!resetRequest) {
        return res.status(404).send(createResponse('Invalid or expired reset token.', 'error', 404));
      }

      if(!resetRequest.isVerified){
        return res.status(400).send(createResponse('Reset token is not verified.', 'error', 400));
      }  
  
      // Find the user by email
      const user = await User.findOne({ email: resetRequest.email });
      if (!user) {
        return res.status(404).send(createResponse('User not found.', 'error', 404));
      }
  
      // Hash the new password
      const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS, 10);
      const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
  
      // Update the user's password
      user.password = hashedPassword;
      await user.save();
  
      // Remove the reset request
      await PasswordReset.deleteOne({ resetToken });
  
      return res.send(createResponse('Password has been successfully reset.', 'success', 200));
    } catch (error) {
      return res.status(500).send(createResponse('Error in resetting password.', 'error', 500));
    }
  };