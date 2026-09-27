const express = require("express");

const messageController = require(
    "../controllers/messageController"
);

const authMiddleware = require(
    "../middleware/authMiddleware"
);

const router = express.Router();

router.use(authMiddleware);

router.post(
    "/:conversationId",
    messageController.sendMessage
);

router.get(
    "/:conversationId",
    messageController.getMessages
);

module.exports = router;