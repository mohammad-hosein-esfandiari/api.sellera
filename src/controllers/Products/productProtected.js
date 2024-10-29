const { handleValidationErrors } = require("../../middlewares/handleValidation");
const { Product } = require("../../models/Product");
const { Website } = require("../../models/Website");
const createResponse = require("../../utils/createResponse");
const createUniqueSlug = require("../../utils/createUniqueSlug");
const { body, validationResult, check } = require('express-validator'); // Importing express-validator

// Define validation rules
const productValidationRules = () => {
    return [
        body('title')
            .isString().withMessage('Product title must be a string.')
            .isLength({ min: 3, max: 100 }).withMessage('Product title must be between 3 and 100 characters long.'),
        body('domain_name')
            .isString().withMessage('Domain name must be a string.'),
            
    ];
};

exports.addProduct = [
    productValidationRules(), // Applying validation rules
    handleValidationErrors,
    async (req, res) => {
        try {


            const { title, domain_name } = req.body; // Get the title and domain_name from the request body

            // Create a unique slug from the title
            const slug = await createUniqueSlug(title);

            // Check for duplicate slug
            const existingProduct = await Product.findOne({ slug });
            if (existingProduct) {
                return res.status(400).json(createResponse("A product with this slug already exists.", "error", 400));
            }

            // Create a new product instance
            const newProduct = new Product({
                title,
                slug, // Set the unique slug
                website_name: domain_name, // Optionally allow website_name
            });

            await newProduct.save(); // Save the product to the database
            
            return res.status(201).json(createResponse("Product added successfully.", "success", 201, { data: newProduct }));
        } catch (error) {
            return res.status(500).json(createResponse("Error adding product: " + error.message, "error", 500));
        }
    }
];



// Update product title
exports.updateProductTitle = [
    check('title')
        .isString().withMessage('Title must be a string.')
        .isLength({ min: 3, max: 100 }).withMessage('Title must be between 3 and 100 characters.'),
    check('domain_name')
        .isString().withMessage('Domain name must be a string.'),
        handleValidationErrors,
    async (req, res) => {


        try {
            const { slug  } = req.params;
            const { title , domain_name} = req.body;

            const product = await Product.findOneAndUpdate({slug, website_name:domain_name}, { title }, { new: true });

            if (!product) {
                return res.status(404).json(createResponse("Product not found.", "error", 404));
            }

            return res.status(200).json(createResponse("Product title updated successfully.", "success", 200, { data: product }));
        } catch (error) {
            return res.status(500).json(createResponse("Internal server error.", "error", 500));
        }
    }
];



// Update product category based on slug and website domain
exports.updateProductCategory = [
    // Validation rules for category and domain_name fields
    check('category')
        .isString().withMessage('Category must be a valid string.')
        .notEmpty().withMessage('Category cannot be empty.'),

    check('domain_name')
        .isString().withMessage('Domain name must be a valid string.'),
        handleValidationErrors,
    // Controller logic for updating product category
    async (req, res) => {


        try {
            const { slug } = req.params; // Extract product slug from URL parameters
            const { category, domain_name } = req.body; // Extract category and domain_name from request body

            // Find the website by domain_name to get its categories
            const website = await Website.findOne({ domain_name });
            if (!website) {
                return res.status(404).json(createResponse("Website not found.", "error", 404));
            }

            // Check if the category of site is empty
            if(!website.categories.length){
                return res.status(404).json(createResponse("Category of website is empty, plz add first.", "error", 404))
            }

            // Check if the provided category exists in the website's categories
            if (!website.categories.includes(category)) {
                return res.status(400).json(createResponse(
                    `Invalid category. The category must be one of the website's predefined categories : [ ${website.categories.join(",")} ]`,
                    "error",
                    400,
                ));
            }

            // Find the product based on slug and website domain name, and update its category
            const product = await Product.findOneAndUpdate(
                { slug, website_name: domain_name }, // Search criteria
                { category }, // Fields to update
                { new: true } // Return the updated document
            );

            // If product not found, return 404 error response
            if (!product) {
                return res.status(404).json(createResponse("Product not found.", "error", 404));
            }

            // Return success response with the updated product
            return res.status(200).json(createResponse(
                "Product category updated successfully.",
                "success",
                200,
                {data: {category: product.category} }
            ));
        } catch (error) {
            // Handle any internal server errors
            return res.status(500).json(createResponse("Internal server error.", "error", 500));
        }
    }
];



