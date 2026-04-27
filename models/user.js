const {DataTypes} = require('sequelize');
const db = require('../config/sequelize');
const { v7: uuidv7, validate } = require('uuid');
const { all } = require('axios');

const User = db.define('User', {
    id: {
        type: DataTypes.UUID,
        primaryKey: true,
        allowNull: false,
        defaultValue: () => uuidv7() // Generate UUID v7 for each new user
    },
    github_id: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true, // Ensure GitHub IDs are unique
        validate: {
            notEmpty: true,
            len: [1, 50]
        }
    },
    username: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true, // Ensure usernames are unique
        validate: {
            notEmpty: true,
            len: [3, 50]
        }
    },
    email: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true, // Ensure emails are unique
        validate: {
            notEmpty: true,
            isEmail: true
        }
    },
    avatar_url: {
        type: DataTypes.STRING(200),
        allowNull: true
    },
    role: {
        type: DataTypes.ENUM('admin', 'analyst'),
        allowNull: false,
        defaultValue: 'analyst'
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
    },
    last_login_at: {
        type: DataTypes.DATE,
        allowNull: true
    },
    created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    }
});

module.exports = User;