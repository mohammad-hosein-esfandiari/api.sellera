const express = require('express'); // Importing the express module
const router = express.Router(); // Creating a new router object
const verificationController = require('../../controllers/VerficationController/verificationCode'); // Importing the verification controller
const updateEmailController = require('../../controllers/VerficationController/verfyForUpdateEmail'); // Importing the controller for updating email verification
const authenticateToken = require('../../middlewares/authenticateToken'); // Importing middleware to authenticate tokens

// Request verification code for old email (for a new user wanting to register or change their email)
router.post('/request-verification-old-email', authenticateToken, updateEmailController.requestVerificationCodeForOldEmail);

// Verify code from old email and request a new email
router.post('/verify-old-email-code', authenticateToken, updateEmailController.verifyOldEmailCode);

// Request verification code for new email
router.post('/request-verification-new-email', authenticateToken, updateEmailController.requestVerificationCodeForNewEmail);

// Verify code and change email
router.put('/change-email', authenticateToken, updateEmailController.changeEmail);

// Request verification code for email (for a new user wanting to register)
router.post('/request-verification', verificationController.requestVerificationCode);

// Verify code (for a new user wanting to register)
router.post('/verify-code', verificationController.verifyCode);

module.exports = router; // Exporting the router for use in other parts of the application
