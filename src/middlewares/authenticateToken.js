const jwt = require("jsonwebtoken");
const Session = require("../models/Session"); // Session model
const { createToken } = require("../utils/jwtTokenFunc");
const createResponse = require("../utils/createResponse");


const authenticateToken = async (req, res, next) => {
  const token = req.headers["authorization"]?.split(" ")[1]; // Get token from header

  if (!token) {
    return res.status(400).json(createResponse("Access Denied: No Token Provided", "error", 401));
  }

  const session = await Session.findOne({
    "session.accessToken": token,
    "session.systemType": req.headers["user-agent"],
  });

  if (!session) {
    return res.status(403).json(createResponse("Token expired, Please log in again.", "error", 403));
  }

  try {
    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET); // Validate token
    req.user = decoded; // Store user information in req.user for later use

    return next(); // Proceed to the next middleware
  } catch (error) {
    const sessionRefreshToken = session.session.refreshToken;

    try {
      // Verify the refresh token
      const refreshTokenDecoded =  jwt.verify(sessionRefreshToken, process.env.REFRESH_TOKEN_SECRET);

      // If the refresh token is valid, create a new access token
      const newAccessToken =  createToken(refreshTokenDecoded.id, refreshTokenDecoded.roles);
      req.user = { ...refreshTokenDecoded, newAccessToken }; // Store user info with the new access token

      // Update the session
      await Session.findOneAndUpdate(
        {
          "session.accessToken": token,
          "session.systemType": req.headers["user-agent"],
        },
        { "session.accessToken": newAccessToken }
      );

      return next(); // Proceed to the next middleware
    } catch (err) {
      // Delete the session if refresh token verification fails
      await Session.findOneAndDelete({
        "session.accessToken": token,
        "session.systemType": req.headers["user-agent"],
      });
      return res.status(403).json(createResponse("Token expired, Please log in again!", "error", 402));
    }
  }
};

module.exports = authenticateToken;
