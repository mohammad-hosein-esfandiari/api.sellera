const express = require("express");
const WebsiteProtectedController = require("../../controllers/Website/controllers/websiteProtected");
const isSeller = require("../../middlewares/isSeller");
const {
  createWebsiteValidation,
} = require("../../controllers/Website/validations/createWebsiteValidation");
const isOwnerOfWebsite = require("../../middlewares/isOwnerOfWebsite");
const { hasPermissions } = require("../../middlewares/hasPermissions");
const router = express.Router();

router.post(
  "/create",
  isSeller,
  createWebsiteValidation,
  WebsiteProtectedController.createWebsite
);

router.put(
  "/domain-name",
  isSeller,
  isOwnerOfWebsite,
  WebsiteProtectedController.updateDomainName
);

router.post(
  "/request-delete-website",
  isSeller,
  isOwnerOfWebsite,
  WebsiteProtectedController.requestDeleteWebsite
);

router.delete(
  "/delete-website",
  isSeller,
  isOwnerOfWebsite,
  WebsiteProtectedController.confirmDeleteWebsite
);

router.post(
  "/request-website-transfer",
  isSeller,
  isOwnerOfWebsite,
  WebsiteProtectedController.requestWebsiteTransfer
);

router.put(
  "/confirm-website-transfer",
  isSeller,
  isOwnerOfWebsite,
  WebsiteProtectedController.confirmWebsiteTransfer
);


router.post(
  "/supports/add-request",
  isSeller,
  isOwnerOfWebsite,
  WebsiteProtectedController.requestAddSupport
);

router.post(
  "/supports/confirm-add",
  isSeller,
  isOwnerOfWebsite,
  WebsiteProtectedController.confirmRequestAddSupport
);

router.post(
  "/supports/add",
  isSeller,
  isOwnerOfWebsite,
  WebsiteProtectedController.addSupport
);

router.delete(
  "/supports/delete",
  isSeller,
  isOwnerOfWebsite,
  WebsiteProtectedController.addSupport
);

router.put(
  "/supports/permissions",
  isSeller,
  isOwnerOfWebsite,
  WebsiteProtectedController.addSupportPermission
);


router.delete(
  "/supports/permissions",
  isSeller,
  isOwnerOfWebsite,
  WebsiteProtectedController.removeSupportPermission
);

router.get(
  "/supports",
  isSeller,
  isOwnerOfWebsite,
  WebsiteProtectedController.getSupportListWithUserData
);

router.get(
  "/update-history",
  isSeller,
  isOwnerOfWebsite,
  WebsiteProtectedController.getUpdateHistory
);

router.delete(
  "/update-history",
  isSeller,
  isOwnerOfWebsite,
  WebsiteProtectedController.deleteUpdateHistory
);


//  admin support api

router.put(
  "/bio",
  hasPermissions(["admin"]),
  WebsiteProtectedController.updateBio
);
router.put(
  "/status",
  hasPermissions(["admin"]),
  WebsiteProtectedController.changeWebsiteStatus
);
router.post(
  "/category",
  hasPermissions(["admin","product"]),
  WebsiteProtectedController.addCategory
);
router.delete(
  "/category",
  hasPermissions(["admin","product"]),
  WebsiteProtectedController.removeCategory
);

router.post(
  "/banner",
  hasPermissions(["admin","product"]),
  WebsiteProtectedController.addBannerWithImage
);

module.exports = router;
