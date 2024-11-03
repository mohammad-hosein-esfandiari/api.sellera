// Controller to add a new comment

const { param, check } = require("express-validator");
const { handleValidationErrors } = require("../../middlewares/handleValidation");
const { Product } = require("../../models/Product");
const createResponse = require("../../utils/createResponse");
const { Comment } = require("../../models/Comment");

exports.getCommentCountForProduct = [
    // Validate that `slug` exists in the request parameters
    check('slug')
        .notEmpty()
        .withMessage('Slug is required in body.'),
    
    // Handle validation errors using middleware
    handleValidationErrors,

    async (req, res) => {
        const { slug } = req.body;

        try {
            // Count the comments for the product using the product_slug
            const commentCount = await Comment.countDocuments({ product_slug: slug });

            return res.status(200).json(createResponse("Comment count retrieved successfully.", "success", 200, { data: { count: commentCount } }));
        } catch (error) {
            return res.status(500).json(createResponse(error.message, "error", 500));
        }
    }
];


exports.getProductComments = [
    // Validate that `slug` exists in the request parameters
    check('slug')
        .notEmpty()
        .withMessage('Slug is required in body.'),
        
    // Handle validation errors using middleware
    handleValidationErrors,

    async (req, res) => {
        const { slug } = req.body; 

        try {
            // Find comments for the product using the product_slug
            const comments = await Comment.find({ product_slug: slug })
            .populate('user_info', 'username profile_image') // Populate user info for each comment
            if (comments.length === 0) {
                return res.status(404).json(createResponse("No comments found for this product.", "error", 404));
            }

                    // Create a new array with formatted comment data
                    const formattedComments = comments.map(comment => ({
                        id: comment._id,
                        product_slug: comment.product_slug,
                        user_info: {
                            username: comment.user_info.username,
                            profile_image: comment.user_info.profile_image,
                        },
                        content: comment.content,
                        likesCount: comment.likes.length, // تعداد لایک‌ها
                        disLikesCount: comment.disLikes.length, // تعداد دیسلایک‌ها
                        repliesCount: comment.replies.length, // تعداد ریپلی‌ها
                        createdAt: comment.createdAt,
                    }));

            return res.status(200).json(createResponse("Comments retrieved successfully.", "success", 200, { data: { comments:formattedComments,count:comments.length } }));
        } catch (error) {
            return res.status(500).json(createResponse(error.message, "error", 500));
        }
    }
];


exports.addComment = [
    // Validate that `slug` exists in the request parameters
    check('slug')
        .notEmpty()
        .withMessage('Slug is required in body.'),

    // Validate that the `content` exists in the request body
    check('content')
        .notEmpty()
        .withMessage('Comment content is body.')
        .isLength({ min: 1, max: 1000 })
        .withMessage('Comment content must be between 10 and 1000 characters long.'),

    // Handle validation errors using middleware
    handleValidationErrors,

    async (req, res) => {
        const {  slug,content } = req.body;
        const userId = req.user.id;

        try {
            // Find the product using slug and website_name
            const product = await Product.findOne({ slug});
            if (!product) {
                return res.status(404).json(createResponse("Product not found.", "error", 404));
            }

            // Create a new comment instance
            const newComment = new Comment({
                product_slug: slug,
                user_info: userId,
                content: content
            });

            // Save the comment
            await newComment.save();
            
            const commentObject = {
                id: newComment._id,
                content: newComment.content,
                user_info: newComment.user_info,
                created_at: newComment.createdAt,
                likes: newComment.likes.length,
                dislikes: newComment.disLikes.length,
                replies: newComment.replies,

            }

            return res.status(201).json(createResponse("Comment added successfully.", "success", 201, {data:{ comment: commentObject }}));
        } catch (error) {
            return res.status(500).json(createResponse("Internal server error.", "error", 500));
        }
    }
];



