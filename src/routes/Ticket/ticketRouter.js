const express = require("express");
const router = express.Router();
const TicketController = require('../../controllers/Ticket/ticket');
const authenticateToken = require("../../middlewares/authenticateToken");

router.post("/" , TicketController.createTicket);

router.delete("/" , TicketController.deleteTicket);

router.get("/" , TicketController.getAllTicketForOnePerson);

router.put("/" , TicketController.updateTicket);


module.exports = router;