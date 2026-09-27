const db = require("../config/db");

const searchUsers = async (currentUserId, search) => {
    const [users] = await db.query(
        `SELECT
            id,
            name,
            email,
            profile_image,
            bio,
            is_online,
            last_seen
         FROM users
         WHERE id != ?
         AND (
            name LIKE ?
            OR email LIKE ?
         )
         LIMIT 20`,
        [
            currentUserId,
            `%${search}%`,
            `%${search}%`
        ]
    );

    return users;
};

const getUserById = async (userId) => {
    const [users] = await db.query(
        `SELECT
            id,
            name,
            email,
            profile_image,
            bio,
            is_online,
            last_seen,
            created_at
         FROM users
         WHERE id = ?`,
        [userId]
    );

    if (users.length === 0) {
        throw new Error("User not found");
    }

    return users[0];
};

module.exports = {
    searchUsers,
    getUserById
};