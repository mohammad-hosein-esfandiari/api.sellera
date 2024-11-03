const moment = require("moment");
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
            console.log(req.website);
            
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
                website_name: domain_name // Optionally allow website_name
            });

            await newProduct.save(); // Save the product to the database

            // Get the count of likes without sending the likes array
            const likeCount = newProduct.likes.length;

            // Delete the likes array from the product object
            newProduct.likes = undefined;

            return res.status(201).json(createResponse("Product added successfully.", "success", 201, { 
                data: {
                    ...newProduct.toObject(),
                    likeCount // Send only the count of likes
                }
            }));
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
                return res.status(200).json(createResponse("Product is now offline.", "success", 200, { data:{isOnline:product.isOnline} }));
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




// API to update SEO fields for a product
exports.updateSEO = [
    // Validate SEO fields
    check('domain_name')
        .exists().withMessage('Domain name is required.')
        .isString().withMessage('Domain name must be a string.'),
    
    check('metaTitle')
        .optional()
        .isString().withMessage('Meta title must be a string.')
        .isLength({ max: 60 }).withMessage('Meta title must not exceed 60 characters.'),
    
    check('metaDescription')
        .optional()
        .isString().withMessage('Meta description must be a string.')
        .isLength({ max: 160 }).withMessage('Meta description must not exceed 160 characters.'),
    
    check('keywords')
        .optional()
        .isArray().withMessage('Keywords must be an array.')
        .custom((keywords) => {
            return keywords.every(keyword => typeof keyword === 'string' && keyword.trim().length > 0);
        }).withMessage('Each keyword must be a non-empty string.'),
    
    handleValidationErrors,

    // Controller function to update SEO
    async (req, res) => {
        const { slug } = req.params;
        const { domain_name, metaTitle, metaDescription, keywords } = req.body;

        try {
            // Find the product by domain name and slug
            const product = await Product.findOne({ slug, website_name: domain_name });
            if (!product) {
                return res.status(404).json(createResponse("Product not found.", "error", 404));
            }

            // Update SEO fields only if they are provided in the request body
            if (metaTitle !== undefined) product.seo.metaTitle = metaTitle;
            if (metaDescription !== undefined) product.seo.metaDescription = metaDescription;
            if (keywords !== undefined) product.seo.keywords = keywords;

            // Save the updated product
            await product.save();

            return res.status(200).json(createResponse("SEO details updated successfully.", "success", 200, { data:{ seo: product.seo} }));
        } catch (error) {
            return res.status(500).json(createResponse("Internal server error.", "error", 500));
        }
    }
];



// API to update product tags
exports.updateTags = [
    // Validate the domain_name and tags fields
    check('domain_name')
        .exists().withMessage('Domain name is required.')
        .isString().withMessage('Domain name must be a string.'),
    
    check('tags')
        .exists()
        .isArray().withMessage('Tags must be an array.')
        .custom((tags) => {
            return tags.length <= 10; // Limit the number of tags to 10
        }).withMessage('You can add a maximum of 10 tags.')
        .custom((tags) => {
            return tags.every(tag => typeof tag === 'string' && tag.trim().length > 0 && tag.startsWith('#'));
        }).withMessage('Each tag must be a non-empty string and start with "#".'),

    handleValidationErrors,

    // Controller function to update product tags
    async (req, res) => {
        const { slug } = req.params;
        const { domain_name, tags } = req.body;

        try {
            // Find the product by domain name and slug
            const product = await Product.findOne({ slug, website_name: domain_name });
            if (!product) {
                return res.status(404).json(createResponse("Product not found.", "error", 404));
            }

            // Update tags only if they are provided in the request body
            if (tags !== undefined) product.tags = tags;

            // Save the updated product
            await product.save();

            return res.status(200).json(createResponse("Tags updated successfully.", "success", 200, {data:{ tags: product.tags }}));
        } catch (error) {
            return res.status(500).json(createResponse("Internal server error.", "error", 500));
        }
    }
];





