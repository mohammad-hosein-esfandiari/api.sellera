const { validationResult } = require("express-validator");
const createResponse = require("../utils/createResponse");

// Function to handle validation errors
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const formattedErrors = errors.array().reduce((acc, error) => {
            const { path, msg } = error;
            if (!acc[path]) {
                acc[path] = []; // Initialize an array for this field
            }
            acc[path].push(msg); // Add the message to the array
            return acc;
        }, {});

        return res.status(400).json(createResponse("Validation failed.", "error", 400, { errors: formattedErrors }));
    }
    next(); // If no errors, proceed to the next middleware/controller
};

module.exports = { handleValidationErrors };
