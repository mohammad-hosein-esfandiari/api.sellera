const { validationResult } = require("express-validator");
const createResponse = require("../../../utils/createResponse");
const { Website } = require('../../../models/Website');
const { sendVerificationEmail } = require("../../../utils/emailService");
const VerificationCode = require("../../../models/VerificationCode");
const { User } = require("../../../models/User");
const verifyCode = require("../../../utils/verifyCode");
const { isValidEmail } = require("../../../utils/isValidEmail");

// Controller for creating a website
exports.createWebsite = async (req, res) => {
  try {
    // Extract data from the request body
    const { domain_name } = req.body;

    // Check if the seller already has a website
    const existingSellerWebsite = await Website.findOne({ seller_id: req.user.id });
    if (existingSellerWebsite) {
      return res.status(400).send(
        createResponse('You already have a website. You cannot create another one.', 'error', 400)
      );
    }

    // Check if a website with the same domain name already exists
    const existingWebsite = await Website.findOne({ domain_name });
    if (existingWebsite) {
      return res.status(400).send(
        createResponse('Domain name already exists. Please choose a different domain.', 'error', 400)
      );
    }

    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).send(
        createResponse('Validation failed.', 'error', 400, { errors: errors.array() })
      );
    }

    const seller = await User.findOne({_id:req.user.id}).select("website_id")
    
    if(!seller){
      return res.status(400).send( 
        createResponse('Seller not found.', 'error', 400) 
        );
    }

      

    // Create a new website entry
    const website = new Website({
      domain_name,
      seller_id: req.user.id, 
    });

    // Save the website to the database
    await website.save();

    
    seller.website_id.push(website._id)
    await seller.save()
    // Return the created website
    const websiteData = {
      logo_image: website.logo_image,
      domain_name: website.domain_name,
      banners: website.banners,
      followers: website.followers.length,
      supports:website.supports_id.length,
      bio: website.bio,
      isOnline: website.isOnline,
      createdAt: website.createdAt,
      seo:website.seo
    };

    return res.status(200).send(
      createResponse('Website created successfully.', 'success', 200, { data: websiteData })
    );

  } catch (error) {
    return res.status(500).send(
      createResponse('Error in creating website.', 'error', 500)
    );
  }
};

//  API for change domain name
exports.updateDomainName = async (req, res) => {
  try {
    const { new_domain_name: newDomainName } = req.body; // New domain name is taken from the request body
    const { domain_name: currentDomainName } = req.body; // Current domain name is taken from the request parameters
    const userId = req.user.id; // User ID from the authenticated user making the request

     // Validate that both domain names are provided
     if (!newDomainName || !currentDomainName) {
      return res.status(400).send(
        createResponse('Both current and new domain names are required.', 'error', 400)
      );
    }
    // Find the website based on the current domain name
    const website = await Website.findOne({ domain_name: currentDomainName });

    if (!website) {
      return res.status(404).send(
        createResponse('Website not found.', 'error', 404)
      );
    }

    // Check if the user is the owner of the website
    if (website.seller_id.toString() !== userId) {
      return res.status(403).send(
        createResponse('You are not authorized to update the domain name.', 'error', 403)
      );
    }

    // Check if the new domain name already exists
    const existingWebsite = await Website.findOne({ domain_name: newDomainName });
    if (existingWebsite) {
      return res.status(400).send(
        createResponse('This domain name is already taken. Please choose another one.', 'error', 400)
      );
    }

    // Update the domain name
    website.domain_name = newDomainName;
    await website.save();

    return res.status(200).send(
      createResponse('Domain name updated successfully.', 'success', 200, {data:  {new_domain_name: newDomainName} })
    );

  } catch (error) {
    return res.status(500).send(
      createResponse('Error in updating domain name.', 'error', 500)
    );
  }
};

