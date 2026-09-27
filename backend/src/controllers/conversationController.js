const conversationService = require(
    "../services/conversationService"
);

const createPrivateConversation = async (req, res) => {
    try {
        const friendId = Number(req.params.friendId);

        const result =
            await conversationService.createPrivateConversation(
                req.user.id,
                friendId
            );

        res.status(
            result.alreadyExists ? 200 : 201
        ).json({
            message: result.alreadyExists
                ? "Conversation already exists"
                : "Conversation created successfully",
            conversationId: result.conversationId
        });
    } catch (error) {
        res.status(400).json({
            message: error.message
        });
    }
};

const getMyConversations = async (req, res) => {
    try {
        const conversations =
            await conversationService.getMyConversations(
                req.user.id
            );

        res.status(200).json({
            conversations
        });
    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};

const getConversationById = async (req, res) => {
    try {
        const conversation =
            await conversationService.getConversationById(
                Number(req.params.id),
                req.user.id
            );

        res.status(200).json({
            conversation
        });
    } catch (error) {
        res.status(403).json({
            message: error.message
        });
    }
};

module.exports = {
    createPrivateConversation,
    getMyConversations,
    getConversationById
};