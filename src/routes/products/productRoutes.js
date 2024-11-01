const express = require("express");
const router = express.Router();
const ProductCOntroller = require('../../controllers/Products/product');
const authenticateToken = require("../../middlewares/authenticateToken");

router.get("/:website/:slug/:title", ProductCOntroller.getProductBySlug );
router.get("/:website", ProductCOntroller.getProductsOfWebsiteByFilter );

router.post("/:website/:slug/rating",authenticateToken , ProductCOntroller.addRating );
router.post("/:website/:slug/like",authenticateToken, ProductCOntroller.toggleLike );

module.exports = router;