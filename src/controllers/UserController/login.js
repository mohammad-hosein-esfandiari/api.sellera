const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { User } = require("../../models/User");
const responseMessages = require("../../constants/responsesMessages");
const Session = require("../../models/Session");
const { createToken, createRefreshToken } = require("../../utils/jwtTokenFunc");
const VerificationCode = require("../../models/VerificationCode");
const createResponse = require("../../utils/createResponse");
const { sendVerificationEmail } = require("../../utils/emailService");
require("dotenv").config();

// Login function
const MAX_LOGIN_ATTEMPTS = 5;  // Maximum allowed login attempts
const LOCK_TIME = 60 * 60 * 1000;  // Lock duration (1 hour)

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const systemType = req.headers['user-agent'];

    // Find the user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json(createResponse("Invalid email or password.", "error", 401));
    }

    // check use if login with this device
    const session = await Session.findOne({ userId: user._id, systemType: systemType });

    if (session) {
      return res.status(403).json(createResponse("You are already logged in with this device .please login with another device.", "error", 403));
      }

    // Check if the account is locked
    if (user.lockUntil && user.lockUntil > Date.now()) {
      const lockDuration = Math.ceil((user.lockUntil - Date.now()) / (60 * 1000));  // Remaining lock time in minutes
      return res.status(403).json(createResponse(`Your account is locked. Try again in ${lockDuration} minutes.`, "error", 408));
    }

    // Verify the password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      // Increment failed login attempts
      user.loginAttempts += 1;

      // Lock the account if max login attempts are exceeded
      if (user.loginAttempts >= MAX_LOGIN_ATTEMPTS) {
        user.lockUntil = Date.now() + LOCK_TIME;  // Lock the account for 1 hour
                // Send verification email
        const result = await sendVerificationEmail(email,"Unauthorized-entry");
        if (!result.success) {
          return res.status(400).json(createResponse(result.message,"error", 408));
        }
        await user.save();
        return res.status(403).json(createResponse("Too many failed login attempts. Your account is locked for 1 hour.", "error", 408));
      }

      // Save the user with the updated loginAttempts
      await user.save();
      return res.status(401).json(createResponse("Invalid email or password.", "error", 401));
    }

    // Reset loginAttempts and lockUntil after a successful login
    user.loginAttempts = 0;
    user.lockUntil = null;

    // Create access and refresh tokens
    const accessToken = createToken(user._id, user.roles);
    const refreshToken = createRefreshToken(user._id, user.roles);

    // Create user session

    const newSession = new Session({

        userId: user._id,
        systemType,
        accessToken,
        refreshToken,
        maxAge: 1000 * 60 * 60 * 24 * 7,
      
    });

    await newSession.save();


    // Delete any existing verification codes associated with the user's email
    await VerificationCode.deleteMany({ email: user.email });

    // Return a successful login response with the access token
    res.status(200).json(createResponse("Login successful", "success", 200, { data: { accessToken } }));
  } catch (error) {
    // Handle server errors
    res.status(500).json(responseMessages.serverError);
  }
};

module.exports = { login };