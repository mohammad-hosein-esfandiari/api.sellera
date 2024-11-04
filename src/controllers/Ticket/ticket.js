const { check } = require("express-validator");
const { handleValidationErrors } = require("../../middlewares/handleValidation");
const Ticket = require("../../models/Ticket");
const createResponse = require("../../utils/createResponse");


exports.createTicket = [
    // Validations
    check('title').notEmpty().withMessage('Title is required.').trim(),
    check('description').notEmpty().withMessage('Description is required.').trim(),
    check('category').optional().isIn(['technical', 'financial', 'general', 'other']).withMessage('Invalid category value.'),

    handleValidationErrors,
    // Controller logic
    async (req, res) => {

        try {
            const { title, description, category} = req.body;
            const createdBy = req.user.id;

            const ticket = new Ticket({
                title,
                description,
                category,
                createdBy,
            });

            await ticket.save();
            return res.status(201).json(createResponse("Ticket created successfully.", "success", 201, {data :{ ticket }}));
        } catch (error) {
            return res.status(500).json(createResponse(error.message, "error", 500));
        }
    }
];


exports.deleteTicket = [
    // Validations
    check('id').isMongoId().withMessage('Invalid ticket id.'),
    handleValidationErrors,
    // Controller logic
    async (req, res) => {
        const { id } = req.body;
        try {
            const ticket = await Ticket.findByIdAndDelete(id);
            if (!ticket) {
                return res.status(404).json(createResponse("Ticket not found.", "error", 404));
            }
            return res.status(200).json(createResponse("Ticket deleted successfully.", "success", 200));
        } catch (error) {
            return res.status(500).json(createResponse(error.message, "error", 500));
        }
    }
]


exports.getAllTicketForOnePerson = [

    async (req, res) => {
        try {
            const tickets = await Ticket.find({ createdBy: req.user.id });
            if (!tickets) {
                return res.status(404).json(createResponse("Tickets not found.", "error", 404));
            }
            return res.status(200).json(createResponse("Tickets fetched successfully.", "success", 200, { data: { tickets } }));
        } catch (error) {
            return res.status(500).json(createResponse(error.message, "error", 500));
        }
    }
]


exports.updateTicket = [
    // Validations
    check('id').notEmpty().withMessage('Id is required.').isMongoId().withMessage('Invalid ticket id.'),
    check('title').notEmpty().withMessage('Title is required.').isString().withMessage('Invalid title.'),
    check('description').notEmpty().withMessage('Description is required.').isString().withMessage('Invalid description.'),
    check('category').optional().isIn(['technical', 'financial', 'general', 'other']).withMessage('Invalid category value.'),

    handleValidationErrors,
    // Controller logic
    async (req, res) => {
        const { id, title , description } = req.body;
        try {
            const ticket = await Ticket.findByIdAndUpdate(id, { title , description }, { new: true });
            if (!ticket) {
                return res.status(404).json(createResponse("Ticket not found.", "error", 404));
            }
            return res.status(200).json(createResponse("Ticket updated successfully.", "success", 200, { data: { ticket } }));
        } catch (error) {
            return res.status(500).json(createResponse(error.message, "error", 500));
        }
    }
]