// 1. API برای اضافه کردن پیشنهاد جدید
exports.addSpecialOffer = [
    check("domain_name")
        .exists().withMessage("Domain name is required.")
        .isString().withMessage("Domain name must be a string."),
    check("offerDescription")
        .exists().withMessage("Offer description is required.")
        .isString().withMessage("Offer description must be a string.")
        .isLength({ max: 355 }).withMessage("Offer description must not exceed 355 characters."),
    check("offerStartDate")
        .exists().withMessage("Offer start date is required.")
        .isISO8601().withMessage("Offer start date must be a valid date.")
        .custom((value) => {
            const startDate = moment(value);
            const today = moment().startOf("day").add(1, "day"); // ۱۲ شب روز بعد
            return startDate.isSame(today) || startDate.isAfter(today);
        }).withMessage("Offer start date must be at 00:00 or later than today midnight."),
    check("offerEndDate")
        .exists().withMessage("Offer end date is required.")
        .isISO8601().withMessage("Offer end date must be a valid date.")
        .custom((value, { req }) => {
            const endDate = moment(value);
            const startDate = moment(req.body.offerStartDate);
            return endDate.isAfter(startDate);
        }).withMessage("Offer end date must be after the start date."),
    check("discount")
        .exists().withMessage("Discount is required.")
        .isNumeric().withMessage("Discount must be a number.")
        .custom((value) => value >= 0 && value <= 100).withMessage("Discount must be between 0 and 100 for %."),
    handleValidationErrors,

    // Controller function to add a new special offer
    async (req, res) => {
        const { slug } = req.params;
        const { domain_name, active, offerDescription, offerStartDate, offerEndDate, discount } = req.body;

        try {
            const product = await Product.findOne({ slug, website_name: domain_name });
            if (!product) {
                return res.status(404).json(createResponse("Product not found.", "error", 404));
            }

            // اضافه کردن پیشنهاد جدید به آرایه پیشنهادات ویژه
            product.specialOffers.push({
                active,
                offerDescription,
                offerStartDate: new Date(offerStartDate),
                offerEndDate: new Date(offerEndDate),
                discount
            });

            await product.save();

            return res.status(200).json(createResponse("Special offer added successfully.", "success", 200, { specialOffers: product.specialOffers }));
        } catch (error) {
            return res.status(500).json(createResponse("Internal server error.", "error", 500));
        }
    }
];








// 1. API for adding a new special offer
exports.addSpecialOffer = [
    check("domain_name")
        .exists().withMessage("Domain name is required.") // Check if domain name exists
        .isString().withMessage("Domain name must be a string."), // Ensure domain name is a string
    check("offerDescription")
        .exists().withMessage("Offer description is required.") // Check if offer description exists
        .isString().withMessage("Offer description must be a string.") // Ensure offer description is a string
        .isLength({ max: 355 }).withMessage("Offer description must not exceed 355 characters."), // Limit offer description length
    check("offerStartDate")
        .exists().withMessage("Offer start date is required.") // Check if offer start date exists
        .isISO8601().withMessage("Offer start date must be a valid date.") // Ensure it's a valid date
        .custom((value) => {
            const startDate = moment(value);
            const today = moment().startOf("day").add(1, "day"); // Calculate midnight of the next day
            return startDate.isSame(today) || startDate.isAfter(today); // Check if start date is today or later
        }).withMessage("Offer start date must be at 00:00 or later than today midnight."),
    check("offerEndDate")
        .exists().withMessage("Offer end date is required.") // Check if offer end date exists
        .isISO8601().withMessage("Offer end date must be a valid date.") // Ensure it's a valid date
        .custom((value, { req }) => {
            const endDate = moment(value);
            const startDate = moment(req.body.offerStartDate); // Get start date from request body
            return endDate.isAfter(startDate); // Check if end date is after start date
        }).withMessage("Offer end date must be after the start date."),
    check("discount")
        .exists().withMessage("Discount is required.") // Check if discount exists
        .isNumeric().withMessage("Discount must be a number.") // Ensure discount is numeric
        .custom((value) => value >= 0 && value <= 100).withMessage("Discount must be between 0 and 100 for %."), // Validate discount range
    handleValidationErrors, // Handle validation errors

    // Controller function to add a new special offer
    async (req, res) => {
        const { slug } = req.params; // Get product slug from request parameters
        const { domain_name, active, offerDescription, offerStartDate, offerEndDate, discount } = req.body; // Destructure request body

        try {
            const product = await Product.findOne({ slug, website_name: domain_name }); // Find product by slug and domain name
            if (!product) {
                return res.status(404).json(createResponse("Product not found.", "error", 404)); // Return error if product not found
            }

            // Add new special offer to the specialOffers array
            product.specialOffers.push({
                active,
                offerDescription,
                offerStartDate: new Date(offerStartDate), // Convert to date object
                offerEndDate: new Date(offerEndDate), // Convert to date object
                discount
            });

            await product.save(); // Save changes to the product

            return res.status(200).json(createResponse("Special offer added successfully.", "success", 200, {data:{ specialOffers: product.specialOffers }})); // Return success response
        } catch (error) {
            return res.status(500).json(createResponse("Internal server error.", "error", 500)); // Handle server error
        }
    }
];

