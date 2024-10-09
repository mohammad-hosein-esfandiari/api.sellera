const bcrypt = require('bcrypt');
const { User } = require('../../models/User');
const VerificationCode = require('../../models/VerificationCode');
const createResponse = require('../../utils/createResponse');
require('dotenv').config();



const createUser = async (req, res) => {
  try {
    // Extract required information from request body
    const { email, password, first_name, last_name, phone_number } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json(createResponse("User already exists", "error", 400));
    }

    // Check user type from request header
    const userType = req.headers["user-type"];
    const validUserTypes = ['buyer', 'seller'];

    // Validate user type
    if (!validUserTypes.includes(userType)) {
      return res.status(400).json(createResponse("Invalid user type provided.", "error", 400));
    }

    // Check if the email has been verified
    const verificationEntry = await VerificationCode.findOne({ email , type:"new-user"});
    if (!verificationEntry) {
      return res.status(400).json(createResponse("Email not verified.", "error", 400));
    }

    // Check expiration of the verification code
    if (!verificationEntry.isVerified) {
      return res.status(400).json(createResponse("Email is not verified", "error", 400));
    }

    // Hash the password
    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS, 10);
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Set new user data
    const newUserData = {
      email,
      password: hashedPassword,
      first_name,
      last_name,
      phone_number,
      isVerified: true, // Email verified
      roles: [userType],
    };

    // If the user is a seller, admin, or support, also add "buyer" role
    if (userType !== 'buyer') {
      newUserData.roles.push("buyer");
    }

    // Create user according to the role
    const newUser = new User(newUserData);
  

    // Save the user to the database
    await newUser.save();

    // Delete the verification code
    await VerificationCode.deleteOne({ email ,type:"new-user"});

    // Successful response
    res.status(201).json(createResponse("New user created successfully", "success", 200));
  } catch (error) {
    // Handle errors
    if (error.name === "ValidationError") {
      const errors = Object.keys(error.errors).map((key) => error.errors[key].message);
      return res.status(400).json(createResponse(errors.join(", "), "error", 400));
    }

    // Check for duplicate email
    if (error.code === 11000) {
      return res.status(400).json(createResponse("Duplicate value for email", "error", 400));
    }

    // Internal server error response
    res.status(500).json(createResponse("Internal server error", "error", 500));
  }
};

module.exports = createUser;
