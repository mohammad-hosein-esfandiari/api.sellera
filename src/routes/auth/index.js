const express = require("express");
const router = express.Router(); 
const authRoutes = require("./authRoutes"); 
const verificationRoutes = require("./verificationRoutes"); 

// Using the authentication routes
router.use(authRoutes); 

// Using the verification routes
router.use(verificationRoutes);

module.exports = router; // Exporting the router for use in other parts of the application
