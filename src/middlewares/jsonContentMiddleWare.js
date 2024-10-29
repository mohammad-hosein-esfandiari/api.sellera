function jsonContentMiddleware(req, res, next) {
    if (req.headers['content-type'] !== 'application/json') {
        return res.status(415).json(createResponse("Unsupported Media Type. Please send JSON.", "error", 415));
    }
    next();
  }

  module.exports = jsonContentMiddleware