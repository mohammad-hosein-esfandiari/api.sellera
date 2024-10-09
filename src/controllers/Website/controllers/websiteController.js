const { Website } = require("../../../models/Website");
const {User} = require("../../../models/User")
const createResponse = require("../../../utils/createResponse");
const verifiedToken = require("../../../utils/verifiedToken");


const checkTokenAndRoles = (token, systemType, website, returnedData) => {
  return new Promise(async (resolve) => {
    if (token) {
      const authResult = await verifiedToken(token, systemType); // Verify token
      console.log(authResult)
      // If token is invalid, continue without returning an error
      if (!authResult.success) {
        return resolve(null); // Continue without error, allow further execution
      }

      // If user has 'seller' role, return website data without checking the online status
      if (authResult.user.roles.includes("seller")) {
        return resolve(
          createResponse("Website fetched successfully.", "success", 200, { data: returnedData })
        );
      }

      // If user has 'support' role and is listed as a support of the website, return website data
      if (authResult.user.roles.includes("support") && website.supports_id.includes(authResult.user.id)) {
        return resolve(
          createResponse("Website fetched successfully.", "success", 200, { data: returnedData })
        );
      }
    }
    resolve(null); // If no token or user is not a seller or support, continue without returning data
  });
};

// API for fetching website information based on domain_name and user role
exports.getWebsiteInfoForBuyers = async (req, res) => {
  try {
    const { domain_name } = req.params; // Get domain_name from request parameters

    // Check if domain_name is provided
    if (!domain_name || domain_name === "") {
      return res.status(400).send(
        createResponse('Domain name is required.', 'error', 400)
      );
    }

    // Find the website based on domain_name
    const website = await Website.findOne({ domain_name }).select("domain_name followers bio supports_id banners");

    // Check if the website was found
    if (!website) {
      return res.status(404).send(
        createResponse('Website not found.', 'error', 404)
      );
    }

    // Prepare website data for response
    const websiteData = {
      logo_image: website.logo_image,
      domain_name: website.domain_name,
      bio: website.bio,
      banners:website.banners,
      followers: website.followers.length, // Count the number of followers
      isOnline:website.isOnline ? true : false
    }

    const token = req.headers["authorization"]?.split(" ")[1];
    const systemType = req.headers["user-agent"];

    // Check token and roles
    const result = await checkTokenAndRoles(token, systemType, website, websiteData);


    if (result) {
      return res.status(200).send(result); // If result is returned from the promise, send it
    }

    // Check website online status for non-seller or non-support users
    if (!website.isOnline) {
      return res.status(420).send(createResponse("Website will be coming soon.", "error", 420));
    }

    // Send website information
    return res.status(200).send(
      createResponse('Website fetched successfully.', 'success', 200, { data: websiteData })
    );
  } catch (error) {
    return res.status(500).send(
      createResponse('Error in fetching website information.', 'error', 500)
    );
  }
};




// API for toggling follower status for a website
exports.toggleFollowerStatus = async (req, res) => {
  try {
    const { domain_name } = req.params; // Get domain_name from request parameters
    const userId = req.user.id; // Get user ID from authenticated user

    // Find the website based on domain_name
    const website = await Website.findOne({ domain_name });

    if (!website) {
      return res.status(404).send(
        createResponse('Website not found.', 'error', 404)
      );
    }

    // Check if the user is already following the website
    const isFollowing = website.followers.includes(userId);

    if (isFollowing) {
      // User is already following, so we need to unfollow
      await Promise.all([
        // Remove user from website followers
        Website.updateOne({ domain_name }, { $pull: { followers: userId } }),

        // Remove the website from user's following list
        User.updateOne({ _id: userId }, { $pull: { following: website._id } })
      ]);

      return res.status(200).send(
        createResponse('You have unfollowed this website.', 'success', 200)
      );
    } else {
      // User is not following, so we need to follow
      await Promise.all([
        // Add user to website followers
        Website.updateOne({ domain_name }, { $addToSet: { followers: userId } }),

        // Add the website to user's following list
        User.updateOne({ _id: userId }, { $addToSet: { following: website._id } })
      ]);

      return res.status(200).send(
        createResponse('You are now following this website.', 'success', 200)
      );
    }

  } catch (error) {
    console.error("Error in toggleFollowerStatus:", error);
    return res.status(500).send(
      createResponse('Error in toggling follower status.', 'error', 500)
    );
  }
};