exports.deleteComment = [
        // Validate that `slug` exists in the request parameters
        check('slug')
        .notEmpty()
        .withMessage('Slug is required in body.'),
    // Validate that `commentId` exists in the request body
    check('commentId')
        .notEmpty()
        .withMessage('Comment ID is required in body.'),

    // Handle validation errors using middleware
    handleValidationErrors,

    async (req, res) => {
        const { commentId ,slug} = req.body;
        const userId = req.user.id;

        try {
            const product = await Product.findOne({ slug});
            if (!product) {
                return res.status(404).json(createResponse("Product not found.", "error", 404));
            }
            // Find the comment by ID
            const comment = await Comment.findOne({ _id: commentId.toString() , product_slug:slug});
            if (!comment) {
                return res.status(404).json(createResponse("Comment not found.", "error", 404));
            }

            // Check if the user is the owner of the comment
            if (comment.user_info.toString() !== userId) {
                return res.status(403).json(createResponse("You are not authorized to delete this comment.", "error", 403));
            }

            // Delete the comment
            await Comment.findByIdAndDelete(commentId);

            return res.status(200).json(createResponse("Comment deleted successfully.", "success", 200));
        } catch (error) {
            return res.status(500).json(createResponse("Internal server error.", "error", 500));
        }
    }
];


exports.likeComment = [
        // Validate that `slug` exists in the request parameters
        check('slug')
        .notEmpty()
        .withMessage('Slug is required in body.'),
    // Validate that `commentId` exists in the request parameters
    check('commentId')
        .notEmpty()
        .withMessage('id is required in parameters.'),

    // Handle validation errors using middleware
    handleValidationErrors,

    async (req, res) => {
        const {slug ,commentId } = req.body;
        const userId = req.user.id;

        try {
            const product = await Product.findOne({ slug});
            if (!product) {
                return res.status(404).json(createResponse("Product not found.", "error", 404));
            }
            // Find the comment using commentId
            const comment = await Comment.findOne({_id:commentId.toString() , product_slug: slug});
            if (!comment) {
                return res.status(404).json(createResponse("Comment not found.", "error", 404));
            }

            // Check if the user has already liked this comment
            const alreadyLiked = comment.likes.includes(userId);
            const alreadyDisliked = comment.disLikes.includes(userId);

            if (alreadyLiked) {
                // If already liked, remove the like
                comment.likes = comment.likes.filter(like => like.toString() !== userId);
                await comment.save();
                return res.status(200).json(createResponse("Like removed successfully.", "success", 200));
            } else {
                // If not liked yet, add the like
                comment.likes.push(userId);
                // If the user has disliked the comment, remove the dislike
                if (alreadyDisliked) {
                    comment.disLikes = comment.disLikes.filter(disLike => disLike.toString() !== userId);
                }
                await comment.save();
                return res.status(200).json(createResponse("Comment liked successfully.", "success", 200));
            }
        } catch (error) {
            return res.status(500).json(createResponse("Internal server error.", "error", 500));
        }
    }
];


exports.getCommentLikes = [
    // Validate that `slug` exists in the request parameters
    check('slug')
        .notEmpty()
        .withMessage('Slug is required in body.'),
    // Validate that `commentId` exists in the request parameters
    check('commentId')
        .notEmpty()
        .withMessage('Comment ID is required in parameters.'),

    // Handle validation errors using middleware
    handleValidationErrors,

    async (req, res) => {
        const { commentId ,slug } = req.body;

        try {
            // Find the comment by ID
            const comment = await Comment.findOne({ _id: commentId.toString() , product_slug: slug}).populate('likes','username profile_image');

            if (!comment) {
                return res.status(404).json(createResponse("Comment not found.", "error", 404));
            }
                // Create a new array with only username and profile_image
                const likesData = comment.likes.map(user => ({
                    username: user.username,
                    profile_image: user.profile_image
                }));
    
            

            return res.status(200).json(createResponse("Likes retrieved successfully.", "success", 200, { data: { likes: likesData , count: comment.likes.length} }));
        } catch (error) {
            return res.status(500).json(createResponse(error.message, "error", 500));
        }
    }
];