// 2. API for updating a special offer
exports.updateSpecialOffer = [
    check("domain_name")
    .exists().withMessage("Domain name is required.") // Check if domain name exists
    .isString().withMessage("Domain name must be a string."), // Ensure domain name is a string
check("offerDescription")
    .exists().withMessage("Offer description is required.") // Check if offer description exists
    .isString().withMessage("Offer description must be a string.") // Ensure offer description is a string
    .isLength({ max: 355 }).withMessage("Offer description must not exceed 355 characters."), // Limit offer description length
check("offerStartDate")
    .exists().withMessage("Offer start date is required.") // Check if offer start date exists
    .isISO8601().withMessage("Offer start date must be a valid date.") // Ensure it's a valid date
    .custom((value) => {
        const startDate = moment(value);
        const today = moment().startOf("day").add(1, "day"); // Calculate midnight of the next day
        return startDate.isSame(today) || startDate.isAfter(today); // Check if start date is today or later
    }).withMessage("Offer start date must be at 00:00 or later than today midnight."),
check("offerEndDate")
    .exists().withMessage("Offer end date is required.") // Check if offer end date exists
    .isISO8601().withMessage("Offer end date must be a valid date.") // Ensure it's a valid date
    .custom((value, { req }) => {
        const endDate = moment(value);
        const startDate = moment(req.body.offerStartDate); // Get start date from request body
        return endDate.isAfter(startDate); // Check if end date is after start date
    }).withMessage("Offer end date must be after the start date."),
check("discount")
    .exists().withMessage("Discount is required.") // Check if discount exists
    .isNumeric().withMessage("Discount must be a number.") // Ensure discount is numeric
    .custom((value) => value >= 0 && value <= 100).withMessage("Discount must be between 0 and 100 for %."), // Validate discount range
    handleValidationErrors, // Handle validation errors

    async (req, res) => {
        const { slug, offerId } = req.params; // Get product slug and offer ID from request parameters
        const { domain_name, offerDescription, offerStartDate, offerEndDate, discount } = req.body; // Destructure request body

        try {
            const product = await Product.findOne({ slug, website_name: domain_name }); // Find product by slug and domain name
            if (!product) {
                return res.status(404).json(createResponse("Product not found.", "error", 404)); // Return error if product not found
            }

            // Find the special offer to update
            const offer = product.specialOffers.id(offerId);
            if (!offer) {
                return res.status(404).json(createResponse("Special offer not found.", "error", 404)); // Return error if offer not found
            }

            // Apply changes only if fields are provided
            if (offerDescription !== undefined) offer.offerDescription = offerDescription; // Update offer description
            if (offerStartDate !== undefined) offer.offerStartDate = new Date(offerStartDate); // Update offer start date
            if (offerEndDate !== undefined) offer.offerEndDate = new Date(offerEndDate); // Update offer end date
            if (discount !== undefined) offer.discount = discount; // Update discount

            await product.save(); // Save changes to the product

            return res.status(200).json(createResponse("Special offer updated successfully.", "success", 200, {data:{ specialOffers: product.specialOffers }})); // Return success response
        } catch (error) {
            return res.status(500).json(createResponse("Internal server error.", "error", 500)); // Handle server error
        }
    }
];

