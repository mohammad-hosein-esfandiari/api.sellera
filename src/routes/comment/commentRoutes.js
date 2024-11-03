const express = require("express");
const router = express.Router();
const CommentController = require('../../controllers/Comment/comment');
const authenticateToken = require("../../middlewares/authenticateToken");

router.get("/count",authenticateToken, CommentController.getCommentCountForProduct);
router.get("/",authenticateToken, CommentController.getProductComments);
router.post("/",authenticateToken, CommentController.addComment);
router.delete("/",authenticateToken, CommentController.deleteComment);

router.post("/like",authenticateToken, CommentController.likeComment);
router.get("/like",authenticateToken, CommentController.getCommentLikes);

router.post("/disLike",authenticateToken, CommentController.dislikeComment);
router.get("/disLike",authenticateToken, CommentController.getCommentDislikes);

router.get("/replay",authenticateToken, CommentController.getCommentReplies);
router.post("/replay",authenticateToken, CommentController.addReply);
router.post("/replay/like",authenticateToken, CommentController.likeReply);
router.get("/replay/like",authenticateToken, CommentController.getReplyLikes);
router.post("/replay/dislike",authenticateToken, CommentController.dislikeReply);
router.get("/replay/dislike",authenticateToken, CommentController.getReplyDislikes);































module.exports = router;