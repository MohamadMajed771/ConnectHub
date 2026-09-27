const db = require("../config/db");

const checkMembership = async (
    conversationId,
    userId
) => {
    const [memberships] = await db.query(
        `SELECT id
         FROM conversation_members
         WHERE conversation_id = ?
         AND user_id = ?`,
        [
            conversationId,
            userId
        ]
    );

    if (memberships.length === 0) {
        throw new Error(
            "You are not a member of this conversation"
        );
    }
};

const sendMessage = async (
    conversationId,
    senderId,
    content
) => {
    await checkMembership(
        conversationId,
        senderId
    );

    if (!content || !content.trim()) {
        throw new Error(
            "Message content is required"
        );
    }

    const [result] = await db.query(
        `INSERT INTO messages
         (conversation_id, sender_id, content)
         VALUES (?, ?, ?)`,
        [
            conversationId,
            senderId,
            content.trim()
        ]
    );

    await db.query(
        `UPDATE conversations
         SET updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [conversationId]
    );

    const [messages] = await db.query(
        `SELECT
            m.id,
            m.conversation_id,
            m.sender_id,
            u.name AS sender_name,
            u.profile_image AS sender_profile_image,
            m.content,
            m.is_read,
            m.created_at
         FROM messages m
         JOIN users u
            ON u.id = m.sender_id
         WHERE m.id = ?`,
        [result.insertId]
    );

    return messages[0];
};

const getMessages = async (
    conversationId,
    userId
) => {
    await checkMembership(
        conversationId,
        userId
    );

    const [messages] = await db.query(
        `SELECT
            m.id,
            m.conversation_id,
            m.sender_id,
            u.name AS sender_name,
            u.profile_image AS sender_profile_image,
            m.content,
            m.is_read,
            m.created_at,
            m.updated_at
         FROM messages m
         JOIN users u
            ON u.id = m.sender_id
         WHERE m.conversation_id = ?
         ORDER BY m.created_at ASC`,
        [conversationId]
    );

    return messages;
};

module.exports = {
    sendMessage,
    getMessages
};