// Update product price
exports.updateProductPrice = [
    // Validate amount
    check('amount')
        .notEmpty().withMessage('Amount cannot be empty.')
        .isFloat({ min: 0 }).withMessage('Amount must be a positive number.'),

    // Validate currency
    check('currency')
        .notEmpty().withMessage('Currency cannot be empty.')
        .isAlpha().withMessage('Currency must contain only letters.'),

    // Validate domain_name
    check('domain_name')
        .notEmpty().withMessage('Domain name cannot be empty.')
        .isString().withMessage('Domain name must be a valid string.'),
        handleValidationErrors,
    // Controller function
    async (req, res) => {


        try {
            const { slug } = req.params;
            const { amount, currency, domain_name } = req.body;



            const product = await Product.findOneAndUpdate(
                { slug, website_name: domain_name },  // Use domain_name from body
                { price:{amount,currency} },
                { new: true }
            );

            if (!product) {
                return res.status(404).json(createResponse("Product not found.", "error", 404));
            }

            return res.status(200).json(createResponse("Product price updated successfully.", "success", 200, { data: {price:product.price} }));
        } catch (error) {
            console.error("Error updating product price:", error);
            return res.status(500).json(createResponse("Internal server error.", "error", 500));
        }
    }
];






// Toggle product's online status with validation checks
exports.toggleProductStatus = [
    // Validation checks for 'domain_name' and 'slug'
    check("domain_name").notEmpty().isString().withMessage("Domain name must be a valid string."),
    check("slug").notEmpty().isString().withMessage("Slug must be a valid string."),
    handleValidationErrors,
    async (req, res) => {


        try {
            const { slug } = req.params;
            const { domain_name} = req.body

            // Find product by slug and domain_name
            const product = await Product.findOne({ slug, website_name: domain_name });

            // If product does not exist, return a 404 response
            if (!product) {
                return res.status(404).json(createResponse("Product not found.", "error", 404));
            }

            // Check the current status of isOnline
            if (product.isOnline) {
                // If product is online, set to offline without further checks
                product.isOnline = false;
                await product.save();
                return res.status(200).json(createResponse("Product is now offline.", "success", 200, { data: product }));
            } else {
                // If product is offline, validate conditions for going online

                // Check if the product has at least one banner image
                if (!product.images || product.images.length === 0) {
                    return res.status(400).json(createResponse("Product must have at least one banner image to go online.", "error", 400));
                }

                // Check if the product category is set and not empty
                if (!product.category || product.category.trim() === "") {
                    return res.status(400).json(createResponse("Product category is required to go online.", "error", 400));
                }

                // Set product to online if all conditions are met
                product.isOnline = true;
                await product.save();
                return res.status(200).json(createResponse("Product is now online.", "success", 200, { data: {isOnline:product.isOnline}  }));
            }
        } catch (error) {
            return res.status(500).json(createResponse("Internal server error.", "error", 500));
        }
    }
];

// Add a new banner image
exports.addBanner = [
    check("domain_name").notEmpty().isString().withMessage("Domain name must be a valid string."),

    check('url')
        .notEmpty().withMessage('Image URL cannot be empty.')
        .isString().withMessage('Image URL must be a string.')
        .matches(/\.(jpg|jpeg|png|webp|gif)$/i).withMessage('Image URL must end with a valid image file format (e.g., jpg, jpeg, png, webp, gif).'),
    
    check('alt')
        .optional() // Alt text is optional
        .isString().withMessage('Alt text must be a string.')
        .isLength({ max: 100 }).withMessage('Alt text must be at most 100 characters long.'),
        handleValidationErrors,
    async (req, res) => {

        
        const { url, alt } = req.body;
        const { slug } = req.params; // Getting slug from URL parameters
        const { domain_name } = req.body; // Getting domain_name from request body

        try {
            const product = await Product.findOneAndUpdate(
                { slug: slug, website_name: domain_name }, // Using both slug and domain_name to find the product
                { $push: { images: { url, alt: alt || "" } } }, // Adding new banner image to the array
                { new: true }
            );

            if (!product) {
                return res.status(404).json(createResponse("Product not found..", "error", 404));
            }

            return res.status(200).json(createResponse("Banner image added successfully.", "success", 200, {data:{images:product.images}}));
        } catch (error) {
            return res.status(500).json(createResponse("Internal server error.", "error", 500));
        }
    }
];



