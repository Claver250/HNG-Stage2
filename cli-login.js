const pkce = require('pkce-challenge').default;
const open = (...args) => import('open').then(({default: open}) => open(...args));
const http = require('http');
const axios = require('axios');
const url = require('url');

const { code_challenge } = pkce();

// Start CLI Server to catch tokens
const server = http.createServer(async (req, res) => {
    const queryObject = url.parse(req.url, true).query;

    if (queryObject.access_token) {
        console.log('\n✅ Login Successful!');
        const token = queryObject.access_token;

        // TEST: Use the token + Version Header to fetch profile
        try {
            const profile = await axios.get('http://localhost:4000/api/v1/auth/profile', {
                headers: {
                    'X-API-Version': '1', // Required by your middleware
                    'Authorization': `Bearer ${token}`
                }
            });
            console.log('Logged in as:', profile.data.data.username);
        } catch (e) {
            console.log('Auth success, but profile fetch failed (check version header).');
        }

        res.end("Authenticated! You can return to your terminal.");
        server.close(() => process.exit(0));
    }
}).listen(8080);

const authUrl = `http://localhost:4000/api/v1/auth/github?code_challenge=${code_challenge}`;
console.log('Waiting for GitHub Auth...');
open(authUrl);