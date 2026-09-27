const db = require("../config/db");

const createPrivateConversation = async (currentUserId, friendId) => {
    if (currentUserId === friendId) {
        throw new Error("You cannot create a conversation with yourself");
    }

    // Check user exists
    const [users] = await db.query(
        "SELECT id FROM users WHERE id = ?",
        [friendId]
    );

    if (users.length === 0) {
        throw new Error("User not found");
    }

    // Check friendship
    const [friendships] = await db.query(
        `SELECT id
         FROM friendships
         WHERE
            (
                (sender_id = ? AND receiver_id = ?)
                OR
                (sender_id = ? AND receiver_id = ?)
            )
         AND status = 'accepted'`,
        [
            currentUserId,
            friendId,
            friendId,
            currentUserId
        ]
    );

    if (friendships.length === 0) {
        throw new Error("You can only message your friends");
    }

    // Check whether a private conversation already exists
    const [existing] = await db.query(
        `SELECT c.id
         FROM conversations c
         JOIN conversation_members cm1
            ON cm1.conversation_id = c.id
         JOIN conversation_members cm2
            ON cm2.conversation_id = c.id
         WHERE c.type = 'private'
         AND cm1.user_id = ?
         AND cm2.user_id = ?
         LIMIT 1`,
        [
            currentUserId,
            friendId
        ]
    );

    if (existing.length > 0) {
        return {
            conversationId: existing[0].id,
            alreadyExists: true
        };
    }

    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        const [conversationResult] = await connection.query(
            `INSERT INTO conversations (type)
             VALUES ('private')`
        );

        const conversationId =
            conversationResult.insertId;

        await connection.query(
            `INSERT INTO conversation_members
             (conversation_id, user_id)
             VALUES (?, ?), (?, ?)`,
            [
                conversationId,
                currentUserId,
                conversationId,
                friendId
            ]
        );

        await connection.commit();

        return {
            conversationId,
            alreadyExists: false
        };
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

const getMyConversations = async (userId) => {
    const [conversations] = await db.query(
        `SELECT
            c.id AS conversation_id,
            c.type,
            c.updated_at,

            u.id AS user_id,
            u.name,
            u.email,
            u.profile_image,
            u.is_online,
            u.last_seen,

            (
                SELECT m.content
                FROM messages m
                WHERE m.conversation_id = c.id
                ORDER BY m.created_at DESC
                LIMIT 1
            ) AS last_message,

            (
                SELECT m.created_at
                FROM messages m
                WHERE m.conversation_id = c.id
                ORDER BY m.created_at DESC
                LIMIT 1
            ) AS last_message_at

         FROM conversations c

         JOIN conversation_members mine
            ON mine.conversation_id = c.id

         JOIN conversation_members other_member
            ON other_member.conversation_id = c.id
            AND other_member.user_id != ?

         JOIN users u
            ON u.id = other_member.user_id

         WHERE mine.user_id = ?
         AND c.type = 'private'

         ORDER BY
            COALESCE(
                (
                    SELECT MAX(m2.created_at)
                    FROM messages m2
                    WHERE m2.conversation_id = c.id
                ),
                c.created_at
            ) DESC`,
        [
            userId,
            userId
        ]
    );

    return conversations;
};

const getConversationById = async (
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

    const [conversations] = await db.query(
        `SELECT
            c.id,
            c.type,
            c.created_at,
            c.updated_at
         FROM conversations c
         WHERE c.id = ?`,
        [conversationId]
    );

    if (conversations.length === 0) {
        throw new Error("Conversation not found");
    }

    const [members] = await db.query(
        `SELECT
            u.id,
            u.name,
            u.email,
            u.profile_image,
            u.bio,
            u.is_online,
            u.last_seen
         FROM conversation_members cm
         JOIN users u
            ON u.id = cm.user_id
         WHERE cm.conversation_id = ?`,
        [conversationId]
    );

    return {
        ...conversations[0],
        members
    };
};

module.exports = {
    createPrivateConversation,
    getMyConversations,
    getConversationById
};