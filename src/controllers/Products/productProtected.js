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
    async (req, res) => {
        try {
            // Validate the request
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json(createResponse(errors.array()[0].msg, "error", 400));
            }

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
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json(createResponse("Validation failed.", "error", 400, { errors: errors.array().map(item => item.msg) }));
        }

        try {
            const { slug ,website } = req.params;
            const { title } = req.body;

            const product = await Product.findOneAndUpdate({slug, website_name:website}, { title }, { new: true });

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

    // Controller logic for updating product category
    async (req, res) => {
        // Check for validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json(createResponse(
                "Validation failed.",
                "error",
                400,
                { errors: errors.array().map(item => item.msg) }
            ));
        }

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
                {data: product }
            ));
        } catch (error) {
            // Handle any internal server errors
            return res.status(500).json(createResponse("Internal server error.", "error", 500));
        }
    }
];