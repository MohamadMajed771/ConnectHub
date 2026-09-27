const express = require("express");

const userController = require("../controllers/userController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.get(
    "/search",
    authMiddleware,
    userController.searchUsers
);

router.get(
    "/:id",
    authMiddleware,
    userController.getUserById
);

module.exports = router;