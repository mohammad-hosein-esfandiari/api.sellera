const express = require("express");
const ProductProtectedController = require("../../controllers/Products/productProtected");
const { Product } = require("../../models/Product");
const createResponse = require("../../utils/createResponse");
const router = express.Router();


router.post("/add", ProductProtectedController.addProduct )

// Route to get a product by slug
router.get("/:slug/:title", async (req, res) => {
    try {
        const product = await Product.findOne({ slug: req.params.slug });
        
        if (!product) {
            return res.status(404).json(createResponse("Product not found.", "error", 404));
        }
        
        return res.status(200).json(createResponse("Product retrieved successfully.", "success", 200, {data:product}));
    } catch (error) {
        return res.status(500).json(createResponse("Error retrieving product: " + error.message, "error", 500));
    }
});


module.exports = router;