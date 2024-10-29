const express = require("express");
const ProductProtectedController = require("../../controllers/Products/productProtected");
const { Product } = require("../../models/Product");
const createResponse = require("../../utils/createResponse");
const router = express.Router();


router.post("/add", ProductProtectedController.addProduct )
router.put("/:website/:slug/title", ProductProtectedController.updateProductTitle )
router.put("/:website/:slug/category", ProductProtectedController.updateProductCategory )
router.put("/:website/:slug/price", ProductProtectedController.updateProductPrice )



module.exports = router;