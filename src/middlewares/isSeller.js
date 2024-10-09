const { User } = require("../models/User");
const { Website } = require("../models/Website");
const createResponse = require("../utils/createResponse");

// Middleware to check if the user is a seller and validate their authorization
const isSeller = async (req, res, next) => {
  try {
    const sellerId = req.user.id;

    // Fetch user from the database
    const user = await User.findById(sellerId);

    // Check if the user exists and has a 'seller' role
    if (!user || !user.roles.includes('seller')) {
      return res.status(403).send(createResponse('You do not have permission to work on a website.', 'error', 403));
    }

    // Check if the user is authorized to perform seller actions
    if (!user.isAuthorized) {
      return res.status(400).send(createResponse('Your account is not authorized to create a website.', 'error', 400));
    }

    // Check if the user's email is verified
    if (!user.isVerified) {
      return res.status(400).send(createResponse('Please verify your email before creating a website.', 'error', 400));
    }

    req.user.email = user.email

    // If all checks pass, proceed to the next middleware or controller
    next();
  } catch (error) {
    // Handle any server-side errors
    return res.status(500).send(createResponse('Internal server error.', 'error', 500));
  }
};

module.exports = isSeller;
