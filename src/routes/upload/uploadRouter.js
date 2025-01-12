const express = require("express");
const router = express.Router();
const UploadController = require('../../controllers/upload/uploadController')

router.post('/image' , UploadController.uploadImage)


module.exports = router;
