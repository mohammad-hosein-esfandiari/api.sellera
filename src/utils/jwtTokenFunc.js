const jwt = require('jsonwebtoken'); 

// Function to create a JWT token
const createToken = (userId, userRoles) => {
  return jwt.sign(
    { id: userId, roles: userRoles }, 
    process.env.JWT_SECRET, 
    {
      expiresIn: '10d', // Token validity period set to 10 days
    }
  );
};

// Function to create a refresh token
const createRefreshToken = (userId, userRoles) => {
  return jwt.sign(
    { id: userId, roles: userRoles }, 
    process.env.REFRESH_TOKEN_SECRET, 
    {
      expiresIn: '30d', // Refresh token validity period set to 30 days
    }
  );
};

module.exports = {
  createToken, 
  createRefreshToken
};
