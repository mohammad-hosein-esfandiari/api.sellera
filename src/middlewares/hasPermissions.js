const { Website } = require("../models/Website");
const createResponse = require("../utils/createResponse");

// Middleware to check user permissions based on their roles and website ownership
const hasPermissions = (requiredPermissions) => {
    return async (req, res, next) => {
        const userRoles = req.user.roles; // Get user roles from request
        const { domain_name } = req.body; // Extract domain name from request body

        if(!domain_name){
            return res.status(400).json(createResponse('You must enter the website domain in body', 'error', 404));
        }

        const website = await Website.findOne({ domain_name }); // Find the website by domain name

        // Check if the website exists
        if (!website) {
            return res.status(404).json(createResponse('Website not found.', 'error', 404));
        }
    // Check if user is the seller of the website
    if (userRoles.includes('seller') && website.seller_id.toString() === req.user.id) {
        return next(); // Allow access for sellers
    }
        
        // Check if user has admin permission from the supports array
        const supportUser = website.supports_id.find((item) => item.user_id.toString() === req.user.id);
        if (supportUser && supportUser.permissions.includes('admin')) {
            return next(); // Allow access for users with admin permission
        }

        // Check if user is a support for the website
        const isSupportOfWebsite = !!supportUser; // Boolean value to check if the user is a support

        // Check if the user has any of the required permissions
        if(requiredPermissions.length){
            const hasPermission = supportUser && requiredPermissions.some(permission =>
                supportUser.permissions.includes(permission) // Check against support user's permissions
            );
    
            // If user is a support and has permission, proceed
            if (userRoles.includes('support') && isSupportOfWebsite && hasPermission) {
                return next();
            }
        }

        // Deny access if none of the conditions are met
        return res.status(403).json(createResponse('You do not have permission to perform this action.', 'error', 403));
    }
}

module.exports = { hasPermissions };