// Delete a banner image by image ID
exports.deleteBannerById = [
    check("domain_name").notEmpty().isString().withMessage("Domain name must be a valid string."),

    check('imageId')
        .notEmpty().withMessage('Image ID cannot be empty.')
        .isMongoId().withMessage('Invalid Image ID format.'),
        handleValidationErrors,
    async (req, res) => {

     
        const { imageId } = req.body; // Getting the ID of the image to be deleted
        const { slug } = req.params; // Getting slug from URL parameters
        const { domain_name } = req.body; // Getting domain_name from the request body

        try {
            const product = await Product.findOneAndUpdate(
                { slug: slug, website_name: domain_name }, // Using slug and domain_name to find the product
                { $pull: { images: { _id: imageId } } }, // Removing the banner image by ID
                { new: true }
            );

            if (!product) {
                return res.status(404).json(createResponse("Product not found.", "error", 404));
            }

            return res.status(200).json(createResponse("Banner image deleted successfully.", "success", 200, {data:{images:product.images}}));
        } catch (error) {
            return res.status(500).json(createResponse("Internal server error.", "error", 500));
        }
    }
];



// Update a banner image by image ID
exports.updateBannerById = [
    check("domain_name").notEmpty().isString().withMessage("Domain name must be a valid string."),

    check('imageId')
        .notEmpty().withMessage('Image ID cannot be empty.')
        .isMongoId().withMessage('Invalid Image ID format.'),
    
    check('url')
        .optional() // URL optional for update
        .isString().withMessage('Image URL must be a string.')
        .matches(/\.(jpg|jpeg|png|webp|gif)$/i).withMessage('Image URL must end with a valid image file format (e.g., jpg, jpeg, png, webp, gif).'),
    
    check('alt')
        .optional() // Alt text is optional
        .isString().withMessage('Alt text must be a string.')
        .isLength({ max: 100 }).withMessage('Alt text must be at most 100 characters long.'),
    
    handleValidationErrors,
    async (req, res) => {


        const { imageId } = req.body; // Getting the ID of the image to be updated
        const { slug } = req.params; // Getting slug from URL parameters
        const { domain_name } = req.body; // Getting domain_name from the request body

        const updateData = {};
        if (req.body.url) updateData['images.$.url'] = req.body.url; // Update URL if provided
        if (req.body.alt) updateData['images.$.alt'] = req.body.alt; // Update alt text if provided

        try {
            const product = await Product.findOneAndUpdate(
                { slug: slug, website_name: domain_name, 'images._id': imageId }, // Using slug, domain_name, and image ID to find the product
                { $set: updateData }, // Updating the specified fields
                { new: true }
            );

            if (!product) {
                return res.status(404).json(createResponse("Product not found or image ID does not exist.", "error", 404));
            }

            return res.status(200).json(createResponse("Banner image updated successfully.", "success", 200, {data:{images:product.images}}));
        } catch (error) {
            return res.status(500).json(createResponse("Internal server error.", "error", 500));
        }
    }
];


// Update the order of images based on provided IDs
exports.updateImageOrder = [
    check("domain_name").notEmpty().isString().withMessage("Domain name must be a valid string."),

    check('imageIds')
        .isArray().withMessage('Image IDs must be an array.')
        .notEmpty().withMessage('Image IDs array cannot be empty.'),
        handleValidationErrors,
    async (req, res) => {

        const { imageIds ,domain_name} = req.body; // Get the array of image IDs from body
        const { slug } = req.params; // Get product slug from URL parameters

        try {
            const product = await Product.findOne({ slug ,website_name:domain_name});

            if (!product) {
                return res.status(404).json(createResponse("Product not found.", "error", 404));
            }

            // Filter images to keep only those that exist in the product
            const existingImages = product.images.filter(image => imageIds.includes(image._id.toString()));

            // Reorder images based on the order of IDs in the imageIds array
            const orderedImages = imageIds.map(id => existingImages.find(image => image._id.toString() === id)).filter(Boolean);

            // Update the product with the reordered images
            product.images = orderedImages;
            await product.save();

            return res.status(200).json(createResponse("Images reordered successfully.", "success", 200, {data:{images:product.images}}));
        } catch (error) {
            return res.status(500).json(createResponse("Internal server error.", "error", 500));
        }
    }
];