exports.dislikeComment = [
    // Validate that `slug` exists in the request parameters
    check('slug')
        .notEmpty()
        .withMessage('Slug is required in body.'),
    
    // Validate that `commentId` exists in the request parameters
    check('commentId')
        .notEmpty()
        .withMessage('Comment ID is required in parameters.'),

    // Handle validation errors using middleware
    handleValidationErrors,

    async (req, res) => {
        const { slug, commentId } = req.body;
        const userId = req.user.id;

        try {
            const product = await Product.findOne({ slug });
            if (!product) {
                return res.status(404).json(createResponse("Product not found.", "error", 404));
            }

            // Find the comment using commentId
            const comment = await Comment.findOne({ _id: commentId.toString(), product_slug: slug });
            if (!comment) {
                return res.status(404).json(createResponse("Comment not found.", "error", 404));
            }

            // Check if the user has already disliked this comment
            const alreadyDisliked = comment.disLikes.includes(userId);
            const alreadyLiked = comment.likes.includes(userId);

            if (alreadyDisliked) {
                // If already disliked, remove the dislike
                comment.disLikes = comment.disLikes.filter(disLike => disLike.toString() !== userId);
                await comment.save();
                return res.status(200).json(createResponse("Dislike removed successfully.", "success", 200));
            } else {
                // If not disliked yet, add the dislike
                comment.disLikes.push(userId);
                // If the user has liked the comment, remove the like
                if (alreadyLiked) {
                    comment.likes = comment.likes.filter(like => like.toString() !== userId);
                }
                await comment.save();
                return res.status(200).json(createResponse("Comment disliked successfully.", "success", 200));
            }
        } catch (error) {
            return res.status(500).json(createResponse("Internal server error.", "error", 500));
        }
    }
];


exports.getCommentDislikes = [
    // Validate that `slug` exists in the request parameters
    check('slug')
        .notEmpty()
        .withMessage('Slug is required in body.'),
    // Validate that `commentId` exists in the request parameters
    check('commentId')
        .notEmpty()
        .withMessage('Comment ID is required in parameters.'),

    // Handle validation errors using middleware
    handleValidationErrors,

    async (req, res) => {
        const { commentId, slug } = req.body;

        try {
            // Find the comment by ID
            const comment = await Comment.findOne({ _id: commentId.toString(), product_slug: slug }).populate('disLikes', 'username profile_image');

            if (!comment) {
                return res.status(404).json(createResponse("Comment not found.", "error", 404));
            }

            // Create a new array with only username and profile_image for dislikes
            const dislikesData = comment.disLikes.map(user => ({
                username: user.username,
                profile_image: user.profile_image
            }));

            return res.status(200).json(createResponse("Dislikes retrieved successfully.", "success", 200, { data: { dislikes: dislikesData , count: comment.disLikes.length } }));
        } catch (error) {
            return res.status(500).json(createResponse(error.message, "error", 500));
        }
    }
];



exports.getCommentReplies = [
    // Validate that `slug` exists in the request parameters
    check('slug')
        .notEmpty()
        .withMessage('Slug is required in body.'),
    // Validate that `commentId` exists in the request parameters
    check('commentId')
        .notEmpty()
        .withMessage('Comment ID is required in body.'),
        
    // Handle validation errors using middleware
    handleValidationErrors,

    async (req, res) => {
        const { commentId , slug } = req.body; // دریافت commentId از بدنه درخواست

        try {
            // Find the comment by ID and populate replies
            const comment = await Comment.findOne({ _id: commentId , product_slug:slug})
                .populate('replies.user_id', 'username profile_image') // Populate user info for replies

            if (!comment) {
                return res.status(404).json(createResponse("Comment not found.", "error", 404));
            }

            // Create a new array with formatted reply data
            const formattedReplies = comment.replies.map(reply => ({
                id: reply._id,
                user_info: {
                    username: reply.user_id.username,
                    profile_image: reply.user_id.profile_image,
                },
                content: reply.content,
                likesCount: reply.likes.length, // تعداد لایک‌ها
                disLikesCount: reply.disLikes.length, // تعداد دیسلایک‌ها
                createdAt: reply.createdAt,
            }));

            return res.status(200).json(createResponse("Replies retrieved successfully.", "success", 200, { data: { replies: formattedReplies , count: comment.replies.length} }));
        } catch (error) {
            return res.status(500).json(createResponse(error.message, "error", 500));
        }
    }
];

