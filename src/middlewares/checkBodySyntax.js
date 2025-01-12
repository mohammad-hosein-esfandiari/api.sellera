const createResponse = require("../utils/createResponse");

const checkBodySyntax = (err, req, res, next) => {
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        return res.status(400).json(createResponse("Invalid JSON format. Please correct your input.", "error", 400));
    }
    next(err); // Pass the error to the next middleware if not a SyntaxError
  }

  module.exports = checkBodySyntax