// API for sending delete request to email
exports.requestDeleteWebsite = async (req, res) => {
  try {
    const { email } = req.body; 
    const { domain_name } = req.body;

    if (!email || !domain_name) {
      return res.status(400).send(
        createResponse('Email and domain name are required.', 'error', 400)
      );
    }

    const website = await Website.findOne({ domain_name });

    if (!website) {
      return res.status(404).send(
        createResponse('Website not found.', 'error', 404)
      );
    }

     // Send verification code to old email
     const result = await sendVerificationEmail(email,"delete-website");
     if (!result.success) {
       return res.status(400).json(createResponse(result.message, "error", 400));
     }

    return res.status(200).send(
      createResponse('Deletion request sent to your email. Please confirm the deletion.', 'success', 200)
    );

  } catch (error) {
    return res.status(500).send(
      createResponse('Error in sending deletion request.', 'error', 500)
    );
  }
};

// API for confirming website deletion
exports.confirmDeleteWebsite = async (req, res) => {
  try {
    const { code , domain_name } = req.body; // The deletion confirmation code is taken from the request body

    // Check if the deletion code is provided
    if (!code) {
      return res.status(400).send(
        createResponse('Deletion code is required.', 'error', 400)
      );
    }

    // Verify the code using the utility function
    const verificationResult = await verifyCode(code,req.user.email,"delete-website");

    // If the verification fails, return an error message
    if (!verificationResult.success) {
      return res.status(400).json(createResponse(verificationResult.message, "error", 400));
    }

    const seller = await User.findOne({ _id: req.user.id }).select("website_id");

    if (!seller) {
      return res.status(400).send(
        createResponse('Seller not found.', 'error', 400)
      );
    }
    
    // Find the website based on domain_name (assuming domain_name comes from req.params or req.body)
    const website = await Website.findOne({ domain_name });
    
    if (!website) {
      return res.status(404).send(
        createResponse('Website not found.', 'error', 404)
      );
    }
    
    // Check if the website_id exists in the user's website_id array
    if (!seller.website_id.includes(website._id)) {
      return res.status(400).send(
        createResponse('Website ID not found in user data.', 'error', 400)
      );
    }
    
    // Remove the website_id from the user's website_id array
    seller.website_id.pull(website._id);
    
    // Save the updated user
    await seller.save();

    // Delete the website
    await Website.deleteOne({ _id: website._id });

      // If the code is valid, delete it from the database
    await VerificationCode.findOneAndDelete({ code , email: req.user.email , type:"delete-website" });
    // Send success response
    return res.status(200).send(
      createResponse('Website deleted successfully.', 'success', 200)
    );

  } catch (error) {
    // Handle any server-side errors
    return res.status(500).send(
      createResponse('Error in deleting website.', 'error', 500)
    );
  }
};

exports.requestWebsiteTransfer = async (req, res) => {
  try {

    const sellerEmail = req.user.email

    // Send verification code to seller email
    const result = await sendVerificationEmail(sellerEmail,"website-transfer");

    if (!result.success) {
          return res.status(400).json(createResponse(result.message, "error", 400));
    }

    return res.status(200).json(createResponse("Website sales code sent to your email.", "success", 200));
  } catch (error) {
    return res.status(500).json(createResponse("Error in sending transfer request.", "error", 500));
  }
};

// API to confirm the transfer and change seller_id
exports.confirmWebsiteTransfer = async (req, res) => {
  try {
    const {  code, newEmail,domain_name } = req.body; // Domain name, verification code, and new seller's email

       // Find the new seller by email
       const newSeller = await User.findOne({ email: newEmail });

       if (!newSeller) {
         return res.status(404).json(createResponse("New seller not found.", "error", 404));
       }

     // Verify the code using the utility function
     const verificationResult = await verifyCode(code,req.user.email,"website-transfer");

     // If the verification fails, return an error message
     if (!verificationResult.success) {
       return res.status(400).json(createResponse(verificationResult.message, "error", 400));
     }
 
 
     const website = await Website.findOne({ domain_name});

    // Update the seller_id in the website document
    website.seller_id = newSeller._id;
    await website.save();

    // Delete the verification code after successful transfer
    await VerificationCode.findOneAndDelete({ email: req.user.email, code , type:"website-transfer"});

    return res.status(200).json(createResponse("Website transfer successful.", "success", 200));
  } catch (error) {
    return res.status(500).json(createResponse("Error in confirming website transfer.", "error", 500));
  }
};



