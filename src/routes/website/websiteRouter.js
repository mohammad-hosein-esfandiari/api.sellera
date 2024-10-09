const express = require("express");
const WebsiteController = require("../../controllers/Website/controllers/websiteController");
const authenticateToken = require("../../middlewares/authenticateToken");
const router = express.Router();

router.get('/info/:domain_name' , WebsiteController.getWebsiteInfoForBuyers)

router.post('/toggle-followers/:domain_name' , authenticateToken , WebsiteController.toggleFollowerStatus)


module.exports = router;
