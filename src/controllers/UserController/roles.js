// Add seller role to user
const Session = require("../../models/Session");
const { User } = require("../../models/User");
const {param, body, validationResult } = require('express-validator');
const createResponse = require("../../utils/createResponse");
const { createToken, createRefreshToken } = require("../../utils/jwtTokenFunc");

const addSellerRoleToUser = async (req, res) => {
    try {
      const userId = req.user.id; // Get user ID from the token
      const newRole = "seller"; // New role to add
      const systemType = req.headers["user-agent"]; // Get the system type from headers
      const token = req.headers["authorization"]?.split(" ")[1]; // Extract token from authorization header
  
      const user = await User.findById(userId);
      if (!user) {
        return res
          .status(404)
          .json(createResponse("User not found", "error", 404)); // Return if user is not found
      }
  
      // Check if the role has already been added
      if (user.roles.includes(newRole)) {
        return res
          .status(400)
          .json(createResponse("Role already exists", "error", 400)); // Return error if the role already exists
      }
  
      // Add the new role to the roles array
      user.roles.push(newRole);
  
      // Delete the current session based on token and system type
      try {
        await Session.findOneAndDelete({
          "session.token": token,
          "session.systemType": req.headers["user-agent"],
        });
        // Session successfully deleted
      } catch (err) {
        // If an error occurs while deleting the session, return an error response
        return res
          .status(403)
          .json(createResponse("Error on Delete session!", "error", 403));
      }
  
      // Create Access Token
      const accessToken = createToken(user._id, user.roles);
  
      // Create Refresh Token
      const refreshToken = createRefreshToken(user._id, user.roles);
  
      // Create session for the user
      req.session.userId = user._id;
      req.session.isLoggedIn = true;
      req.session.systemType = systemType;
      req.session.accessToken = accessToken;
      req.session.refreshToken = refreshToken;
  
      await user.save(); // Save the user with the new role
  
      // Return the new access token to the user
      return res.status(200).json(
        createResponse("Role added and tokens refreshed", "success", 200, {
          data: { newAccessToken: accessToken },
        })
      );
    } catch (error) {
      // Internal server error response
      res.status(500).json(createResponse("Internal server error", "error", 500));
    }
  };



// Validation for input fields
const validationEditSellerRules = [
    body('national_code')
      .optional() // optional
      .isNumeric().withMessage('National code must be a number.')
      .isLength({ min: 10, max: 10 }).withMessage('National code must be 10 digits long.'),
  
    body('payment_method.card_number')
      .optional() // optional
      .isString().withMessage('Card number must be a string.')
      .isLength({ min: 16, max: 16 }).withMessage('Card number must be 16 digits long.'),
    
    body('payment_method.acc_number')
      .optional() // optional
      .isString().withMessage('Account number must be a string.'),
    
    body('payment_method.sheba_number')
      .optional() // optional
      .isString().withMessage('Sheba number must be a string.')
      .isLength({ min: 24, max: 24 }).withMessage('Sheba number must be 24 digits long.'),
];

const updateSellerFields = async (req, res) => {
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
      const { national_code, payment_method } = req.body; // Get necessary fields from the request body
      const userId = req.user.id; // Get user ID from token
  
      // Find user in the database
      const updatedUser = await User.findById(userId);
  
      if (!updatedUser) {
        return res.status(404).send(createResponse('User not found.', 'error', 404));
      }
  
      // If national code is provided, check for duplicates
      if (national_code) {
        const existingUser = await User.findOne({ national_code });
        if (existingUser && existingUser.id !== userId) {
          return res.status(400).send(createResponse('Duplicate national code.', 'error', 400));
        }
        updatedUser.national_code = national_code; // Update national code
      }
  
      // If payment_method is in the request body
      if (payment_method) {
        // Check for duplicate card number and sheba number
        const paymentMethods = updatedUser.payment_method || []; // Get user's payment methods
  
        // Check for duplicate card number and sheba number
        const cardExists = paymentMethods.some(m => m.card_number === payment_method.card_number);
        const shebaExists = paymentMethods.some(m => m.sheba_number === payment_method.sheba_number);
  
        if (cardExists) {
          return res.status(400).send(createResponse('Duplicate card number.', 'error', 400));
        }
        if (shebaExists) {
          return res.status(400).send(createResponse('Duplicate sheba number.', 'error', 400));
        }
  
        // Add new payment method to the array
        updatedUser.payment_method.push(payment_method);
      }
  
      // Check if all fields are filled to set isAuthorized to true
      if (updatedUser.national_code && updatedUser.payment_method.length > 0) {
        updatedUser.isAuthorized = true; // Set isAuthorized to true if all fields are filled
      }else{
        updatedUser.isAuthorized = false
      }
  
      // Save changes to the database
      await updatedUser.save();
  
      // Send response
      return res.send(createResponse('Seller fields updated successfully.', 'success', 200));
    } catch (error) {
      return res.status(500).send(createResponse('Error updating information.', 'error', 500));
    }
};



// Validation for payment method ID
const validationDeletePaymentMethod = [
    param('paymentMethodId')
      .isString().withMessage('Invalid payment method ID format.')
  ];


  const deletePaymentMethod = async (req, res) => {
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
      const userId = req.user.id; // Get user ID from token
      const { paymentMethodId } = req.params; // Get payment method ID from request params
        
 
      //  Check if user has seller role
    if(!req.user.roles.includes('seller')){
      return res.status(400).send(createResponse('Only seller can delete payment method.', 'error', 400));
    }

      // Find user in the database
      const user = await User.findById(userId);
   
      if (!user) {
        return res.status(404).send(createResponse('User not found.', 'error', 404));
      }


  
      // Check if payment method exists
      const paymentMethodIndex = user.payment_method.findIndex(pm => pm._id.toString() === paymentMethodId);
      if (paymentMethodIndex === -1) {
        return res.status(404).send(createResponse('Payment method not found.', 'error', 404));
      }
  
      // Remove the payment method from the array
      user.payment_method.splice(paymentMethodIndex, 1);
  


      // Check if payment method array has no item
      if(!user.payment_method.length){
        user.isAuthorized = false
      }

      // Save changes to the database
      await user.save();
  
      // Send response
      return res.send(createResponse('Payment method deleted successfully.', 'success', 200));
    } catch (error) {
      return res.status(500).send(createResponse('Error deleting payment method.', 'error', 500));
    }
  };
 
  module.exports = {validationEditSellerRules , updateSellerFields , addSellerRoleToUser , validationDeletePaymentMethod , deletePaymentMethod}
