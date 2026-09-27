const messageService = require(
    "../services/messageService"
);

const sendMessage = async (req, res) => {
    try {
        const conversationId = Number(
            req.params.conversationId
        );

        const { content } = req.body;

        const message =
            await messageService.sendMessage(
                conversationId,
                req.user.id,
                content
            );

        res.status(201).json({
            message: "Message sent successfully",
            data: message
        });
    } catch (error) {
        res.status(400).json({
            message: error.message
        });
    }
};

const getMessages = async (req, res) => {
    try {
        const conversationId = Number(
            req.params.conversationId
        );

        const messages =
            await messageService.getMessages(
                conversationId,
                req.user.id
            );

        res.status(200).json({
            messages
        });
    } catch (error) {
        res.status(403).json({
            message: error.message
        });
    }
};

module.exports = {
    sendMessage,
    getMessages
};