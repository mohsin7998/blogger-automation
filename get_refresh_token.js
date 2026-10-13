/**
 * One-Time Script to Generate a Permanent Google Blogger Refresh Token
 * for Unattended Automated Publishing via Firebase / Node.js
 * 
 * Usage:
 *   node scratch/get_refresh_token.js <CLIENT_ID> <CLIENT_SECRET>
 */

const http = require('http');
const https = require('https');
const url = require('url');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const CLIENT_ID = process.argv[2] || process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.argv[3] || process.env.GOOGLE_CLIENT_SECRET;
const PORT = 8080;
const REDIRECT_URI = `http://localhost:${PORT}/callback`;

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.log(`
========================================================================
GOOGLE BLOGGER PERMANENT REFRESH TOKEN GENERATOR
========================================================================

Please supply your Google OAuth Client ID & Secret:
  node scratch/get_refresh_token.js <CLIENT_ID> <CLIENT_SECRET>

To get your Client ID & Client Secret (2 minutes):
1. Go to Google Cloud Console Credentials:
   https://console.cloud.google.com/apis/credentials?project=bloggerautomation-bda9e
2. Click "+ CREATE CREDENTIALS" > "OAuth client ID"
3. Select "Web application"
4. Add Authorized redirect URI:
   http://localhost:8080/callback
5. Click "Create" and copy the Client ID and Client Secret!
========================================================================
`);
  process.exit(1);
}

const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
  `client_id=${encodeURIComponent(CLIENT_ID)}` +
  `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
  `&response_type=code` +
  `&scope=${encodeURIComponent('https://www.googleapis.com/auth/blogger')}` +
  `&access_type=offline` +
  `&prompt=consent`;

const server = http.createServer((req, res) => {
  const reqUrl = url.parse(req.url, true);
  if (reqUrl.pathname === '/callback') {
    const code = reqUrl.query.code;
    if (!code) {
      res.writeHead(400, { 'Content-Type': 'text/html' });
      res.end('<h3>Error: No authorization code received.</h3>');
      return;
    }

    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end('<h3>Success! Authorization code received. You can close this tab now.</h3>');
    server.close();

    // Exchange authorization code for refresh token
    exchangeCodeForTokens(code);
  }
});

server.listen(PORT, () => {
  console.log(`\nLocal listener active on port ${PORT}...`);
  console.log(`Opening browser for one-time offline consent:\n${authUrl}\n`);
  
  // Attempt to open browser automatically
  const startCmd = process.platform === 'win32' ? `start "" "${authUrl}"` : `open "${authUrl}"`;
  exec(startCmd, (err) => {
    if (err) console.log('Please open the URL above manually in your browser.');
  });
});

function exchangeCodeForTokens(code) {
  console.log('Exchanging authorization code for permanent refresh token...');

  const postData = new URLSearchParams({
    code: code,
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    redirect_uri: REDIRECT_URI,
    grant_type: 'authorization_code'
  }).toString();

  const options = {
    hostname: 'oauth2.googleapis.com',
    port: 443,
    path: '/token',
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  const tokenReq = https.request(options, (tokenRes) => {
    let body = '';
    tokenRes.on('data', chunk => body += chunk);
    tokenRes.on('end', () => {
      try {
        const tokens = JSON.parse(body);
        if (tokens.error) {
          console.error('\nOAuth Token Error:', tokens.error, tokens.error_description);
          return;
        }

        console.log('\n========================================================================');
        console.log('PERMANENT REFRESH TOKEN GENERATED SUCCESSFULLY!');
        console.log('========================================================================');
        console.log('Refresh Token:', tokens.refresh_token);
        console.log('Access Token :', tokens.access_token ? '(Active for 1 hour, auto-refreshes forever)' : 'None');

        // Automatically append to firebase-config.js
        const configPath = path.resolve(__dirname, 'public/firebase-config.js');
        if (fs.existsSync(configPath) && tokens.refresh_token) {
          let configContent = fs.readFileSync(configPath, 'utf8');
          
          if (!configContent.includes('BLOGGER_REFRESH_TOKEN')) {
            configContent += `\n// Permanent OAuth2 credentials for unattended automation\n` +
              `export const BLOGGER_CLIENT_ID = "${CLIENT_ID}";\n` +
              `export const BLOGGER_CLIENT_SECRET = "${CLIENT_SECRET}";\n` +
              `export const BLOGGER_REFRESH_TOKEN = "${tokens.refresh_token}";\n`;
            
            fs.writeFileSync(configPath, configContent, 'utf8');
            console.log(`\nSaved permanently to ${configPath} (git-ignored & protected)!`);
            console.log('You will NEVER have to authorize again.');
          }
        }
      } catch (e) {
        console.error('Failed to parse response:', e, body);
      }
    });
  });

  tokenReq.on('error', (e) => {
    console.error('Network request failed:', e);
  });

  tokenReq.write(postData);
  tokenReq.end();
}
