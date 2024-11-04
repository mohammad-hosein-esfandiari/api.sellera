const express = require("express");
const router = express.Router();
const ProductCOntroller = require('../../controllers/Products/product');
const authenticateToken = require("../../middlewares/authenticateToken");

router.get("/:website/:slug", ProductCOntroller.getProductBySlug );


module.exports = router;