// API to update the store quantity of a product
exports.updateStore = [
    // Validation for store field
    check('store')
        .isInt({ min: 0 }).withMessage('Store quantity must be a non-negative integer.'),

    handleValidationErrors, // Call the validation error handler

    async (req, res) => {
        const { store, domain_name } = req.body; // Store quantity and domain name from request body
        const { slug } = req.params; // Product slug from URL parameters

        try {
            // Find the product by slug and domain name
            const product = await Product.findOne({ slug, website_name: domain_name });

            // If the product is not found, return a 404 error
            if (!product) {
                return res.status(404).json(createResponse("Product not found.", "error", 404));
            }

            // Update the store quantity
            product.store = store;

            // Save the updated product
            await product.save();

            // Send a success response with the updated product
            return res.status(200).json(createResponse("Store quantity updated successfully.", "success", 200, {data:{ store: product.store }}));
        } catch (error) {
            // Return a 500 error in case of any internal server error
            return res.status(500).json(createResponse("Internal server error.", "error", 500));
        }
    }
];


// API to update the colors of a product
exports.updateColors = [
    // Validation for colors field
    check('colors')
        .isArray().withMessage('Colors must be an array.')
        .notEmpty().withMessage('Colors array cannot be empty.')
        .custom((colors) => colors.every(color => typeof color === 'string')).withMessage('All colors must be strings.'),

    handleValidationErrors, // Call the validation error handler

    async (req, res) => {
        const { colors, domain_name } = req.body; // Colors and domain name from request body
        const { slug } = req.params; // Product slug from URL parameters

        try {
            // Find the product by slug and domain name
            const product = await Product.findOne({ slug, website_name: domain_name });

            // If the product is not found, return a 404 error
            if (!product) {
                return res.status(404).json(createResponse("Product not found.", "error", 404));
            }

            // Update the colors
            product.colors = colors;

            // Save the updated product
            await product.save();

            // Send a success response with the updated colors
            return res.status(200).json(createResponse("Colors updated successfully.", "success", 200, { colors: product.colors }));
        } catch (error) {
            // Return a 500 error in case of any internal server error
            return res.status(500).json(createResponse("Internal server error.", "error", 500));
        }
    }
];


// Regular expression to check for hex color code
const hexColorRegex = /^#([0-9A-F]{3}){1,2}$/i;

// API to update the colors of a product
exports.updateColors = [
    // Validation for colors field
    check('colors')
        .isArray().withMessage('Colors must be an array.')
        .notEmpty().withMessage('Colors array cannot be empty.')
        .custom((colors) => colors.every(color => hexColorRegex.test(color)))
        .withMessage('All colors must be valid hex color codes.'),

    handleValidationErrors, // Call the validation error handler

    async (req, res) => {
        const { colors, domain_name } = req.body; // Colors and domain name from request body
        const { slug } = req.params; // Product slug from URL parameters

        try {
            // Find the product by slug and domain name
            const product = await Product.findOne({ slug, website_name: domain_name });

            // If the product is not found, return a 404 error
            if (!product) {
                return res.status(404).json(createResponse("Product not found.", "error", 404));
            }

            // Update the colors
            product.colors = colors;

            // Save the updated product
            await product.save();

            // Send a success response with the updated colors
            return res.status(200).json(createResponse("Colors updated successfully.", "success", 200, {data:{ colors: product.colors }}));
        } catch (error) {
            // Return a 500 error in case of any internal server error
            return res.status(500).json(createResponse("Internal server error.", "error", 500));
        }
    }
];


