const express = require("express");

const friendController = require("../controllers/friendController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.use(authMiddleware);

router.post(
    "/request/:userId",
    friendController.sendFriendRequest
);

router.get(
    "/requests/received",
    friendController.getReceivedRequests
);

router.get(
    "/requests/sent",
    friendController.getSentRequests
);

router.put(
    "/requests/:requestId/accept",
    friendController.acceptFriendRequest
);

router.put(
    "/requests/:requestId/decline",
    friendController.declineFriendRequest
);

router.get(
    "/",
    friendController.getFriends
);

router.delete(
    "/:friendId",
    friendController.removeFriend
);

module.exports = router;