exports.changeWebsiteStatus = async (req,res)=>{
  try {
    const {domain_name} = req.body
    const website = await Website.findOne({domain_name})
    if(!website){
      return res.status(404).json(createResponse("Website not found.", "error", 404
      ));
      }

      
      // Update the website status
      if(website.isOnline){
        website.isOnline = false
      }else{
        website.isOnline = true
      }
      await website.save();
      


    return res.status(200).json(createResponse(`Website status changed successfully. Website is ${website.isOnline ? "('Online')" : "('Offline')"}  now!`, "success", 200));
    
  } catch (error) {
    return res.status(500).json(createResponse("Error in changing website status.", "error", 500));

  }
}



// Allowed fields for updating bio
const allowedFields = ['title', 'description', 'email', 'address', 'socialMedia'];

// Allowed social media fields
const allowedSocialMediaFields = ['facebook', 'twitter', 'instagram', 'linkedin', 'telegram'];

// Function to validate incoming data
const validateFields = (body) => {
  const bio = body.bio || {};

  // Check if each field in bio is allowed
  for (let key in bio) {
    if (!allowedFields.includes(key)) return false;
    
    // Check if socialMedia fields are valid
    if (key === 'socialMedia') {
      for (let socialKey in bio.socialMedia) {
        if (!allowedSocialMediaFields.includes(socialKey)) return false;
      }
    }
  }
  return true;
};

exports.updateBio = async (req, res) => {
  try {
    const { domain_name } = req.body; // Get domain_name from the request parameters
    const { bio } = req.body; // Get the bio from the request body

    // Validate fields in the bio
    if (!validateFields(req.body)) {
      return res.status(400).send(createResponse('Invalid fields in bio.', 'error', 400));
    }

    // Find the website by domain_name
    const website = await Website.findOne({ domain_name });

    if (!website) {
      return res.status(404).send(createResponse('Website not found.', 'error', 404));
    }

    // Update fields in bio
    if (bio.title) website.bio.title = bio.title;
    if (bio.description) website.bio.description = bio.description;
    if (bio.email) website.bio.email = bio.email;
    if (bio.address) website.bio.address = bio.address;
    
    // Update socialMedia fields if provided
    if (bio.socialMedia) {
      for (let key of allowedSocialMediaFields) {
        if (bio.socialMedia[key]) {
          website.bio.socialMedia[key] = bio.socialMedia[key];
        }
      }
    }

    // Save the updated website document
    await website.save();

    return res.status(200).send(
      createResponse('Bio updated successfully.', 'success', 200, {data: { bio: website.bio} })
    );

  } catch (error) {
    return res.status(500).send(
      createResponse('Error updating bio.', 'error', 500)
    );
  }
};

// Controller to handle request for adding support
exports.requestAddSupport = async (req, res) => {
  try {
    const { support_email , domain_name } = req.body;

    if (!support_email) {
      return res.status(400).json(createResponse('Support email is required.', 'error', 400));
    }

    if (!isValidEmail(support_email)) {
      return res.status(400).json(createResponse("Invalid email format.","error" ,400));
    }

    const support = await User.findOne({email:support_email})
    if (!support) {
      return res.status(404).json(createResponse('User not found.', 'error', 404))
      }
      
         // Check if user already has the support role in website
    const websiteSupports = await Website.findOne({domain_name})     


    const isInWebsiteSupports = websiteSupports.supports_id.find((item)=>{
      return item.user_id.equals(support._id) 
    })


    if (isInWebsiteSupports) {
      return res.status(400).json(createResponse(`User is already a support in ${domain_name} website.`, 'error', 400));
    }


    // Send verification code to the provided support email
    const result = await sendVerificationEmail(support_email, "add-support");

    if (!result.success) {
      return res.status(400).json(createResponse(result.message, 'error', 400));
    }

    return res.status(200).json(createResponse('Verfication code sent to support email.', 'success', 200));

  } catch (error) {
    return res.status(500).json(createResponse('Error sending code for support.', 'error', 500));
  }
};

