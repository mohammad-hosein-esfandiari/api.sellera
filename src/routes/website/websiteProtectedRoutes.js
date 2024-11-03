const express = require("express");
const WebsiteProtectedController = require("../../controllers/Website/controllers/websiteProtected");
const isSeller = require("../../middlewares/isSeller");
const {
  createWebsiteValidation,
} = require("../../controllers/Website/validations/createWebsiteValidation");
const isOwnerOfWebsite = require("../../middlewares/isOwnerOfWebsite");
const { hasPermissions } = require("../../middlewares/hasPermissions");
const checkSubscription = require("../../middlewares/checkSubscription");
const router = express.Router();

router.post(
  "/create",
  isSeller,
  createWebsiteValidation,
  WebsiteProtectedController.createWebsite
);

router.put(
  "/domain-name",
  checkSubscription,
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
  checkSubscription,
  isSeller,
  isOwnerOfWebsite,
  WebsiteProtectedController.requestWebsiteTransfer
);

router.put(
  "/confirm-website-transfer",
  checkSubscription,
  isSeller,
  isOwnerOfWebsite,
  WebsiteProtectedController.confirmWebsiteTransfer
);


router.post(
  "/supports/add-request",
  checkSubscription,
  isSeller,
  isOwnerOfWebsite,
  WebsiteProtectedController.requestAddSupport
);

router.post(
  "/supports/confirm-add",
  checkSubscription,
  isSeller,
  isOwnerOfWebsite,
  WebsiteProtectedController.confirmRequestAddSupport
);

router.post(
  "/supports/add",
  checkSubscription,
  isSeller,
  isOwnerOfWebsite,
  WebsiteProtectedController.addSupport
);

router.delete(
  "/supports/delete",
  checkSubscription,
  isSeller,
  isOwnerOfWebsite,
  WebsiteProtectedController.addSupport
);

router.put(
  "/supports/permissions",
  checkSubscription,
  isSeller,
  isOwnerOfWebsite,
  WebsiteProtectedController.addSupportPermission
);


router.delete(
  "/supports/permissions",
  checkSubscription,
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
  checkSubscription,
  isSeller,
  isOwnerOfWebsite,
  WebsiteProtectedController.deleteUpdateHistory
);


//  admin support api

router.put(
  "/bio",
  checkSubscription,
  hasPermissions(["admin"]),
  WebsiteProtectedController.updateBio
);
router.put(
  "/status",
  checkSubscription,
  hasPermissions(["admin"]),
  WebsiteProtectedController.changeWebsiteStatus
);
router.post(
  "/category",
  checkSubscription,
  hasPermissions(["admin","product"]),
  WebsiteProtectedController.addCategory
);
router.delete(
  "/category",
  checkSubscription,
  hasPermissions(["admin","product"]),
  WebsiteProtectedController.removeCategory
);

router.post(
  "/banner",
  checkSubscription,
  hasPermissions(["admin","product"]),
  WebsiteProtectedController.addBannerWithImage
);

module.exports = router;