// API to update the introduction field of a product
exports.updateIntroduction = [
    // Validation for introduction field
    check('introduction')
        .isString().withMessage('Introduction must be a string.')
        .notEmpty().withMessage('Introduction cannot be empty.'),

    handleValidationErrors, // Call the validation error handler

    async (req, res) => {
        const { introduction, domain_name } = req.body; // Introduction and domain name from request body
        const { slug } = req.params; // Product slug from URL parameters

        try {
            // Find the product by slug and domain name
            const product = await Product.findOne({ slug, website_name: domain_name });

            // If the product is not found, return a 404 error
            if (!product) {
                return res.status(404).json(createResponse("Product not found.", "error", 404));
            }

            // Update the introduction field
            product.introduction = introduction;

            // Save the updated product
            await product.save();

            // Send a success response with the updated introduction
            return res.status(200).json(createResponse("Introduction updated successfully.", "success", 200, {data:{ introduction: product.introduction }}));
        } catch (error) {
            // Return a 500 error in case of any internal server error
            return res.status(500).json(createResponse("Internal server error.", "error", 500));
        }
    }
];






// API to add details to a product
exports.addDetail = [
    // Validation for details fields
    check('base_title').isString().withMessage('Base title must be a string.').notEmpty().withMessage('Base title is required.'),
    check('items').isArray({ min: 1 }).withMessage('Items should be a non-empty array.'),
    check('items.*.title').isString().withMessage('Item title must be a string.').notEmpty().withMessage('Item title is required.'),
    check('items.*.description').isString().withMessage('Item description must be a string.').notEmpty().withMessage('Item description is required.'),

    handleValidationErrors,

    async (req, res) => {
        const { base_title, items, domain_name } = req.body;
        const { slug } = req.params;

        try {
            const product = await Product.findOne({ slug, website_name: domain_name });
            if (!product) {
                return res.status(404).json(createResponse("Product not found.", "error", 404));
            }

            product.details.push({ base_title, items });
            await product.save();

            return res.status(200).json(createResponse("Details added successfully.", "success", 200, {data:{ details: product.details }}));
        } catch (error) {
            return res.status(500).json(createResponse("Internal server error.", "error", 500));
        }
    }
];


// API to update details in a product
exports.updateDetail = [
    check('base_title').optional().isString().withMessage('Base title must be a string.'),
    check('items').optional().isArray().withMessage('Items should be an array.'),
    check('items.*.title').optional().isString().withMessage('Item title must be a string.'),
    check('items.*.description').optional().isString().withMessage('Item description must be a string.'),

    handleValidationErrors,

    async (req, res) => {
        const { id } = req.params;
        const { base_title, items, domain_name } = req.body;
        const { slug } = req.params;

        try {
            const product = await Product.findOne({ slug, website_name: domain_name });
            if (!product) {
                return res.status(404).json(createResponse("Product not found.", "error", 404));
            }

            const detail = product.details.id(id);
            if (!detail) {
                return res.status(404).json(createResponse("Detail not found.", "error", 404));
            }

            if (base_title) detail.base_title = base_title;
            if (items) detail.items = items;

            await product.save();

            return res.status(200).json(createResponse("Details updated successfully.", "success", 200, {data:{ details: product.details }}));
        } catch (error) {
            return res.status(500).json(createResponse("Internal server error.", "error", 500));
        }
    }
];

// API to delete a detail by ID
exports.deleteDetail = [
    // Validation for detailId
    check('id').isMongoId().withMessage('Invalid detail ID.'),

    handleValidationErrors,

    async (req, res) => {
        const { domain_name } = req.body; // Get the domain name from the request body
        const { slug, id } = req.params; // Get product slug and detailId from route parameters

        try {
            const product = await Product.findOne({ slug, website_name: domain_name });
            if (!product) {
                return res.status(404).json(createResponse("Product not found.", "error", 404));
            }

            // Filter out the detail with the specified detailId
            product.details = product.details.filter(detail => detail._id.toString() !== id);

            await product.save();

            return res.status(200).json(createResponse("Detail deleted successfully.", "success", 200 , {data:{details:product.details}}));
        } catch (error) {
            return res.status(500).json(createResponse("Internal server error.", "error", 500));
        }
    }
];