const { check, param } = require("express-validator");
const { handleValidationErrors } = require("../../middlewares/handleValidation");
const Ticket = require("../../models/Ticket");
const createResponse = require("../../utils/createResponse");


exports.getAllTicketForWebsite = [
    // Controller logic
    async (req, res) => {
        const websiteId = req.website.id
        try {
            const tickets = await Ticket.find({ website_id: websiteId });
            return res.status(200).json(createResponse("Tickets fetched successfully.", "success", 200, { data: { tickets } }));
        } catch (error) {
            return res.status(500).json(createResponse(error.message, "error", 500));
        }
    }
]