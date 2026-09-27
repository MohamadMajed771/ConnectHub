const userService = require("../services/userService");

const searchUsers = async (req, res) => {
    try {
        const search = req.query.search || "";

        const users = await userService.searchUsers(
            req.user.id,
            search
        );

        res.status(200).json({
            users
        });
    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};

const getUserById = async (req, res) => {
    try {
        const user = await userService.getUserById(
            req.params.id
        );

        res.status(200).json({
            user
        });
    } catch (error) {
        res.status(404).json({
            message: error.message
        });
    }
};

module.exports = {
    searchUsers,
    getUserById
};