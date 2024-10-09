const responseMessages = {
    // email responses
    email: {
      invalid: {
        status: "error",
        statusCode: 400,
        message: "Invalid email address",
      },
      format: {
        status: "error",
        statusCode: 400,
        message: "Invalid email format.",
      },
      verificationSent: {
        status: "success",
        statusCode: 200,
        message: "Verification code sent to your email",
      },
      codeInvalid: {
        status: "error",
        statusCode: 400,
        message: "Invalid verification code",
      },
      codeExpired: {
        status: "error",
        statusCode: 400,
        message: "Verification code expired",
      },
      verified: {
        status: "success",
        statusCode: 200,
        message: "Email verified successfully",
      },
    },
    
    // login responses
    login: {
      invalidCredentials: {
        status: "error",
        statusCode: 401,
        message: "Invalid email or password.",
      },
      alreadyLoggedIn :{
        status:"warning",
        statusCode: 403,
        message: "You are already logged in.",
      },
      isAlreadyLoggedInWithThisDevice:{
        status:"warning",
        statusCode: 403,
        message: "You are already logged in with this device. Please log out first.",
      },
      successful: {
        status: "success",
        statusCode: 200,
        message: "Login successful",
      },
    },
  
    // logout responses
    logout: {
      noToken: {
        status: "error",
        statusCode: 400,
        message: "No refresh token found.",
      },
      invalidToken: {
        status: "error",
        statusCode: 400,
        message: "Invalid refresh token.",
      },
      alreadyLoggedIn:{
        status:"warning",
        statusCode: 403,
        message: "You are already logged in.",

      },
      successful: {
        status: "success",
        statusCode: 200,
        message: "Logged out successfully",
      },
    },
  
    // register responses
    register: {
      invalidUserType: {
        status: "error",
        statusCode: 400,
        message: "Invalid user type",
      },
      userCreated: {
        status: "success",
        statusCode: 201,
        message: "New user created successfully",
      },
      duplicateEmail: {
        status: "error",
        statusCode: 400,
        message: "Duplicate value for email",
      },
    },
    
  
    // server response
    serverError: {
      status: "error",
      statusCode: 500,
      message: "Internal server error",
    },
  };
  
  module.exports = responseMessages;
  