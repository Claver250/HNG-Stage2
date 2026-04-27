const User = require('../models/user');
const jwt = require('jsonwebtoken');
const SECRET_KEY = process.env.JWT_SECRET;
const axios = require('axios');

exports.githubAuth = async (req, res) => {
    try {
        const { code } = req.query;
        if (!code) {
            return res.status(400).json({ error: 'Authorization code is required' });
        }
        // 1. Exchange code for access token
        const tokenResponse = await axios.post('https://github.com/login/oauth/access_token', {
            code: code,
            client_id: process.env.GITHUB_CLIENT_ID,
            client_secret: process.env.GITHUB_CLIENT_SECRET,
            redirect_uri: process.env.GITHUB_CALLBACK_URL
        }, {
            headers: {
                'Accept': 'application/json'
            }
        });
        const githubAccessToken = tokenResponse.data.access_token;
        if (!githubAccessToken) {
            return res.status(400).json({ error: 'Failed to obtain access token' });
        }
        // 2. Fetch user info from GitHub
        const userResponse = await axios.get('https://api.github.com/user', {
            headers: {
                Authorization: `token ${githubAccessToken}`
            }
        });
        const { id: github_id, login: username, email, avatar_url } = userResponse.data;
        // 3. Find or create user in our database
        let user = await User.findOne({ where: { github_id } });
        if (!user) {
            user = await User.create({ github_id, username, email, avatar_url, role: 'analyst' });
        }
        // 4. Generate JWT token
        // Inside githubAuth after finding/creating the user:

        const accessToken = jwt.sign(
            { id: user.id, email: user.email, role: user.role, is_active: user.is_active },
            process.env.JWT_ACCESS_SECRET,
            { expiresIn: '3m' }
        );

        const refreshToken = jwt.sign(
            { id: user.id },
            process.env.JWT_REFRESH_SECRET,
            { expiresIn: '5m' }
        );

        // MUST SAVE TO DB so refreshToken logic can find it later
        await RefreshToken.create({ 
            user_id: user.id, 
            token: refreshToken,
            expires_at: new Date(Date.now() + 5 * 60 * 1000)
        });

        return res.json({ 
            status: "success", 
            access_token: accessToken, 
            refresh_token: refreshToken 
        });
    } catch (error) {
        console.error('GitHub authentication failed:', error.message);
        res.status(500).json({ status: 'error', message: 'GitHub authentication failed' });
    }
};

exports.initiateGitHubAuth = (req, res) => {
    const rootUrl = 'https://github.com/login/oauth/authorize';
    const options = {
        client_id: process.env.GITHUB_CLIENT_ID,
        redirect_uri: process.env.GITHUB_CALLBACK_URL,
        scope: 'user:email',
        state: req.query.state || 'standard_web', // CLI will pass a custom state
    };

    const q = new URLSearchParams(options).toString();
    return res.redirect(`${rootUrl}?${q}`);
};

exports.accessToken = (req, res) => {
    const { id, email, role } = req.user;
    const token = jwt.sign({ id, email, role }, process.env.JWT_ACCESS_SECRET, { expiresIn: '3m' });
    res.json({ token });
};

exports.refreshToken = async (req, res) => {
    const { refresh_token } = req.body; // Requirement: matches the field name in the prompt

    if (!refresh_token) {
        return res.status(400).json({ status: "error", message: 'Refresh token is required' });
    }

    try {
        // 1. Verify the token structure/validity
        const decoded = jwt.verify(refresh_token, process.env.JWT_REFRESH_SECRET);

        const storedToken = await RefreshToken.findOne({ where: { token: refresh_token, user_id: decoded.id } });
        
        if (!storedToken) {
            return res.status(401).json({ status: "error", message: 'Token has been invalidated or used' });
        }

        // 3. SECURE ROTATION: Delete the old one immediately
        await storedToken.destroy();

        // 4. Fetch the latest user data (to ensure role/is_active is current)
        const user = await User.findByPk(decoded.id);
        if (!user || !user.is_active) {
            return res.status(403).json({ status: "error", message: 'User account is inactive' });
        }

        // 5. ISSUE A NEW PAIR (The "New Pair" Requirement)
        const newAccessToken = jwt.sign(
            { id: user.id, email: user.email, role: user.role, is_active: user.is_active },
            process.env.JWT_ACCESS_SECRET,
            { expiresIn: '3m' } 
        );

        const newRefreshToken = jwt.sign(
            { id: user.id },
            process.env.JWT_REFRESH_SECRET,
            { expiresIn: '5m' } 
        );

        // 6. SAVE the new refresh token to the DB
        await RefreshToken.create({ 
            user_id: user.id, 
            token: newRefreshToken,
            expires_at: new Date(Date.now() + 5 * 60 * 1000)
        });

        res.json({ 
            status: "success",
            access_token: newAccessToken, 
            refresh_token: newRefreshToken 
        });

    } catch (error) {
        return res.status(401).json({ status: "error", message: 'Invalid or expired refresh token' });
    }
};

exports.redirectToGithub = (req, res) => {
    const rootUrl = 'https://github.com/login/oauth/authorize';
    const options = {
        client_id: process.env.GITHUB_CLIENT_ID,
        redirect_uri: process.env.GITHUB_CALLBACK_URL,
        scope: 'user:email', // To get the email field
        state: 'some_random_string' // In Day 2, we will replace this with PKCE/State logic
    };

    const qs = new URLSearchParams(options);
    return res.redirect(`${rootUrl}?${qs.toString()}`);
};

exports.logout = async (req, res) => {
    const { refresh_token } = req.body;

    if (!refresh_token) {
        return res.status(400).json({ status: "error", message: 'Refresh token is required' });
    }

    try {
        await RefreshToken.destroy({ where: { token: refresh_token } });
        return res.status(200).json({ status: "success", message: "Logged out successfully" });
    } catch (error) {
        return res.status(500).json({ status: "error", message: "Logout failed" });
    }
};