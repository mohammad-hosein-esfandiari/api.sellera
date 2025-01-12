const {Website} = require('../models/Website'); // Import the Website model
const createResponse = require('../utils/createResponse'); // Import createResponse utility

// Middleware to check if the website's subscription is active and next payment is due
async function checkSubscription(req, res, next) {
    try {
        // Extract website ID from the request parameters
        const {domain_name} = req.body; // Adjust based on how the website ID is sent

        // Find the website by ID
        const website = await Website.findOne({domain_name});

        // Check if the website exists
        if (!website) {
            return res.status(404).json(createResponse('Website not found', 'error', 404));
        }

        // Get the current date
        const now = new Date();

        // Check if the next payment date is still valid
        if (website.subscription.nextPaymentDate <= now) {
            // If the payment date is past, deactivate the subscription
            website.subscription.isActive = false;
            await website.save(); // Save the updated website

            return res.status(420).json(createResponse('The subscription has expired due to unpaid next payment', 'error', 420));
        }

        // Check if the subscription is active
        if (!website.subscription.isActive) {
            return res.status(420).json(createResponse('The website subscription is inactive', 'error', 420));
        }

        // If both checks pass, proceed to the next middleware or controller
        next();
    } catch (error) {
        console.error("Error in checkSubscription middleware:", error);
        return res.status(500).json(createResponse('An error occurred on the server', 'error', 500));
    }
}

module.exports = checkSubscription; // Exporting the middleware
