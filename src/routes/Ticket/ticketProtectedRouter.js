const express = require("express");
const router = express.Router();
const TicketProtectedController = require('../../controllers/Ticket/ticketProtected');
const authenticateToken = require("../../middlewares/authenticateToken");

router.get("/", TicketProtectedController.getAllTicketForWebsite);

router.post("/comment", TicketProtectedController.addCommentToTicket);

router.patch("/assign", TicketProtectedController.assignTicket);

router.patch("/category", TicketProtectedController.changeCategory);

router.patch("/status", TicketProtectedController.changeStatus);

router.patch("/priority", TicketProtectedController.changePriority);

module.exports = router;