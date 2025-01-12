// Import Session model for managing sessions in the database
const PasswordReset = require('../../models/PasswordReset');
const Session = require('../../models/Session');
// Utility function to generate response messages
const createResponse = require('../../utils/createResponse');

// Logout function
const logout = async (req, res) => {
  try {
    // Extract user information from req.user (set by authentication middleware)
    const token = req.headers['authorization']?.split(' ')[1];
    // Check if the token is provided
    if (!token) {
      return res.status(400).json(createResponse('Access Denied: No Token Provided', 'error', 400));
    }

    // Attempt to delete the session from the database
    try {
      await Session.findOneAndUpdate({
      accessToken: token,
        systemType: req.headers['user-agent']
      },{
        $set: {
          accessToken: null,
          refreshToken: null,
          isLoggedIn: false
        }
      });
      // Session successfully deleted
    } catch (err) {
      // If an error occurs while deleting the session, return an error response
      return res.status(403).json(createResponse('You have been logout', 'error', 403));
    }

 

    // // Destroy the session on the server-side
    // req.session.destroy((err) => {
    //   if (err) {
    //     // If an error occurs during session destruction, return an error response
    //     return res.status(500).json(createResponse('Error logging out.', 'error', 500));
    //   }

    //   // Successful response after logging out
    //   return res.status(200).json(createResponse('Successfully logged out.', 'success', 200));
    // });

  } catch (error) {
    // Handle any server errors that occur during the logout process
    return res.status(500).json(createResponse('Error logging out.', 'error', 500));
  }
};

module.exports = logout;
