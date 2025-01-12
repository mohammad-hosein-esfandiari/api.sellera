const { check, param } = require("express-validator");
const { handleValidationErrors } = require("../../middlewares/handleValidation");
const Ticket = require("../../models/Ticket");
const createResponse = require("../../utils/createResponse");
const { Website } = require("../../models/Website");

const checkAssignmentMiddleWare = async (req, res, next) =>{

    const {id} = req.body;
    const userId = req.user.id;
    const ticket = await Ticket.findOne({_id:id , website_id: req.website.id});

    if (!ticket) {
        return res.status(404).json(createResponse("Ticket not found.", "error", 404));
    }

    if(ticket.assignedTo.toString() !== userId) {
        return res.status(400).json(createResponse("You cannot comment on the ticket that its not assigned to you.", "error", 400));
    }

    next();
}


exports.getAllTicketForWebsite = [
    // Controller logic
    async (req, res) => {
        const websiteId = req.website.id
        try {
            const tickets = await Ticket.find({ website_id: websiteId }).populate('createdBy', 'username profile_image -_id').populate('website_id', 'logo_image domain_name');
            return res.status(200).json(createResponse("Tickets fetched successfully.", "success", 200, { data: { tickets } }));
        } catch (error) {
            return res.status(500).json(createResponse(error.message, "error", 500));
        }
    }
]

exports.addCommentToTicket = [
    check('id').notEmpty().withMessage('Ticket ID is required.').isMongoId().withMessage('Invalid ticket ID.'),
    check('content').notEmpty().withMessage('Comment content is required.').trim(),

    handleValidationErrors,
    checkAssignmentMiddleWare,
    async (req, res) => {
   

        try {
            const { content , id} = req.body;
            const userId = req.user.id;

            const ticket = await Ticket.findOne({_id:id , website_id: req.website.id});

            if (!ticket) {
                return res.status(404).json(createResponse("Ticket not found.", "error", 404));
            }
            if(ticket.status == "closed"){
                return res.status(400).json(createResponse("Ticket is already closed.", "error", 400));
            }

            if(ticket.comments[ticket.comments.length - 1] && ticket.comments[ticket.comments.length - 1].isSupportAnswered){
                return res.status(400).json(createResponse("Please wait for user to answer your comment.", "error", 400));

            }
            

            const comment = { user: userId, content , createdAt: new Date() , isSupportAnswered:true};
            ticket.comments.push(comment);
            await ticket.save();

            return res.status(200).json(createResponse("Comment added successfully.", "success", 200, {data:{ comment }}));
        } catch (error) {
            return res.status(500).json(createResponse(error.message, "error", 500));
        }
    }
];


exports.assignTicket = [
    check('id').notEmpty().withMessage('Ticket ID is required.').isMongoId().
    withMessage('Invalid ticket ID.'),
    check('username').notEmpty().withMessage('Username is required.').isString().withMessage('Invalid username.'),

    handleValidationErrors,
    async (req, res) => {
        try {
            const { id, username } = req.body;
            const ticket = await Ticket.findOne({_id:id , website_id: req.website.id});

            if (!ticket) {
                return res.status(404).json(createResponse("Ticket not found.", "error", 404));
            }
                  if(ticket.status == "closed"){
                return res.status(400).json(createResponse("Ticket is already closed.", "error", 400));
            }

            if(ticket.assignedTo && ticket.assignedTo == req.user.id) {
                return res.status(400).json(createResponse("Ticket already assigned to you.", "error", 400));
            }

            if(ticket.assignedTo && ticket.assignedTo != req.user.id) {
                return res.status(400).json(createResponse("Ticket already assigned to someone else.", "error", 400));
            }

            const supports = await Website.findOne({
                _id: req.website.id
            }).select('supports_id seller_id').populate('supports_id.user_id', 'username');

            if(req.user.id === supports.seller_id){

                ticket.assignedTo = supports._id;
                await ticket.save();
                return res.status(200).json(createResponse("Ticket assigned successfully.", "success", 200));

            }

            const supportUser = supports.supports_id.find((support) => support.user_id.username === username)

            if (!supportUser) {
                return res.status(404).json(createResponse("User not found.", "error", 404));
            }


            const permission = supportUser.permissions
            if(permission.length  && !permission.includes('comment') || permission.includes('order') || permission.includes('admin')){
                
                return res.status(400).json(createResponse("User does not have permission to assign ticket.", "error", 400));
                
            }

            ticket.assignedTo = supportUser.user_id._id;
            await ticket.save();
            return res.status(200).json(createResponse("Ticket assigned successfully.", "success", 200));
        } catch (error) {
            return res.status(500).json(createResponse(error.message, "error", 500));
        }
            }
]


exports.changeCategory = [
    check('id').notEmpty().withMessage('Ticket ID is required.').isMongoId().
    withMessage('Invalid ticket ID.'),
    check('category').notEmpty().withMessage('Category is required.').isIn(['technical', 'financial', 'general', 'other']).withMessage('Invalid category value.'),
    handleValidationErrors,
    checkAssignmentMiddleWare,
    async (req, res) => {
        try {
            const { id, category } = req.body;
            const ticket = await Ticket.findOne({_id:id , website_id: req.website.id});

            if (!ticket) {
                return res.status(404).json(createResponse("Ticket not found.", "error", 404));
            }
            if(ticket.status == "closed"){
                return res.status(400).json(createResponse("Ticket is already closed.", "error", 400));
            }

            ticket.category = category;
            await ticket.save();
            return res.status(200).json(createResponse("Ticket category changed successfully.", "success", 200));
        } catch (error) {
            return res.status(500).json(createResponse(error.message, "error", 500));
        }
    }
]


exports.changeStatus=[
    check('id').notEmpty().withMessage('Ticket ID is required.').isMongoId().
    withMessage('Invalid ticket ID.'),
    check('status').notEmpty().withMessage('Status is required.').isIn(['open', 'closed']).withMessage('Invalid status value.'),
    handleValidationErrors,
    checkAssignmentMiddleWare,
    async (req, res) => {
        try {
            const { id, status } = req.body;
            const ticket = await Ticket.findOne({_id:id , website_id: req.website.id});

            if (!ticket) {
                return res.status(404).json(createResponse("Ticket not found.", "error", 404));
            }
            if(status === "closed"){
                ticket.closedAt = new Date();
            }
            if(status == "open"){
                ticket.closedAt = null;
            }

            ticket.status = status;
            await ticket.save();
            return res.status(200).json(createResponse("Ticket status changed successfully.", "success", 200));
        } catch (error) {
            return res.status(500).json(createResponse(error.message, "error", 500));
        }
    }
]

exports.changePriority = [
    check('id').notEmpty().withMessage('Ticket ID is required.').isMongoId().
    withMessage('Invalid ticket ID.'),
    check('priority').notEmpty().withMessage('Priority is required.').isIn(['low', 'medium', 'high', 'critical']).withMessage('Invalid priority value.'),
    handleValidationErrors,
    checkAssignmentMiddleWare,
    async (req, res) => {
        try {
            const { id, priority } = req.body;
            const ticket = await Ticket.findOne({_id:id , website_id: req.website.id});

            if (!ticket) {
                return res.status(404).json(createResponse("Ticket not found.", "error", 404));
            }
            if(ticket.status == "closed"){
                return res.status(400).json(createResponse("Ticket is already closed.", "error", 400));
            }
        

            ticket.priority = priority;
            await ticket.save();
            return res.status(200).json(createResponse("Ticket priority changed successfully.", "success", 200));
        } catch (error) {
            return res.status(500).json(createResponse(error.message, "error", 500));
        }
    }
]
