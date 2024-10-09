const { Website } = require("../models/Website");

// Middleware to record the update history of a website
const recordUpdateHistoryWebsite = async (req, res, next) => {
    // Extract the domain name from the URL parameters
    const domainName = req.params.domain_name; 

    // Find the website using the domain name
    const website = await Website.findOne({ domain_name: domainName });

    // If the website is not found, return a 404 error
    if (!website) {
        return res.status(404).send(createResponse('Website not found.', 'error', 404));
    }

    // Push the update information into the updateHistory array
    website.updateHistory.push({
        updatedBy: req.user.id, // Store the ID of the user who performed the update
        changes: req.body, // Store the changes made during the update
    });

    // Save the updated website document to the database
    await website.save();

    // Call the next middleware or route handler
    next();
};

module.exports = recordUpdateHistoryWebsite;
