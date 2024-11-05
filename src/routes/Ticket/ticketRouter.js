const express = require("express");
const router = express.Router();
const {Website} = require("../../models/Website");
const TicketController = require('../../controllers/Ticket/ticket');
const authenticateToken = require("../../middlewares/authenticateToken");
const createResponse = require("../../utils/createResponse");


const websiteCheckMiddleWare = async (req, res, next) =>{
    const {domain_name} = req.body;
    if(!domain_name){
        return res.status(400).json(createResponse("Domain name is required.", "error", 400));
    }
    const website = await Website.findOne({domain_name});
    if(!website){
        return res.status(404).json(createResponse("Website not found.", "error", 404));
    }
    req.website = {
        id: website._id,
    };
    next();
}


router.post("/" , websiteCheckMiddleWare, TicketController.createTicket);

router.delete("/" , TicketController.deleteTicket);

router.get("/" , TicketController.getAllTicketForOnePerson);

router.put("/" , TicketController.updateTicket);

router.get("/id" , TicketController.getOneTicket);

router.post("/comment" , TicketController.addComment);

module.exports = router;