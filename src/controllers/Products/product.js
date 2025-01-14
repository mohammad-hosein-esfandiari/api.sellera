const { check , validationResult, param} = require("express-validator");
const { Product } = require("../../models/Product");
const createResponse = require("../../utils/createResponse");
const { handleValidationErrors } = require("../../middlewares/handleValidation");
const { Website } = require("../../models/Website");

exports.getProductBySlug = async (req, res) => {
  try {
    const { slug ,website} = req.params; // Get slug and title from the URL parameters

    // Find the product by slug and website name and ensure it's online (isOnline: true)
    const product = await Product.findOne({ slug , website_name:website , isOnline:true});

    // If no product is found or it's not online
    if (!product) {
      return res
        .status(404)
        .json(createResponse("Product not found or is not online.", "error", 404));
    }

    // Return the product information
    return res
      .status(200)
      .json(createResponse("Product retrieved successfully.", "success", 200, {data: product }));
  } catch (error) {
    // Handle any errors that may occur during the process
    return res
      .status(500)
      .json(createResponse("Error retrieving product: " + error.message, "error", 500));
  }
};


// Export the controller function
exports.getProductsOfWebsiteByFilter = [
    // Validation middleware
    // Check for the required parameters and optional filters
    check('category').optional().isString().withMessage('Category must be a string'),
    check('highestPrice').optional().isBoolean().withMessage('highestPrice must be true or false'),
    check('lowestPrice').optional().isBoolean().withMessage('lowestPrice must be true or false'),
    check('mostLike').optional().isBoolean().withMessage('mostLike must be true or false'),
    check('mostRate').optional().isBoolean().withMessage('mostRate must be true or false'),
    check('inStock').optional().isBoolean().withMessage('inStock must be true or false'),
    check('hasDiscountPrice').optional().isBoolean().withMessage('hasDiscountPrice must be true or false'),
    check('hasOffer').optional().isBoolean().withMessage('hasOffer must be true or false'),
    check('purchasedCount').optional().isBoolean().withMessage('purchasedCount must be true or false'),
    check('newest').optional().isBoolean().withMessage('newest must be true or false'),
    check('oldest').optional().isBoolean().withMessage('oldest must be true or false'),
    check('minPrice').optional().isNumeric().withMessage('minPrice must be a number'),
    check('maxPrice').optional().isNumeric().withMessage('maxPrice must be a number'),

    // Main handler function
    async (req, res) => {
        // Validate incoming request
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

            return res.status(400).json(createResponse("Invalid Input field.", "error", 400, { errors: formattedErrors }));
        }

        try {
            const { website } = req.params; // Get the website from the URL params
            const {
                category,
                highestPrice,
                lowestPrice,
                mostLike,
                mostRate,
                inStock,
                hasDiscountPrice,
                hasOffer,
                purchasedCount,
                newest,
                oldest,
                minPrice,
                maxPrice,
            } = req.query; // Get all filters from the query string

            
            const websiteModel = await Website.findOne({ domain_name: website });

            if (!websiteModel) {
                return res.status(404).json(createResponse("Website not found.", "error", 404));
            }


            // Base query to filter by website and isOnline
            let query = { website_id : websiteModel._id.toString() };
    
            // Apply filters if provided
            if (category) query.category = category;
            if (inStock) query.store = { $gt: 0 }; // Filter products that are in stock
            if (hasDiscountPrice) query.price = { $lt: 100 }; // Adjust logic for discounted products
            if (hasOffer) query['specialOffer.active'] = true; // Filter products with active special offers
            if (minPrice || maxPrice) {
                query.price = {};
                if (minPrice) query.price.$gte = Number(minPrice);
                if (maxPrice) query.price.$lte = Number(maxPrice);
            }

            // Sorting options based on query
            let sortOptions = {};
            if (highestPrice) sortOptions.price = -1; // Sort by highest price
            if (lowestPrice) sortOptions.price = 1;  // Sort by lowest price
            if (mostLike) sortOptions.likes = -1;    // Sort by most liked
            if (mostRate) sortOptions['rating.value'] = -1; // Sort by highest rating
            if (newest) sortOptions.createdAt = -1;  // Sort by newest
            if (oldest) sortOptions.createdAt = 1;   // Sort by oldest
            if (purchasedCount) sortOptions['analytics.purchasedCount'] = -1; // Sort by most purchased

            // Fetch products with pagination
            const limit = parseInt(req.query.limit, 10) || 10; // Default limit to 10
            const page = parseInt(req.query.page, 10) || 1; // Default page to 1
            const skip = (page - 1) * limit;

            // Execute query with sort, limit, and skip
            const products = await Product.find(query)
                .select('-website_id -updatedAt -__v -details -tags -seo')
                .sort(sortOptions)
                .limit(limit)
                .skip(skip);

            // Get total count for pagination

            const totalProducts = await Product.countDocuments(query);

            if(!totalProducts){
                return res.status(200).json(createResponse("No products found","warning",200,{data:[]}));

            }

            // Send the response
            return res.status(200).json(
                createResponse("Products retrieved successfully.", "success", 200, {data:{
                    products,
                    pagination: {
                        total: totalProducts,
                        page,
                        pages: Math.ceil(totalProducts / limit),
                    },
                }})
            );
        } catch (error) {
            return res.status(500).json(createResponse('Server error.', 'error', 500));
        }
    }
];


