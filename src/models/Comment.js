const mongoose = require("mongoose");

// Define the schema for replies
const replySchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: [true, 'User ID is required for a reply.'] // Ensure user ID is provided
    },
    content: {
        type: String,
        required: [true, 'Reply content is required.'],
        minlength: [10, 'Reply content must be at least 10 characters long.'],
        maxlength: [500, 'Reply content must be less than 500 characters.'] // Set a maximum length for reply content
    },
    likes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }],
    disLikes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }]
}, { timestamps: true });

// Define the schema for comments
const commentSchema = new mongoose.Schema({
    product_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: [true, 'Product ID is required for a comment.'] // Ensure product ID is provided
    },
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: [true, 'User ID is required for a comment.'] // Ensure user ID is provided
    },
    content: {
        type: String,
        required: [true, 'Comment content is required.'],
        minlength: [1, 'Comment content must be at least 10 characters long.'],
        maxlength: [1000, 'Comment content must be less than 1000 characters.'] // Set a maximum length for comment content
    },
    likes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }],
    replies: [replySchema] // Embedding replySchema inside the comment schema
}, { timestamps: true });

// Add additional validations and logic
commentSchema.pre('save', function(next) {
    if (this.replies.length > 0) {
        // Check if all replies have valid content length
        this.replies.forEach(reply => {
            if (reply.content.length < 1 || reply.content.length > 500) {
                next(new Error('Each reply content must be between 10 and 500 characters long.'));
            }
        });
    }
    next();
});

// Create the Comment model
const Comment = mongoose.model("Comment", commentSchema);

module.exports = { Comment };
