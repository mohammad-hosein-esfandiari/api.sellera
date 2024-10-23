const express = require("express");
const router = express.Router();
const ProductCOntroller = require('../../controllers/Products/product')

router.get("/:website/:slug/:title", ProductCOntroller.getProductBySlug );
router.get("/:website", ProductCOntroller.getProductsOfWebsiteByFilter );

module.exports = router;