const express = require('express');
const router = express.Router();
const authRoutes = require('./auth');
const userRoutes = require('./userRoutes');
const websiteProtectedRoutes = require('./website/websiteProtectedRoutes');
const authenticateToken = require('../middlewares/authenticateToken');
const WebsiteRoutes = require("./website/websiteRouter");
const ProductProtectedRoutes = require("./products/productProtectedRoutes");
const ProductRoutes = require("./products/productRoutes");
const CommnetRoutes = require("./comment/commentRoutes");
const UploadRoutes = require("./upload/uploadRouter");
const TicketRoutes = require("./Ticket/ticketRouter");
const TicketProtectedRoutes = require("./Ticket/ticketProtectedRouter");
const { hasPermissions } = require('../middlewares/hasPermissions');
const checkSubscription = require('../middlewares/checkSubscription');



router.use("/upload", UploadRoutes )


router.use("/auth", authRoutes);
router.use("/users", userRoutes);


router.use("/website/protected", authenticateToken , websiteProtectedRoutes )
router.use("/website",  WebsiteRoutes)


router.use("/products/protected" ,checkSubscription ,authenticateToken , ProductProtectedRoutes)
router.use("/products" , ProductRoutes)



router.use("/comment" , CommnetRoutes)

router.use("/ticket" , authenticateToken , TicketRoutes)
router.use("/ticket/protected" , authenticateToken, hasPermissions(["comment","order"]) , TicketProtectedRoutes)



module.exports = router;
