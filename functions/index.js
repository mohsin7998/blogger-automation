/**
 * Firebase Cloud Functions 2nd Gen
 * 24/7 Unattended Autonomous Blog Publishing
 */

const { onSchedule } = require("firebase-functions/v2/scheduler");
const { onRequest } = require("firebase-functions/v2/https");
const { runAutonomousBlogPipeline } = require("./pipeline");

// Helper to resolve secrets from process.env / Firebase functions config
function getCredentials() {
  let clientId = process.env.BLOGGER_CLIENT_ID;
  let clientSecret = process.env.BLOGGER_CLIENT_SECRET;
  let refreshToken = process.env.BLOGGER_REFRESH_TOKEN;
  let geminiKey = process.env.GEMINI_API_KEY;

  // Fallback to ../public/firebase-config.js if environment variables are not set
  const fs = require('fs');
  const path = require('path');
  const localConfigPath = path.resolve(__dirname, '../public/firebase-config.js');
  if (fs.existsSync(localConfigPath)) {
    const content = fs.readFileSync(localConfigPath, 'utf8');
    for (const line of content.split('\n')) {
      if (!geminiKey && line.includes('GEMINI_API_KEY')) geminiKey = line.split('=')[1]?.replace(/['";\s]/g, '');
      if (!clientId && line.includes('BLOGGER_CLIENT_ID')) clientId = line.split('=')[1]?.replace(/['";\s]/g, '');
      if (!clientSecret && line.includes('BLOGGER_CLIENT_SECRET')) clientSecret = line.split('=')[1]?.replace(/['";\s]/g, '');
      if (!refreshToken && line.includes('BLOGGER_REFRESH_TOKEN')) refreshToken = line.split('=')[1]?.replace(/['";\s]/g, '');
    }
  }

  if (!geminiKey) {
    throw new Error("Missing GEMINI_API_KEY environment secret.");
  }
  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error("Missing Blogger OAuth credentials (BLOGGER_CLIENT_ID, BLOGGER_CLIENT_SECRET, or BLOGGER_REFRESH_TOKEN).");
  }

  return { clientId, clientSecret, refreshToken, geminiKey };
}

/**
 * 1. Scheduled Background Publisher (Runs 24/7 in Google Cloud)
 * Default schedule: Every Monday and Thursday at 09:00 UTC
 * To customize: change the cron syntax (e.g., '0 9 * * *' for daily)
 */
exports.publishScheduledPost = onSchedule({
  schedule: "0 9 * * 1,4",
  timeZone: "UTC",
  memory: "512MiB",
  timeoutSeconds: 300,
  retryCount: 1
}, async (event) => {
  console.log("⏰ [Cloud Scheduler] Starting scheduled autonomous blog post generation...");
  try {
    const credentials = getCredentials();
    const result = await runAutonomousBlogPipeline(credentials);
    console.log("✅ [Cloud Scheduler] Successfully published blog post:", result.title, result.url);
    return { success: true, post: result };
  } catch (error) {
    console.error("❌ [Cloud Scheduler] Pipeline failed:", error);
    throw error;
  }
});

/**
 * 2. On-Demand HTTPS Trigger
 * Can be triggered with 1-click from the web dashboard or via curl/webhook
 */
exports.publishNow = onRequest({
  cors: true,
  memory: "512MiB",
  timeoutSeconds: 300
}, async (req, res) => {
  console.log("⚡ [HTTP Trigger] Immediate blog generation requested.");
  try {
    const credentials = getCredentials();
    const result = await runAutonomousBlogPipeline(credentials);
    res.status(200).json({
      status: "success",
      message: "Post generated and published to Blogger successfully!",
      post: {
        id: result.id,
        title: result.title,
        url: result.url,
        published: result.published
      }
    });
  } catch (error) {
    console.error("❌ [HTTP Trigger] Generation failed:", error);
    res.status(500).json({
      status: "error",
      message: error.message
    });
  }
});

/**
 * 3. Deployed Web OAuth Callback Endpoint
 * Used when your Google Cloud Console redirect URI is set to your deployed app:
 * https://bloggerautomation-bda9e.web.app/api/oauth-callback
 */
exports.oauthCallback = onRequest({
  cors: true
}, async (req, res) => {
  const code = req.query.code;
  if (!code) {
    return res.status(400).send("<h3>Missing authorization code.</h3>");
  }

  const clientId = process.env.BLOGGER_CLIENT_ID;
  const clientSecret = process.env.BLOGGER_CLIENT_SECRET;
  const redirectUri = `${req.protocol}://${req.get('host')}${req.path}`;

  try {
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code: code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code"
      })
    });

    const tokens = await tokenRes.json();
    if (tokens.error) {
      return res.status(400).send(`<h3>OAuth Error:</h3><pre>${JSON.stringify(tokens, null, 2)}</pre>`);
    }

    res.status(200).send(`
      <div style="font-family: sans-serif; padding: 40px; max-width: 600px; margin: 0 auto; text-align: center;">
        <h2 style="color: #16a34a;">Permanent Refresh Token Acquired!</h2>
        <p>Save this token into your Firebase functions secrets:</p>
        <div style="background: #f1f5f9; padding: 15px; border-radius: 8px; word-break: break-all; font-family: monospace;">
          ${tokens.refresh_token || 'Refresh token already issued previously.'}
        </div>
        <p style="margin-top: 20px; color: #64748b;">You can now close this tab.</p>
      </div>
    `);
  } catch (err) {
    res.status(500).send(`<h3>Server Error:</h3><p>${err.message}</p>`);
  }
});
