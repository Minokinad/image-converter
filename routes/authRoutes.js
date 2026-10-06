const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const authMiddleware = require("../middlewares/auth");
const { isAdmin } = require("../middlewares/role");

router.post("/register", authController.register);
router.post("/login", authController.login);

router.get("/profile", authMiddleware, authController.getProfile);

router.get("/admin/users", authMiddleware, isAdmin, authController.getAllUsers);

module.exports = router;