// 3. API for deleting a special offer
exports.deleteSpecialOffer = async (req, res) => {
    const { slug, offerId } = req.params; // Get product slug and offer ID from request parameters
    const { domain_name } = req.body; // Get domain name from request body

    try {
        const product = await Product.findOne({ slug, website_name: domain_name }); // Find product by slug and domain name
        if (!product) {
            return res.status(404).json(createResponse("Product not found.", "error", 404)); // Return error if product not found
        }

        // Delete the special offer from the array
        const offer = product.specialOffers.id(offerId);
        if (!offer) {
            return res.status(404).json(createResponse("Special offer not found.", "error", 404)); // Return error if offer not found
        }
        // Remove the special offer using MongoDB's $pull operator
        const result = await Product.updateOne(
            { slug, website_name: domain_name },
            { $pull: { specialOffers: { _id: offerId } } } // Remove the special offer with the specified offerId
        );

        if (result.modifiedCount === 0) {
            return res.status(404).json(createResponse("Special offer not found.", "error", 404));
        }

        return res.status(200).json(createResponse("Special offer deleted successfully.", "success", 200, {data:{ specialOffers: product.specialOffers }})); // Return success response
    } catch (error) {
        return res.status(500).json(createResponse("Internal server error.", "error", 500)); // Handle server error
    }
};



// Update shipping information for a product
exports.updateShipping = [
    // Validate the product slug and shipping fields
    check('slug')
        .isString().withMessage('Product slug must be a valid string.')
        .notEmpty().withMessage('Product slug is required.'),

    check('shipping.weight')
        .optional()
        .isNumeric().withMessage('Weight must be a number.'),

    check('shipping.dimensions.length')
        .optional()
        .isNumeric().withMessage('Length must be a number.'),
        
    check('shipping.dimensions.width')
        .optional()
        .isNumeric().withMessage('Width must be a number.'),
        
    check('shipping.dimensions.height')
        .optional()
        .isNumeric().withMessage('Height must be a number.'),

    check('shipping.deliveryTime')
        .optional()
        .isString().withMessage('Delivery time must be a valid string.'),
        
        handleValidationErrors, // Handle validation errors
    // Controller logic for updating shipping information
    async (req, res) => {

        try {
            const {slug} = req.params;
            const {  shipping , domain_name } = req.body;

            // Find the product by slug
            const product = await Product.findOne({ slug,website_name:domain_name });
            if (!product) {
                return res.status(404).json(createResponse("Product not found.", "error", 404));
            }

            // Update the shipping fields
            if (shipping) {
                if (shipping.weight !== undefined) product.shipping.weight = shipping.weight;
                if (shipping.dimensions) {
                    if (shipping.dimensions.length !== undefined) product.shipping.dimensions.length = shipping.dimensions.length;
                    if (shipping.dimensions.width !== undefined) product.shipping.dimensions.width = shipping.dimensions.width;
                    if (shipping.dimensions.height !== undefined) product.shipping.dimensions.height = shipping.dimensions.height;
                }
                if (shipping.deliveryTime) product.shipping.deliveryTime = shipping.deliveryTime;
            }

            await product.save();

            return res.status(200).json(createResponse(
                "Shipping information updated successfully.",
                "success",
                200,
                {data:{ shipping: product.shipping }}
            ));
        } catch (error) {
            return res.status(500).json(createResponse("Internal server error.", "error", 500));
        }
    }
];