exports.addReply = [
    // Validate that `slug` exists in the request body
    check('slug')
        .notEmpty()
        .withMessage('Slug is required in body.'),
        
    // Validate that `commentId` exists in the request body
    check('commentId')
        .notEmpty()
        .withMessage('Comment ID is required in body.'),
        
    // Validate that `content` exists in the request body
    check('content')
        .notEmpty()
        .withMessage('Reply content is required.')
        .isLength({ min: 1, max: 500 })
        .withMessage('Reply content must be between 1 and 500 characters long.'),

    // Handle validation errors using middleware
    handleValidationErrors,

    async (req, res) => {
        const { content, commentId, slug } = req.body; // Get content, commentId, and slug from request body
        const userId = req.user.id; // Get user ID from request

        try {
            // Find the comment to which the reply is being made
            const comment = await Comment.findOne({ _id: commentId.toString(), product_slug: slug });
            if (!comment) {
                return res.status(404).json(createResponse("Comment not found.", "error", 404));
            }

            // Create a new reply object
            const newReply = {
                user_id: userId,
                content: content,
                likes: [],
                disLikes: []
            };

            // Push the new reply to the comment's replies array
            comment.replies.push(newReply);
           
            await comment.save(); // Save the updated comment

            const newObject = {
                user_id:userId,
                content:content,
                likes: newReply.likes.length,
                disLikes: newReply.disLikes.length
            }

            return res.status(201).json(createResponse("Reply added successfully.", "success", 201, { data: { reply: newObject } }));
        } catch (error) {
            return res.status(500).json(createResponse(error.message, "error", 500));
        }
    }
];




exports.likeReply = [
    // Validate that `slug` exists in the request parameters
    check('slug')
        .notEmpty()
        .withMessage('Slug is required in body.'),
        
    // Validate that `commentId` exists in the request parameters
    check('commentId')
        .notEmpty()
        .withMessage('Comment ID is required in body.'),
        
    // Validate that `replyId` exists in the request parameters
    check('replyId')
        .notEmpty()
        .withMessage('Reply ID is required in body.'),

    // Handle validation errors using middleware
    handleValidationErrors,

    async (req, res) => {
        const { slug, commentId, replyId } = req.body;
        const userId = req.user.id;

        try {
            // Find the comment containing the reply
            const comment = await Comment.findOne({ _id: commentId, product_slug: slug });
            if (!comment) {
                return res.status(404).json(createResponse("Comment not found.", "error", 404));
            }

            // Find the reply by ID
            const reply = comment.replies.id(replyId);
            if (!reply) {
                return res.status(404).json(createResponse("Reply not found.", "error", 404));
            }

            // Check if the user has already liked this reply
            const alreadyLiked = reply.likes.includes(userId);
            const alreadyDisliked = reply.disLikes.includes(userId);

            if (alreadyLiked) {
                // If already liked, remove the like
                reply.likes = reply.likes.filter(like => like.toString() !== userId);
                await comment.save();
                return res.status(200).json(createResponse("Like removed successfully.", "success", 200));
            } else {
                // If not liked yet, add the like
                reply.likes.push(userId);
                // If the user has disliked the reply, remove the dislike
                if (alreadyDisliked) {
                    reply.disLikes = reply.disLikes.filter(dislike => dislike.toString() !== userId);
                }
                await comment.save();
                return res.status(200).json(createResponse("Reply liked successfully.", "success", 200));
            }
        } catch (error) {
            return res.status(500).json(createResponse("Internal server error.", "error", 500));
        }
    }
];