// API to add a Rating with validation for website_name and slug parameters

exports.addRating = [
    // Validate that `website_name` exists in the request parameters
    param('website')
        .notEmpty()
        .withMessage('Website name is required in parameters.'),

    // Validate that `slug` exists in the request parameters
    param('slug')
        .notEmpty()
        .withMessage('Slug is required in parameters.'),

    // Validate that the rating `value` is between 0 and 5
    check('value')
        .isInt({ min: 0, max: 5 })
        .withMessage('Rating value must be between 0 and 5.'),

    // Handle validation errors using middleware
    handleValidationErrors,

    async (req, res) => {
        const { website: website_name, slug } = req.params;
        const userId = req.user.id;

        try {
            // Find the product using slug and website_name
            const product = await Product.findOne({ slug});
            if (!product) {
                return res.status(404).json(createResponse("Product not found.", "error", 404));
            }

            // Check if the user has already given a rating for this product
            const existingRating = product.rating.find(r => r.user.toString() === userId);
            if (existingRating) {
                return res.status(400).json(createResponse("User has already rated this product.", "error", 400));
            }

            // Add new rating to the product's rating array
            product.rating.push({ user: userId, value: req.body.value });
            await product.save();

            return res.status(201).json(createResponse("Rating added successfully.", "success", 201));
        } catch (error) {
            return res.status(500).json(createResponse("Internal server error.", "error", 500));
        }
    }
];





// Toggle like/dislike for a product
exports.toggleLike = [

    // Controller logic for toggling like/dislike
    async (req, res) => {
        try {
            const {slug , website}  = req.params
            const userId = req.user.id
            // Find the product by slug and website_name
            const product = await Product.findOne({ slug, website_name:website });
            if (!product) {
                return res.status(404).json(createResponse("Product not found.", "error", 404));
            }

            // Check if the user already liked the product
            const userIndex = product.likes.indexOf(userId);

            if (userIndex === -1) {
                // User has not liked the product, so add the user ID to the likes array
                product.likes.push(userId);
                await product.save(); // Save changes to the product
                return res.status(200).json(createResponse(
                    "Product liked successfully.",
                    "success",
                    200,
                    { likes: product.likes }
                ));
            } else {
                // User has already liked the product, so remove the user ID from the likes array
                product.likes.splice(userIndex, 1);
                await product.save(); // Save changes to the product
                return res.status(200).json(createResponse(
                    "Like removed successfully.",
                    "success",
                    200,
                    { likes: product.likes }
                ));
            }
        } catch (error) {
            return res.status(500).json(createResponse("Internal server error.", "error", 500));
        }
    }
];


exports.getProductLikesDetails = async (req, res) => {
    try {
        const { website, slug } = req.params;

        // Find the product by slug and website name, and populate user details of those who liked the product
        const product = await Product.findOne({ slug, website_name: website }).populate({
            path: 'likes',
            select: 'username profile_image' // Select only the username and profile_image fields from the User model
        });

        // If the product is not found, send a 404 response
        if (!product) {
            return res.status(404).json(createResponse("Product not found.", "error", 404));
        }

        // Return the details of users who liked the product
        return res.status(200).json(createResponse(
            "Product like details fetched successfully.",
            "success",
            200,
            { likes: product.likes }
        ));
    } catch (error) {
        // Send a 500 response if there's an error in fetching the like details
        return res.status(500).json(createResponse("Error fetching like details: " + error.message, "error", 500));
    }
};