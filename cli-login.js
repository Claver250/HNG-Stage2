const pkce = require('pkce-challenge').default;
const open = (...args) => import('open').then(({default: open}) => open(...args));
const http = require('http');
const url = require('url');

const { code_verifier, code_challenge } = pkce();

// 1. Point the browser to your BACKEND, passing the challenge
const authUrl = `http://localhost:4000/api/v1/auth/github?code_challenge=${code_challenge}&code_challenge_method=S256`;

console.log('Opening browser for GitHub authentication...');
open(authUrl);

// 2. Start a temporary local server to receive the tokens back from the browser
const server = http.createServer((req, res) => {
    const queryObject = url.parse(req.url, true).query;

    if (queryObject.access_token) {
        console.log('\n Login Successful!');
        console.log('Access Token:', queryObject.access_token);
        console.log('Refresh Token:', queryObject.refresh_token);
        
        res.end("Login successful! You can close this window and return to the terminal.");
        
        // Stop the temporary CLI server
        server.close(() => {
            process.exit(0);
        });
    }
}).listen(8080, () => {
    console.log('Waiting for authentication on port 8080...');
});