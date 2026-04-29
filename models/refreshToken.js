const { DataTypes } = require('sequelize');
const db = require('../config/sequelize');

const RefreshToken = db.define('RefreshToken', {
    token: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    user_id: {
        type: DataTypes.UUID,
        allowNull: false
    },
    expires_at: {
        type: DataTypes.DATE,
        allowNull: false
    }
}, {
    underscored: true,
    tableName: 'refresh_tokens'
});

module.exports = RefreshToken;