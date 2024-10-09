// Utility function to generate response messages
const createResponse = (message, status, statusCode , otherData) => ({
    message,
    status,
    statusCode,
    ...otherData
  });

  module.exports = createResponse