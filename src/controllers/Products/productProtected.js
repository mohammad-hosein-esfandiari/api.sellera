const { Product } = require("../../models/Product");
const createResponse = require("../../utils/createResponse");
const createUniqueSlug = require("../../utils/createUniqueSlug");

exports.addProduct = async (req,res)=>{
    try {
        const { title } = req.body; // Get the title from the request body

        // Check if title is provided
        if (!title) {
            return res.status(400).json(createResponse("Product title is required.", "error", 400));
        }

        // Create a unique slug from the title
        const slug = await createUniqueSlug(title);

        // Create a new product instance
        const newProduct = new Product({
            title,
            slug, // Set the unique slug
            website_name: req.body.domain_name, // Optionally allow website_name
        });

        await newProduct.save(); // Save the product to the database
        
        return res.status(201).json(createResponse("Product added successfully.", "success", 201, {data: newProduct}));
    } catch (error) {
        return res.status(500).json(createResponse("Error adding product: " + error.message, "error", 500));
    }
}