// Controller to handle confirmation of the add support request
exports.confirmRequestAddSupport = async (req, res) => {
  try {
    const { code , support_email ,domain_name} = req.body;

    if (!code || !support_email) {
      return res.status(400).json(createResponse('Verification code and supports email are required.', 'error', 400));
    }
    
    if (!isValidEmail(support_email)) {
      return res.status(400).json(createResponse("Invalid email format.","error" ,400));
    }

    // Verify the provided code
    const verificationResult = await verifyCode(code, support_email, "add-support");

    if (!verificationResult.success) {
      return res.status(400).json(createResponse(verificationResult.message, 'error', 400));
    }

           // Check if user already has the support role in website
           const websiteSupports = await Website.findOne({domain_name})     


           const isInWebsiteSupports = websiteSupports.supports_id.find((item)=>{
             return item.user_id.equals(support._id) 
           })
       
       
           if (isInWebsiteSupports) {
             return res.status(400).json(createResponse(`User is already a support in ${domain_name} website.`, 'error', 400));
           }

    
    // Mark the verification code as verified in the database
    await VerificationCode.findOneAndUpdate(
      { email: support_email, code , type: "add-support" },
      { isVerified: true }
    );

    return res.status(200).json(createResponse('Support request confirmed.', 'success', 200));

  } catch (error) {
    return res.status(500).json(createResponse('Error confirming support request.', 'error', 500));
  }
};

const validPermissions = ["admin", "product", "order", "comment"];

exports.addSupport = async (req, res) => {
  try {
    const { support_email, permission , domain_name } = req.body;
    
    // Find user by email and check if user exists
    const user = await User.findOne({ email: support_email });
    if (!user) {
      return res.status(404).json(createResponse('User not found.', 'error', 404));
    }


    // Validate support_email is provided
    if (!support_email) {
      return res.status(400).json(createResponse('Support email is required.', 'error', 400));
    }

    // Validate email format
    if (!isValidEmail(support_email)) {
      return res.status(400).json(createResponse('Invalid email format.', 'error', 400));
    }

    // Validate permission is one of the allowed values
    if (!permission || !validPermissions.includes(permission)) {
      return res.status(400).json(createResponse('Invalid permission.', 'error', 400));
    }

        // Check if user already has the support role in website
        const websiteSupports = await Website.findOne({domain_name})     


        const isInWebsiteSupports = websiteSupports.supports_id.find((item)=>{
          return item.user_id.equals(support._id) 
        })
    
    
        if (isInWebsiteSupports) {
          return res.status(400).json(createResponse(`User is already a support in ${domain_name} website.`, 'error', 400));
        }

    // Find verification code and check if it's verified
    const verification = await VerificationCode.findOne({ email: support_email, type: 'add-support' }).select('isVerified');
    if (!verification || !verification.isVerified) {
      return res.status(400).json(createResponse('Verification code is not verified.', 'error', 400));
    }

    // Find website by seller's ID
    const website = await Website.findOne({ seller_id: req.user.id });
    if (!website) {
      return res.status(404).json(createResponse('Website not found.', 'error', 404));
    }

    if(website.seller_id === req.user.id){
      return res.status(404).json(createResponse('You are Seller and you have all access to website and you cant add support role to your roles.', 'error', 400));

    }

    // Add support to website's supports list
    website.supports_id.push({ user_id: user._id, permissions: [permission] });
    await website.save();

    // Add support role to the user
    // Check if user already has the support role
    if (!user.roles.includes('support')) {
      user.roles.push('support');
      await user.save();
    }   

    // Delete the verification code after successful addition
    await VerificationCode.findOneAndDelete({ email: support_email, type: 'add-support' });

    return res.status(200).json(createResponse('Support added successfully.', 'success', 200));

  } catch (error) {
    return res.status(500).json(createResponse('Error adding support, Try Again.', 'error', 500));
  }
};


