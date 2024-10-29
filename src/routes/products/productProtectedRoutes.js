const express = require("express");
const ProductProtectedController = require("../../controllers/Products/productProtected");
const { Product } = require("../../models/Product");
const createResponse = require("../../utils/createResponse");
const router = express.Router();


router.post("/add", ProductProtectedController.addProduct )
router.put("/:slug/title", ProductProtectedController.updateProductTitle )
router.put("/:slug/category", ProductProtectedController.updateProductCategory )
router.put("/:slug/price", ProductProtectedController.updateProductPrice )
router.put("/:slug/status", ProductProtectedController.toggleProductStatus )
router.post("/:slug/image", ProductProtectedController.addBanner )
router.delete("/:slug/image", ProductProtectedController.deleteBannerById )
router.put("/:slug/image", ProductProtectedController.updateBannerById )
router.put("/:slug/image-order", ProductProtectedController.updateImageOrder )



module.exports = router;