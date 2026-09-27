const db = require("../config/db");

const sendFriendRequest = async (senderId, receiverId) => {
    if (senderId === receiverId) {
        throw new Error("You cannot send a friend request to yourself");
    }

    const [users] = await db.query(
        "SELECT id FROM users WHERE id = ?",
        [receiverId]
    );

    if (users.length === 0) {
        throw new Error("User not found");
    }

    const [existing] = await db.query(
        `SELECT *
         FROM friendships
         WHERE
            (sender_id = ? AND receiver_id = ?)
            OR
            (sender_id = ? AND receiver_id = ?)`,
        [
            senderId,
            receiverId,
            receiverId,
            senderId
        ]
    );

    if (existing.length > 0) {
        const friendship = existing[0];

        if (friendship.status === "pending") {
            throw new Error("Friend request already exists");
        }

        if (friendship.status === "accepted") {
            throw new Error("You are already friends");
        }

        if (friendship.status === "declined") {
            await db.query(
                `UPDATE friendships
                 SET
                    sender_id = ?,
                    receiver_id = ?,
                    status = 'pending'
                 WHERE id = ?`,
                [
                    senderId,
                    receiverId,
                    friendship.id
                ]
            );

            return {
                message: "Friend request sent again"
            };
        }
    }

    const [result] = await db.query(
        `INSERT INTO friendships
         (sender_id, receiver_id)
         VALUES (?, ?)`,
        [
            senderId,
            receiverId
        ]
    );

    return {
        id: result.insertId,
        sender_id: senderId,
        receiver_id: receiverId,
        status: "pending"
    };
};

const getReceivedRequests = async (userId) => {
    const [requests] = await db.query(
        `SELECT
            f.id AS request_id,
            f.created_at,
            u.id AS user_id,
            u.name,
            u.email,
            u.profile_image,
            u.bio
         FROM friendships f
         JOIN users u
            ON u.id = f.sender_id
         WHERE f.receiver_id = ?
         AND f.status = 'pending'
         ORDER BY f.created_at DESC`,
        [userId]
    );

    return requests;
};

const getSentRequests = async (userId) => {
    const [requests] = await db.query(
        `SELECT
            f.id AS request_id,
            f.created_at,
            u.id AS user_id,
            u.name,
            u.email,
            u.profile_image
         FROM friendships f
         JOIN users u
            ON u.id = f.receiver_id
         WHERE f.sender_id = ?
         AND f.status = 'pending'
         ORDER BY f.created_at DESC`,
        [userId]
    );

    return requests;
};

const acceptFriendRequest = async (requestId, userId) => {
    const [requests] = await db.query(
        `SELECT *
         FROM friendships
         WHERE id = ?
         AND receiver_id = ?
         AND status = 'pending'`,
        [
            requestId,
            userId
        ]
    );

    if (requests.length === 0) {
        throw new Error("Friend request not found");
    }

    await db.query(
        `UPDATE friendships
         SET status = 'accepted'
         WHERE id = ?`,
        [requestId]
    );

    return {
        message: "Friend request accepted"
    };
};

const declineFriendRequest = async (requestId, userId) => {
    const [requests] = await db.query(
        `SELECT *
         FROM friendships
         WHERE id = ?
         AND receiver_id = ?
         AND status = 'pending'`,
        [
            requestId,
            userId
        ]
    );

    if (requests.length === 0) {
        throw new Error("Friend request not found");
    }

    await db.query(
        `UPDATE friendships
         SET status = 'declined'
         WHERE id = ?`,
        [requestId]
    );

    return {
        message: "Friend request declined"
    };
};

const getFriends = async (userId) => {
    const [friends] = await db.query(
        `SELECT
            u.id,
            u.name,
            u.email,
            u.profile_image,
            u.bio,
            u.is_online,
            u.last_seen
         FROM friendships f
         JOIN users u
            ON u.id =
                CASE
                    WHEN f.sender_id = ?
                        THEN f.receiver_id
                    ELSE f.sender_id
                END
         WHERE
            (f.sender_id = ? OR f.receiver_id = ?)
            AND f.status = 'accepted'
         ORDER BY u.name ASC`,
        [
            userId,
            userId,
            userId
        ]
    );

    return friends;
};

const removeFriend = async (userId, friendId) => {
    const [result] = await db.query(
        `DELETE FROM friendships
         WHERE
            (
                (sender_id = ? AND receiver_id = ?)
                OR
                (sender_id = ? AND receiver_id = ?)
            )
         AND status = 'accepted'`,
        [
            userId,
            friendId,
            friendId,
            userId
        ]
    );

    if (result.affectedRows === 0) {
        throw new Error("Friendship not found");
    }

    return {
        message: "Friend removed successfully"
    };
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