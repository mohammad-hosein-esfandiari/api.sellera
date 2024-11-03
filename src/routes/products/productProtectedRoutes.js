const express = require("express");
const ProductProtectedController = require("../../controllers/Products/productProtected");
const { hasPermissions } = require("../../middlewares/hasPermissions");
const router = express.Router();

router.post(
  "/add",
  hasPermissions(["product"]),
  ProductProtectedController.addProduct
);

router.delete(
  "/delete/:slug",
  hasPermissions(["product"]),
  ProductProtectedController.deleteProduct
);

router.patch(
  "/:slug/title",
  hasPermissions(["product"]),
  ProductProtectedController.updateProductTitle
);

router.patch(
  "/:slug/category",
  hasPermissions(["product"]),
  ProductProtectedController.updateProductCategory
);

router.patch(
  "/:slug/price",
  hasPermissions(["product"]),
  ProductProtectedController.updateProductPrice
);

router.patch(
  "/:slug/status",
  hasPermissions(["product"]),
  ProductProtectedController.toggleProductStatus
);

router.post(
  "/:slug/image",
  hasPermissions(["product"]),
  ProductProtectedController.addBanner
);
router.delete(
  "/:slug/image",
  hasPermissions(["product"]),
  ProductProtectedController.deleteBannerById
);
router.put(
  "/:slug/image",
  hasPermissions(["product"]),
  ProductProtectedController.updateBannerById
);
router.put(
  "/:slug/image-order",
  hasPermissions(["product"]),
  ProductProtectedController.updateImageOrder
);

router.patch(
  "/:slug/store",
  hasPermissions(["product"]),
  ProductProtectedController.updateStore
);

router.patch(
  "/:slug/colors",
  hasPermissions(["product"]),
  ProductProtectedController.updateColors
);

router.patch(
  "/:slug/introduction",
  hasPermissions(["product"]),
  ProductProtectedController.updateIntroduction
);

router.post(
  "/:slug/details",
  hasPermissions(["product"]),
  ProductProtectedController.addDetail
);
router.put(
  "/:slug/details/:id",
  hasPermissions(["product"]),
  ProductProtectedController.updateDetail
);
router.delete(
  "/:slug/details/:id",
  hasPermissions(["product"]),
  ProductProtectedController.deleteDetail
);

router.patch(
  "/:slug/seo",
  hasPermissions(["seo"]),
  ProductProtectedController.updateSEO
);

router.put(
  "/:slug/tags",
  hasPermissions(["seo"]),
  ProductProtectedController.updateTags
);

router.post(
  "/:slug/special-offer",
  hasPermissions(["product","seo"]),
  ProductProtectedController.addSpecialOffer
);

router.put(
  "/:slug/special-offer/:offerId",
  hasPermissions(["product","seo"]),
  ProductProtectedController.updateSpecialOffer
);

router.delete(
  "/:slug/special-offer/:offerId",
  hasPermissions(["product","seo"]),
  ProductProtectedController.deleteSpecialOffer
);

router.put(
  "/:slug/shipping",
  hasPermissions(["product"]),
  ProductProtectedController.updateShipping
);

module.exports = router;
