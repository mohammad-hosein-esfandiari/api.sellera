const jwt = require("jsonwebtoken");
const createResponse = require("./createResponse");
const Session = require("../models/Session");
const { createToken } = require("./jwtTokenFunc");


// Function for authenticating access token and refreshing if necessary
const verifiedToken = async (token ,systemType) => {

 
  if (!token) {
    return createResponse("Access Denied: No Token Provided", "error", 401);
  }

  // Find the session based on the access token and system type (user-agent)
  const session = await Session.findOne({
    "session.accessToken": token,
    "session.systemType": systemType,
  });

  if (!session) {
    return createResponse("Token expired, Please log in again.", "error", 403);
  }

  try {
    // Verify the access token
    const decoded = jwt.verify(token, process.env.JWT_SECRET); // Validate token
    return { success: true, user: decoded }; // Return user information on success

  } catch (error) {
    const sessionRefreshToken = session.session.refreshToken;

    try {
      // Verify the refresh token
      const refreshTokenDecoded = await jwt.verify(sessionRefreshToken, process.env.REFRESH_TOKEN_SECRET);

      // If the refresh token is valid, create a new access token
      const newAccessToken = await createToken(refreshTokenDecoded.id, refreshTokenDecoded.roles);
      
      // Update the session with the new access token
      await Session.findOneAndUpdate(
        {
          "session.accessToken": token,
          "session.systemType": systemType,
        },
        { "session.accessToken": newAccessToken }
      );

      // Return the new token and user information
      return { success: true, user: { ...refreshTokenDecoded, newAccessToken } };

    } catch (err) {
      // Delete the session if refresh token verification fails
      await Session.findOneAndDelete({
        "session.accessToken": token,
        "session.systemType": systemType,
      });

      return createResponse("Token expired, Please log in again!", "error", 402);
    }
  }
};

module.exports = verifiedToken;
