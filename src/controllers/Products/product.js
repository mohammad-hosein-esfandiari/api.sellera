const { check , validationResult} = require("express-validator");
const { Product } = require("../../models/Product");
const createResponse = require("../../utils/createResponse");

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

            // Base query to filter by website and isOnline
            let query = { website_name: website };

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
                .sort(sortOptions)
                .limit(limit)
                .skip(skip);

            // Get total count for pagination
            const totalProducts = await Product.countDocuments(query);

            if(!totalProducts.length){
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