exports.addSupportPermission = async (req, res) => {
  try {
    const { user_id, permission, domain_name } = req.body;

    // Validate request body
    if (!user_id || !permission) {
      return res.status(400).json(createResponse('User ID and new permission are required.', 'error', 400));
    }

    if (!validPermissions.includes(permission)) {
      return res.status(400).json(createResponse('Invalid permission provided.', 'error', 400));
    }

    // Find the website related to the seller
    const website = await Website.findOne({ domain_name });

    if (!website) {
      return res.status(404).json(createResponse('Website not found.', 'error', 404));
    }

    // Check if the user exists in website's supports_id
    const support = website.supports_id.find(support => support.user_id.toString() === user_id);

    if (!support) {
      return res.status(404).json(createResponse('Support user not found in this website.', 'error', 404));
    }

    // Check if the user is an admin
    const user = await User.findById(user_id);

    if (!user) {
      return res.status(404).json(createResponse('User not found.', 'error', 404));
    }

       // Check if the user is already an admin
       if (support.permissions.includes('admin')) {
        return res.status(400).json(createResponse('User is an admin and has all permissions.', 'error', 400));
      }

    // If permission is 'admin', clear other permissions and set only 'admin'
    if (permission === 'admin') {
      support.permissions = ['admin']; // Clear and set only admin
      await website.save();
      return res.status(200).json(createResponse('User set as admin, all other permissions removed.', 'success', 200));
    }

 

    // Check if the user already has the new permission
    if (support.permissions.includes(permission)) {
      return res.status(400).json(createResponse(`User already has the ${permission} permission.`, 'error', 400));
    }

    // Add the new permission
    support.permissions.push(permission);
    await website.save();

    return res.status(200).json(createResponse('Permission added successfully.', 'success', 200));

  } catch (error) {
    return res.status(500).json(createResponse('Error adding permission, try again.', 'error', 500));
  }
};


exports.removeSupportPermission = async (req, res) => {
  try {
    const { user_id, permission ,domain_name} = req.body;

    // Validate the request body
    if (!user_id || !permission) {
      return res.status(400).json(createResponse('User ID and permission are required.', 'error', 400));
    }

    if (!validPermissions.includes(permission)) {
      return res.status(400).json(createResponse('Invalid permission provided.', 'error', 400));
    }

    // Find the website for the current seller
    const website = await Website.findOne({domain_name});

    if (!website) {
      return res.status(404).json(createResponse('Website not found.', 'error', 404));
    }

    // Check if the user exists in website's supports_id
    const support = website.supports_id.find(support => support.user_id.toString() === user_id);

    if (!support) {
      return res.status(404).json(createResponse('Support user not found in this website.', 'error', 404));
    }

    // Check if the user has the permission
    if (!support.permissions.includes(permission)) {
      return res.status(400).json(createResponse(`User does not have the ${permission} permission.`, 'error', 400));
    }

    // Remove the permission from the user's permissions
    support.permissions = support.permissions.filter(perm => perm !== permission);

    // Save changes to the website
    await website.save();

    return res.status(200).json(createResponse('Permission removed successfully.', 'success', 200));

  } catch (error) {
    return res.status(500).json(createResponse('Error removing permission, try again.', 'error', 500));
  }
};


