const express = require("express");
const ProductProtectedController = require("../../controllers/Products/productProtected");
const router = express.Router();




router.post("/add", ProductProtectedController.addProduct);

router.patch("/:slug/title", ProductProtectedController.updateProductTitle);

router.patch("/:slug/category", ProductProtectedController.updateProductCategory);

router.patch("/:slug/price", ProductProtectedController.updateProductPrice);

router.patch("/:slug/status", ProductProtectedController.toggleProductStatus);

router.post("/:slug/image", ProductProtectedController.addBanner);
router.delete("/:slug/image", ProductProtectedController.deleteBannerById);
router.put("/:slug/image", ProductProtectedController.updateBannerById);
router.put("/:slug/image-order", ProductProtectedController.updateImageOrder);

router.patch("/:slug/store", ProductProtectedController.updateStore);

router.patch("/:slug/colors", ProductProtectedController.updateColors);

router.patch("/:slug/introduction", ProductProtectedController.updateIntroduction);

router.post("/:slug/details", ProductProtectedController.addDetail);
router.put("/:slug/details/:id", ProductProtectedController.updateDetail);
router.delete("/:slug/details/:id", ProductProtectedController.deleteDetail);














module.exports = router;
