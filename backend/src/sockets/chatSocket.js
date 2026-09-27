const connectedUsers = new Map();
const db = require("../config/db");
const socketAuth = require("./socketAuth");

const registerChatSocket = (io) => {

    // Authenticate every socket connection
    io.use(socketAuth);

    io.on("connection", async (socket) => {

        const userId = socket.user.id;

        if (!connectedUsers.has(userId)) {
            connectedUsers.set(
                userId,
                new Set()
            );
        }

        connectedUsers
            .get(userId)
            .add(socket.id);

        console.log(
            `User ${userId} connected: ${socket.id}`
        );

        /*
        --------------------------------
        PERSONAL USER ROOM
        --------------------------------
        */

        socket.join(`user:${userId}`);

        /*
        --------------------------------
        SET USER ONLINE
        --------------------------------
        */

        await db.query(
            `UPDATE users
             SET is_online = TRUE
             WHERE id = ?`,
            [userId]
        );

        io.emit("user-online", {
            userId
        });

        socket.emit("presence-sync", {
            onlineUserIds: Array.from(connectedUsers.keys())
        });

        /*
        --------------------------------
        JOIN CONVERSATION
        --------------------------------
        */

        socket.on(
            "join-conversation",
            async (conversationId) => {
                try {

                    const [memberships] =
                        await db.query(
                            `SELECT id
                             FROM conversation_members
                             WHERE conversation_id = ?
                             AND user_id = ?`,
                            [
                                conversationId,
                                userId
                            ]
                        );

                    if (
                        memberships.length === 0
                    ) {
                        return socket.emit(
                            "socket-error",
                            {
                                message:
                                    "You are not a member of this conversation"
                            }
                        );
                    }

                    socket.join(
                        `conversation:${conversationId}`
                    );

                    console.log(
                        `User ${userId} joined conversation ${conversationId}`
                    );

                } catch (error) {
                    socket.emit(
                        "socket-error",
                        {
                            message: error.message
                        }
                    );
                }
            }
        );

        /*
        --------------------------------
        LEAVE CONVERSATION
        --------------------------------
        */

        socket.on(
            "leave-conversation",
            (conversationId) => {

                socket.leave(
                    `conversation:${conversationId}`
                );

            }
        );

        socket.on(
            "mark-messages-read",
            async (conversationId) => {
                try {
                    const [memberships] = await db.query(
                        `SELECT id FROM conversation_members
                         WHERE conversation_id = ? AND user_id = ?`,
                        [conversationId, userId]
                    );

                    if (memberships.length === 0) return;

                    await db.query(
                        `UPDATE messages SET is_read = TRUE
                         WHERE conversation_id = ? AND sender_id != ? AND is_read = FALSE`,
                        [conversationId, userId]
                    );

                    io.to(`conversation:${conversationId}`).emit(
                        "messages-read",
                        { conversationId, readerId: userId }
                    );
                } catch (error) {
                    socket.emit("socket-error", { message: error.message });
                }
            }
        );

        /*
        --------------------------------
        SEND MESSAGE
        --------------------------------
        */

        socket.on(
            "send-message",
            async (data) => {

                try {

                    const {
                        conversationId,
                        content
                    } = data;

                    if (
                        !content ||
                        !content.trim()
                    ) {
                        return socket.emit(
                            "socket-error",
                            {
                                message:
                                    "Message content is required"
                            }
                        );
                    }

                    // Verify membership
                    const [memberships] =
                        await db.query(
                            `SELECT id
                             FROM conversation_members
                             WHERE conversation_id = ?
                             AND user_id = ?`,
                            [
                                conversationId,
                                userId
                            ]
                        );

                    if (
                        memberships.length === 0
                    ) {
                        return socket.emit(
                            "socket-error",
                            {
                                message:
                                    "You are not a member of this conversation"
                            }
                        );
                    }

                    // Save message
                    const [result] =
                        await db.query(
                            `INSERT INTO messages
                             (
                                conversation_id,
                                sender_id,
                                content
                             )
                             VALUES (?, ?, ?)`,
                            [
                                conversationId,
                                userId,
                                content.trim()
                            ]
                        );

                    await db.query(
                        `UPDATE conversations
                         SET updated_at =
                            CURRENT_TIMESTAMP
                         WHERE id = ?`,
                        [conversationId]
                    );

                    const [messages] =
                        await db.query(
                            `SELECT
                                m.id,
                                m.conversation_id,
                                m.sender_id,
                                u.name
                                    AS sender_name,
                                u.profile_image
                                    AS sender_profile_image,
                                m.content,
                                m.is_read,
                                m.created_at
                             FROM messages m
                             JOIN users u
                                ON u.id =
                                   m.sender_id
                             WHERE m.id = ?`,
                            [
                                result.insertId
                            ]
                        );

                    const message =
                        messages[0];

                    // Send instantly to everyone
                    // inside conversation room
                    io.to(
                        `conversation:${conversationId}`
                    ).emit(
                        "receive-message",
                        message
                    );

                } catch (error) {

                    socket.emit(
                        "socket-error",
                        {
                            message:
                                error.message
                        }
                    );

                }
            }
        );

        /*
        --------------------------------
        TYPING
        --------------------------------
        */

        socket.on(
            "typing",
            (conversationId) => {

                socket
                    .to(
                        `conversation:${conversationId}`
                    )
                    .emit(
                        "user-typing",
                        {
                            conversationId,
                            userId
                        }
                    );

            }
        );

        /*
        --------------------------------
        STOP TYPING
        --------------------------------
        */

        socket.on(
            "stop-typing",
            (conversationId) => {

                socket
                    .to(
                        `conversation:${conversationId}`
                    )
                    .emit(
                        "user-stop-typing",
                        {
                            conversationId,
                            userId
                        }
                    );

            }
        );

        /*
        --------------------------------
        DISCONNECT
        --------------------------------
        */

        socket.on(
            "disconnect",
            async () => {

                console.log(
                    `User ${userId} disconnected`
                );

                const userSockets =
                    connectedUsers.get(userId);

                if (userSockets) {
                    userSockets.delete(
                        socket.id
                    );

                    if (
                        userSockets.size === 0
                    ) {

                        connectedUsers.delete(
                            userId
                        );

                        await db.query(
                            `UPDATE users
                            SET
                                is_online = FALSE,
                                last_seen =
                                    CURRENT_TIMESTAMP
                            WHERE id = ?`,
                            [userId]
                        );

                        io.emit(
                            "user-offline",
                            {
                                userId
                            }
                        );
                    }
                }
            }
        );

    });
};

module.exports = registerChatSocket;
