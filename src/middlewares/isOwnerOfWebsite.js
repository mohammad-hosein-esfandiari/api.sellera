const { Website } = require("../models/Website");
const createResponse = require("../utils/createResponse");

const isOwnerOfWebsite = async (req,res,next)=>{
    const sellerId = req.user.id;
    const domain_name = req.body.domain_name
    try { 
    // Check if the seller is associated with a website (match seller_id with the website)
    const website = await Website.findOne({ domain_name , seller_id: sellerId });
    if (!website) {
      return res.status(404).send(createResponse('No website associated with this seller account.', 'error', 404));
    }
    next()
    } catch (error) {
        return res.status(500).send(createResponse('Failed on server.', 'error', 500));
        
    }
}

module.exports = isOwnerOfWebsite