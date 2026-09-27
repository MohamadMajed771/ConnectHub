const authService = require("../services/authService");
const db = require("../config/db");

const register = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                message: "Name, email and password are required"
            });
        }

        const user = await authService.registerUser(
            name,
            email,
            password
        );

        res.status(201).json({
            message: "User registered successfully",
            user
        });
    } catch (error) {
        res.status(400).json({
            message: error.message
        });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: "Email and password are required"
            });
        }

        const result = await authService.loginUser(
            email,
            password
        );

        res.status(200).json({
            message: "Login successful",
            ...result
        });
    } catch (error) {
        res.status(401).json({
            message: error.message
        });
    }
};

const getMe = async (req, res) => {
    try {
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
            [req.user.id]
        );

        if (users.length === 0) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        res.status(200).json({
            user: users[0]
        });
    } catch (error) {
        res.status(500).json({
            message: "Server error"
        });
    }
};

module.exports = {
    register,
    login,
    getMe
};