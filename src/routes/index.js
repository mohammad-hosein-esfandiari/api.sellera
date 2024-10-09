const express = require('express');
const router = express.Router();
const authRoutes = require('./auth');
const userRoutes = require('./userRoutes');
const websiteProtectedRoutes = require('./website/websiteProtectedRoutes');
const authenticateToken = require('../middlewares/authenticateToken');
const WebsiteRoutes = require("./website/websiteRouter");
const ProductProtectedRoutes = require("./products/productProtectedRoutes");
const { hasPermissions } = require('../middlewares/hasPermissions');



router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/website/protected",authenticateToken , websiteProtectedRoutes )
router.use("/website",  WebsiteRoutes)

router.use("/products/protected" ,authenticateToken ,hasPermissions(["product"]), ProductProtectedRoutes)






module.exports = router;
