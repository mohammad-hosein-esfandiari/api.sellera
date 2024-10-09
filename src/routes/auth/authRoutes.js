const express = require("express");
const router = express.Router();
const createUser = require("../../controllers/UserController/createUser");
const userController = require("../../controllers/UserController/user");
const { login } = require("../../controllers/UserController/login");
const logout = require("../../controllers/UserController/logout");
const authenticateToken = require("../../middlewares/authenticateToken");
const deleteAccountController = require("../../controllers/UserController/deleteAccount");

// Route to create a new user
router.post("/register", createUser);

// Route for user logout
router.post("/logout", logout);

// Route for user login
router.post("/login", login);

// Route to request a deletion code for account deletion (protected)
router.post(
  "/request-code-delete-account",
  authenticateToken,
  deleteAccountController.requestAccountDeletion
);

// Route to delete the user account (protected)
router.delete(
  "/delete-account",
  authenticateToken,
  deleteAccountController.deleteAccount
);




module.exports = router;
