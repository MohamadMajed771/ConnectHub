const friendService = require("../services/friendService");

const sendFriendRequest = async (req, res) => {
    try {
        const result = await friendService.sendFriendRequest(
            req.user.id,
            Number(req.params.userId)
        );

        res.status(201).json({
            message: "Friend request sent successfully",
            request: result
        });
    } catch (error) {
        res.status(400).json({
            message: error.message
        });
    }
};

const getReceivedRequests = async (req, res) => {
    try {
        const requests =
            await friendService.getReceivedRequests(
                req.user.id
            );

        res.status(200).json({
            requests
        });
    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};

const getSentRequests = async (req, res) => {
    try {
        const requests =
            await friendService.getSentRequests(
                req.user.id
            );

        res.status(200).json({
            requests
        });
    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};

const acceptFriendRequest = async (req, res) => {
    try {
        const result =
            await friendService.acceptFriendRequest(
                Number(req.params.requestId),
                req.user.id
            );

        res.status(200).json(result);
    } catch (error) {
        res.status(400).json({
            message: error.message
        });
    }
};

const declineFriendRequest = async (req, res) => {
    try {
        const result =
            await friendService.declineFriendRequest(
                Number(req.params.requestId),
                req.user.id
            );

        res.status(200).json(result);
    } catch (error) {
        res.status(400).json({
            message: error.message
        });
    }
};

const getFriends = async (req, res) => {
    try {
        const friends =
            await friendService.getFriends(
                req.user.id
            );

        res.status(200).json({
            friends
        });
    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};

const removeFriend = async (req, res) => {
    try {
        const result =
            await friendService.removeFriend(
                req.user.id,
                Number(req.params.friendId)
            );

        res.status(200).json(result);
    } catch (error) {
        res.status(400).json({
            message: error.message
        });
    }
};

module.exports = {
    sendFriendRequest,
    getReceivedRequests,
    getSentRequests,
    acceptFriendRequest,
    declineFriendRequest,
    getFriends,
    removeFriend
};