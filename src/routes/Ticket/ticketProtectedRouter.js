const express = require("express");
const router = express.Router();
const TicketProtectedController = require('../../controllers/Ticket/ticketProtected');
const authenticateToken = require("../../middlewares/authenticateToken");

router.get("/", TicketProtectedController.getAllTicketForWebsite);


module.exports = router;