exports.dislikeReply = [
    // Validate that `slug` exists in the request parameters
    check('slug')
        .notEmpty()
        .withMessage('Slug is required in body.'),
        
    // Validate that `commentId` exists in the request parameters
    check('commentId')
        .notEmpty()
        .withMessage('Comment ID is required in body.'),
        
    // Validate that `replyId` exists in the request parameters
    check('replyId')
        .notEmpty()
        .withMessage('Reply ID is required in body.'),

    // Handle validation errors using middleware
    handleValidationErrors,

    async (req, res) => {
        const { slug, commentId, replyId } = req.body;
        const userId = req.user.id;

        try {
            // Find the comment containing the reply
            const comment = await Comment.findOne({ _id: commentId, product_slug: slug });
            if (!comment) {
                return res.status(404).json(createResponse("Comment not found.", "error", 404));
            }

            // Find the reply by ID
            const reply = comment.replies.id(replyId);
            if (!reply) {
                return res.status(404).json(createResponse("Reply not found.", "error", 404));
            }

            // Check if the user has already disliked this reply
            const alreadyDisliked = reply.disLikes.includes(userId);
            const alreadyLiked = reply.likes.includes(userId);

            if (alreadyDisliked) {
                // If already disliked, remove the dislike
                reply.disLikes = reply.disLikes.filter(dislike => dislike.toString() !== userId);
                await comment.save();
                return res.status(200).json(createResponse("Dislike removed successfully.", "success", 200));
            } else {
                // If not disliked yet, add the dislike
                reply.disLikes.push(userId);
                // If the user has liked the reply, remove the like
                if (alreadyLiked) {
                    reply.likes = reply.likes.filter(like => like.toString() !== userId);
                }
                await comment.save();
                return res.status(200).json(createResponse("Reply disliked successfully.", "success", 200));
            }
        } catch (error) {
            return res.status(500).json(createResponse("Internal server error.", "error", 500));
        }
    }
];


exports.getReplyLikes = [
    // Validate that `slug` exists in the request parameters
    check('slug')
        .notEmpty()
        .withMessage('Slug is required in body.'),
        
    // Validate that `commentId` exists in the request parameters
    check('commentId')
        .notEmpty()
        .withMessage('Comment ID is required in parameters.'),
        
    // Validate that `replyId` exists in the request parameters
    check('replyId')
        .notEmpty()
        .withMessage('Reply ID is required in parameters.'),
        
    // Handle validation errors using middleware
    handleValidationErrors,

    async (req, res) => {
        const { commentId, slug, replyId } = req.body;

        try {
            // Find the comment by ID and check for the reply
            const comment = await Comment.findOne(
                { _id: commentId.toString(), product_slug: slug },
                { replies: { $elemMatch: { _id: replyId } } }
            ).populate('replies.likes', 'username profile_image');

            if (!comment || !comment.replies.length) {
                return res.status(404).json(createResponse("Reply not found.", "error", 404));
            }

            // Extract the likes from the specific reply
            const reply = comment.replies[0]; // Assuming we found the reply in the array
            const likesData = reply.likes.map(user => ({
                username: user.username,
                profile_image: user.profile_image
            }));

            return res.status(200).json(createResponse("Likes retrieved successfully.", "success", 200, { data: { likes: likesData , count: reply.likes.length } }));
        } catch (error) {
            return res.status(500).json(createResponse(error.message, "error", 500));
        }
    }
];


exports.getReplyDislikes = [
    // Validate that `slug` exists in the request parameters
    check('slug')
        .notEmpty()
        .withMessage('Slug is required in body.'),
        
    // Validate that `commentId` exists in the request parameters
    check('commentId')
        .notEmpty()
        .withMessage('Comment ID is required in parameters.'),
        
    // Validate that `replyId` exists in the request parameters
    check('replyId')
        .notEmpty()
        .withMessage('Reply ID is required in parameters.'),
        
    // Handle validation errors using middleware
    handleValidationErrors,

    async (req, res) => {
        const { commentId, slug, replyId } = req.body;

        try {
            // Find the comment by ID and check for the reply
            const comment = await Comment.findOne(
                { _id: commentId.toString(), product_slug: slug },
                { replies: { $elemMatch: { _id: replyId } } }
            ).populate('replies.disLikes', 'username profile_image');

            if (!comment || !comment.replies.length) {
                return res.status(404).json(createResponse("Reply not found.", "error", 404));
            }

            // Extract the dislikes from the specific reply
            const reply = comment.replies[0]; // Assuming we found the reply in the array
            const disLikesData = reply.disLikes.map(user => ({
                username: user.username,
                profile_image: user.profile_image
            }));

            return res.status(200).json(createResponse("Dislikes retrieved successfully.", "success", 200, { data: { dislikes: disLikesData , count : reply.disLikes.length } }));
        } catch (error) {
            return res.status(500).json(createResponse(error.message, "error", 500));
        }
    }
];