exports.getSupportListWithUserData = async (req, res) => {
  try {
    const { domain_name } = req.body; // گرفتن نام دامنه از query

    // Validate request query
    if (!domain_name) {
      return res.status(400).json(createResponse('Domain name is required.', 'error', 400));
    }

    // Find the website using the domain name
    const website = await Website.findOne({ domain_name }).select('supports_id'); // فقط ساپورت‌ها رو انتخاب کن

    if (!website) {
      return res.status(404).json(createResponse('Website not found.', 'error', 404));
    }

    // Initialize array to hold support details with user information
    let supportDetails = [];

    // Fetch user details for each support
    for (const support of website.supports_id) {
      const user = await User.findById(support.user_id).select('first_name last_name profile_image phone_number email');
      if (user) {
        supportDetails.push({
          user_id: support.user_id,
          first_name: user.first_name,
          last_name: user.last_name,
          profile_image: user.profile_image,
          phone_number: user.phone_number,
          email: user.email,
          permissions: support.permissions
        });
      }
    }

    return res.status(200).json(createResponse('Support list with user data retrieved successfully.', 'success', 200, {data: {supports: supportDetails }}));

  } catch (error) {
    return res.status(500).json(createResponse('Error retrieving support list with user data, try again.', 'error', 500));
  }
};



// API to retrieve update history of a website with pagination
exports.getUpdateHistory = async (req, res) => {
  try {
    const {  page = 1, limit = 10 } = req.query;
    const {domain_name} = req.body
    // Check if domain_name is provided
    if (!domain_name) {
      return res.status(400).json(createResponse('Domain name is required.', 'error', 400));
    }

    // Convert page and limit to integers
    const pageNumber = parseInt(page);
    const limitNumber = parseInt(limit);

    // Find the website by domain name and select only the updateHistory field
    const website = await Website.findOne({ domain_name }).select('updateHistory');

    // If the website is not found, return 404 error
    if (!website) {
      return res.status(404).json(createResponse('Website not found.', 'error', 404));
    }

    // Get the total number of update history records
    const totalUpdates = website.updateHistory.length;

    // Calculate pagination values
    const totalPages = Math.ceil(totalUpdates / limitNumber); // Total number of pages
    const startIndex = (pageNumber - 1) * limitNumber; // Starting index for pagination
    const endIndex = startIndex + limitNumber; // Ending index for pagination

    // Slice the updateHistory array to return only the required page's data
    const paginatedUpdates = website.updateHistory.slice(startIndex, endIndex);

    // If there are no updates on the requested page, return 404 error
    if (paginatedUpdates.length === 0) {
      return res.status(404).json(createResponse('No updates found for the requested page.', 'error', 404));
    }

    // Return the paginated update history
    return res.status(200).json(createResponse('Update history retrieved successfully.', 'success', 200, {
     data:{currentPage: pageNumber,
      totalPages: totalPages,
      totalUpdates: totalUpdates,
      updateHistory: paginatedUpdates}
    }));

  } catch (error) {
    // Handle server error
    return res.status(500).json(createResponse('Error retrieving update history, try again.', 'error', 500));
  }
};


// API to delete multiple update history items
exports.deleteUpdateHistory = async (req, res) => {
  try {
    const { domain_name, updateIds } = req.body;

    // Validate that domain_name and updateIds are provided
    if (!domain_name || !Array.isArray(updateIds) || updateIds.length === 0) {
      return res.status(400).json(createResponse('Domain name and an array of update IDs are required.', 'error', 400));
    }

    // Find the website by domain name
    const website = await Website.findOne({ domain_name });

    // If the website is not found, return 404 error
    if (!website) {
      return res.status(404).json(createResponse('Website not found.', 'error', 404));
    }

    // Filter out update history items that match any of the provided update IDs
    const initialLength = website.updateHistory.length;
    website.updateHistory = website.updateHistory.filter(
      update => !updateIds.includes(update._id.toString())
    );

    // If no items were removed, return 404 error
    if (initialLength === website.updateHistory.length) {
      return res.status(404).json(createResponse('No matching update history items found for the provided IDs.', 'error', 404));
    }

    // Save the updated website document
    await website.save();

    // Return success response with the number of deleted items
    const deletedCount = initialLength - website.updateHistory.length;
    return res.status(200).json(createResponse(`${deletedCount} update history item(s) deleted successfully.`, 'success', 200));

  } catch (error) {
    // Handle server error
    return res.status(500).json(createResponse('Error deleting update history, try again.', 'error', 500));
  }
};

