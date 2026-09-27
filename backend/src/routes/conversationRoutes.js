const express = require("express");

const conversationController = require(
    "../controllers/conversationController"
);

const authMiddleware = require(
    "../middleware/authMiddleware"
);

const router = express.Router();

router.use(authMiddleware);

router.post(
    "/private/:friendId",
    conversationController.createPrivateConversation
);

router.get(
    "/",
    conversationController.getMyConversations
);

router.get(
    "/:id",
    conversationController.getConversationById
);

module.exports = router;