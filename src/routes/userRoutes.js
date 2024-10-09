const express = require('express'); 
const router = express.Router(); 
const userController = require('../controllers/UserController/user'); 
const authenticateToken = require('../middlewares/authenticateToken'); 
const { addSellerRoleToUser, updateSellerFields, validationEditSellerRules, deletePaymentMethod, validationDeletePaymentMethod } = require('../controllers/UserController/roles');
const { validationResetPasswordRequest, requestPasswordReset, validationVerifyResetToken, verifyResetToken, validationResetPasswordChange, resetAndChangePassword } = require('../controllers/UserController/forgetPassword');

// Route to get user information
router.get("/info", authenticateToken, userController.getUserInfo);

// Route to update user information
router.put("/update", authenticateToken, userController.updateUser);

// Route to change password
router.put('/change-password' , authenticateToken , userController.validationChangePassword , userController.changePassword)

// Route to request password reset
router.post('/request-reset-password' , authenticateToken , validationResetPasswordRequest , requestPasswordReset)

// Route to verify reset token
router.post('/verify-reset-password', authenticateToken , validationVerifyResetToken ,verifyResetToken)

// Route to reset and change password
router.put('/reset-password',authenticateToken ,validationResetPasswordChange,resetAndChangePassword)

// Route to add the seller role to a user
router.put("/seller/add-role", authenticateToken, addSellerRoleToUser);

// Route to edit seller fields
router.put("/seller/update", authenticateToken, validationEditSellerRules, updateSellerFields);

// Route to delete payment method
router.delete("/seller/payment-method/:paymentMethodId", authenticateToken, validationDeletePaymentMethod ,deletePaymentMethod );

module.exports = router; // Exporting the router for use in other parts of the application
