// controllers/imageController.js

const path = require("path");
const upload = require("../../configs/uploadConfig");
const createResponse = require("../../utils/createResponse");

// API for uploading images
exports.uploadImage = [
  upload.single("image"), // Middleware for handling single file upload
  async (req, res) => {
    try {
      // Check if the file was uploaded
      if (!req.file) {
        return res
          .status(400)
          .json(createResponse("No image file uploaded.", "error", 400));
      }

      // مسیر پوشه public با استفاده از process.cwd() (مسیر ریشه پروژه)
      const publicDirectory = path.join(process.cwd(), "public", "images");

      // ایجاد لینک تصویر
      const imageUrl =  "public/images/" + req.file.filename;

      
      // Return the image URL as part of the response
      return res.status(200).json(
        createResponse(
          "Image uploaded successfully.",
          "success",
          200,
          { data: { image_URL: imageUrl } } // Return the image URL
        )
      );
    } catch (error) {
      console.error("Error uploading image:", error); // Log the error for debugging
      return res
        .status(500)
        .json(createResponse("Internal server error.", "error", 500));
    }
  },
];
