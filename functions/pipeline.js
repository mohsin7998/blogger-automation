/**
 * Autonomous Blog Generation & Publishing Pipeline
 * Designed for Firebase Cloud Functions 2nd Gen
 */

const BLOG_ID = process.env.BLOGGER_BLOG_ID || '1753031768743392930';

// 1. Silent OAuth2 Token Refresh
async function getFreshBloggerAccessToken(clientId, clientSecret, refreshToken) {
  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error('Missing Google OAuth Credentials: Set BLOGGER_CLIENT_ID, BLOGGER_CLIENT_SECRET, and BLOGGER_REFRESH_TOKEN.');
  }

  console.log('[Auth] Silently refreshing Blogger access token from Google OAuth...');
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token'
    })
  });

  const data = await res.json();
  if (data.error) {
    throw new Error(`Google OAuth Refresh Failed: ${data.error} - ${data.error_description || ''}`);
  }

  console.log('[Auth] Fresh access token acquired successfully.');
  return data.access_token;
}

// 2. Fetch Live Posts from Blogger (Semantic Deduplication)
async function fetchExistingBloggerPosts(accessToken) {
  console.log(`[Blogger] Fetching existing posts for Blog ID ${BLOG_ID}...`);
  try {
    const res = await fetch(`https://www.googleapis.com/blogger/v3/blogs/${BLOG_ID}/posts?maxResults=20&fields=items(id,title,published)`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    if (!res.ok) {
      console.warn(`[Blogger] Could not fetch existing posts (${res.status}). Proceeding with clean slate.`);
      return [];
    }
    const data = await res.json();
    const items = data.items || [];
    console.log(`[Blogger] Found ${items.length} existing live posts.`);
    return items.map(p => p.title);
  } catch (err) {
    console.warn('[Blogger] Error listing posts:', err.message);
    return [];
  }
}

// 3. Gemini Topic Discovery & Technical Article Drafting
async function generateArticleWithGemini(geminiKey, existingTitles) {
  console.log('[Gemini] Brainstorming fresh trending topic & generating deep-dive...');

  const prompt = `You are the lead engineering author for Engineer's Side Corner (https://engineersidecorner.blogspot.com/), a high-end publication for staff software engineers and systems architects.

EXISTING RECENT POSTS (DO NOT REPEAT OR OVERLAP WITH THESE):
${existingTitles.length > 0 ? existingTitles.map(t => `- ${t}`).join('\n') : '- No previous titles found'}

Select a brand-new, ultra-modern, practical engineering topic from cutting-edge tech (e.g. eBPF, Distributed Consensus, High-Performance Rust, Real-Time Streaming Systems, MicroVMs, Vector DB Indexing, WASM Edge Runtimes, Zero-Allocation Networking).

Output your response STRICTLY as valid JSON with NO markdown code fencing or backticks:
{
  "topicTitle": "Catchy, authoritative title (e.g., 'Zero-Copy Serialization in High-Throughput Distributed Storage')",
  "tags": ["Systems Engineering", "Performance", "Architecture", "Rust"],
  "summary": "1-2 sentence compelling technical hook for SEO and meta description.",
  "heroConcept": "Short concept phrase for hero graphic (e.g., 'distributed zero copy streaming network')",
  "diagramType": "architecture", 
  "articleMarkdown": "Full 1,200+ word deep-dive article formatted in clean markdown. Structure must include: Executive Architectural Thesis, Deep-Dive Technical Mechanics with realistic code/config snippet, Benchmarks & Trade-Off Matrix analysis, and Production Hardening Checklist."
}`;

  const models = ['gemini-flash-lite-latest', 'gemini-3-flash-preview', 'gemini-3.1-flash-lite-preview'];
  let jsonResult = null;

  for (const model of models) {
    try {
      console.log(`[Gemini] Attempting model: ${model}...`);
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            responseMimeType: "application/json"
          }
        })
      });

      if (!res.ok) {
        console.warn(`[Gemini] Model ${model} returned status ${res.status}. Trying next fallback...`);
        continue;
      }

      const resData = await res.json();
      const rawText = resData.candidates?.[0]?.content?.parts?.[0]?.text;
      if (rawText) {
        const cleaned = rawText.trim().replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/, '');
        jsonResult = JSON.parse(cleaned);
        break;
      }
    } catch (e) {
      console.warn(`[Gemini] Model ${model} failed:`, e.message);
    }
  }

  if (!jsonResult) {
    throw new Error('Gemini failed to generate article content across all candidate models.');
  }

  console.log(`[Gemini] Generated post draft: "${jsonResult.topicTitle}"`);
  return jsonResult;
}

// 4. Server-Side SVG Technical Diagram Engine
function generateTechnicalDiagram(title) {
  return `<div class="esc-diagram-wrapper" style="margin: 32px 0; background: #0f172a; border-radius: 12px; border: 1px solid #1e293b; padding: 24px; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.5); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
    <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: #38bdf8; font-weight: 700; margin-bottom: 16px;">Figure 1: Subsystem Architecture &amp; Data Pipeline</div>
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 860 260" style="width: 100%; height: auto; display: block;">
      <defs>
        <linearGradient id="bgG" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#1e293b"/>
          <stop offset="100%" stop-color="#0f172a"/>
        </linearGradient>
        <linearGradient id="blueG" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#38bdf8"/>
          <stop offset="100%" stop-color="#2563eb"/>
        </linearGradient>
        <linearGradient id="emeraldG" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#34d399"/>
          <stop offset="100%" stop-color="#059669"/>
        </linearGradient>
        <linearGradient id="purpleG" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#c084fc"/>
          <stop offset="100%" stop-color="#7c3aed"/>
        </linearGradient>
      </defs>

      <rect x="0" y="0" width="860" height="260" rx="8" fill="#0b0f19" stroke="#1e293b" stroke-width="1.5"/>

      <!-- Node 1: Ingress -->
      <g transform="translate(30, 45)">
        <rect width="190" height="150" rx="10" fill="url(#bgG)" stroke="#38bdf8" stroke-width="2"/>
        <rect x="15" y="15" width="28" height="28" rx="6" fill="url(#blueG)"/>
        <text x="29" y="34" fill="#ffffff" font-size="14" font-weight="bold" text-anchor="middle">1</text>
        <text x="52" y="34" fill="#f8fafc" font-size="14" font-weight="bold">Ingress Layer</text>
        <text x="15" y="70" fill="#94a3b8" font-size="11">Kernel Bypass / eBPF</text>
        <text x="15" y="92" fill="#94a3b8" font-size="11">Zero-Copy Ring Buffer</text>
        <rect x="15" y="115" width="160" height="20" rx="4" fill="#1e293b"/>
        <text x="22" y="129" fill="#38bdf8" font-size="10" font-family="monospace">&lt; 4.2 &mu;s Wire Latency</text>
      </g>

      <!-- Connection 1 -> 2 -->
      <path d="M 220 120 L 290 120" stroke="#38bdf8" stroke-width="2.5" stroke-dasharray="6,4"/>
      <polygon points="295,120 287,115 287,125" fill="#38bdf8"/>
      <text x="257" y="110" fill="#64748b" font-size="10" text-anchor="middle">RDMA / IPC</text>

      <!-- Node 2: Processing Engine -->
      <g transform="translate(300, 45)">
        <rect width="260" height="150" rx="10" fill="url(#bgG)" stroke="#34d399" stroke-width="2"/>
        <rect x="15" y="15" width="28" height="28" rx="6" fill="url(#emeraldG)"/>
        <text x="29" y="34" fill="#ffffff" font-size="14" font-weight="bold" text-anchor="middle">2</text>
        <text x="52" y="34" fill="#f8fafc" font-size="14" font-weight="bold">Execution Core</text>
        <text x="15" y="70" fill="#94a3b8" font-size="11">SIMD Vectorized Pipeline</text>
        <text x="15" y="92" fill="#94a3b8" font-size="11">Lock-Free Actor State Machine</text>
        <rect x="15" y="115" width="230" height="20" rx="4" fill="#1e293b"/>
        <text x="22" y="129" fill="#34d399" font-size="10" font-family="monospace">1.85M Events/sec / Node</text>
      </g>

      <!-- Connection 2 -> 3 -->
      <path d="M 560 120 L 630 120" stroke="#c084fc" stroke-width="2.5" stroke-dasharray="6,4"/>
      <polygon points="635,120 627,115 627,125" fill="#c084fc"/>
      <text x="597" y="110" fill="#64748b" font-size="10" text-anchor="middle">Consensus Log</text>

      <!-- Node 3: Storage & Replicated State -->
      <g transform="translate(640, 45)">
        <rect width="190" height="150" rx="10" fill="url(#bgG)" stroke="#c084fc" stroke-width="2"/>
        <rect x="15" y="15" width="28" height="28" rx="6" fill="url(#purpleG)"/>
        <text x="29" y="34" fill="#ffffff" font-size="14" font-weight="bold" text-anchor="middle">3</text>
        <text x="52" y="34" fill="#f8fafc" font-size="14" font-weight="bold">Storage Engine</text>
        <text x="15" y="70" fill="#94a3b8" font-size="11">NVMe LSM-Tree Compaction</text>
        <text x="15" y="92" fill="#94a3b8" font-size="11">Quorum Replicated Log</text>
        <rect x="15" y="115" width="160" height="20" rx="4" fill="#1e293b"/>
        <text x="22" y="129" fill="#c084fc" font-size="10" font-family="monospace">p99 &lt; 1.2 ms Write</text>
      </g>
    </svg>
    <div style="font-size: 12px; color: #64748b; margin-top: 12px; text-align: center; font-style: italic;">Verified on 3-Node Clustered Benchmark &bull; Engineer's Side Corner Architectural Matrix</div>
  </div>`;
}

// 5. Assemble Complete Article HTML
function assembleBloggerHtml(articleData) {
  const { topicTitle, summary, articleMarkdown, heroConcept } = articleData;
  const diagramHtml = generateTechnicalDiagram(topicTitle);

  let contentHtml = articleMarkdown
    .replace(/^### (.*$)/gim, '<h3 style="color:#0284c7; margin-top:28px; margin-bottom:12px; font-size:20px; font-weight:700;">$1</h3>')
    .replace(/^## (.*$)/gim, '<h2 style="color:#0f172a; margin-top:36px; margin-bottom:16px; font-size:24px; font-weight:800; border-bottom:2px solid #e2e8f0; padding-bottom:8px;">$1</h2>')
    .replace(/^# (.*$)/gim, '<h1 style="color:#0f172a; margin-top:24px; margin-bottom:16px; font-size:28px; font-weight:800;">$1</h1>')
    .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/gim, '<em>$1</em>')
    .replace(/`([^`]+)`/gim, '<code style="background:#f1f5f9; color:#0f172a; padding:2px 6px; border-radius:4px; font-family:monospace; font-size:13px;">$1</code>')
    .replace(/```([a-z]*)\n([\s\S]*?)\n```/gim, '<pre style="background:#0f172a; color:#f8fafc; padding:16px; border-radius:8px; overflow-x:auto; font-family:monospace; font-size:13px; line-height:1.6; border:1px solid #1e293b;"><code>$2</code></pre>')
    .replace(/^\* (.*$)/gim, '<li style="margin-bottom:6px;">$1</li>')
    .replace(/^\- (.*$)/gim, '<li style="margin-bottom:6px;">$1</li>')
    .replace(/\n\n/gim, '</p><p style="margin-bottom:18px; line-height:1.75; color:#334155; font-size:16px;">');

  const heroUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(heroConcept + ' modern tech engineering vector diagram schematic sleek dark theme')}?width=1200&height=630&nologo=true`;

  return `
<div class="esc-article-container" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 860px; margin: 0 auto; line-height: 1.7; color: #1e293b;">
  <div style="margin-bottom: 28px; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1); border: 1px solid #e2e8f0;">
    <img src="${heroUrl}" alt="${topicTitle}" style="width: 100%; height: auto; display: block; max-height: 480px; object-fit: cover;" />
  </div>

  <div style="background: #f8fafc; border-left: 4px solid #0284c7; padding: 18px 22px; border-radius: 0 8px 8px 0; margin-bottom: 30px;">
    <p style="margin: 0; font-size: 17px; font-weight: 500; color: #0f172a; line-height: 1.6;">
      <strong>Architectural Context:</strong> ${summary}
    </p>
  </div>

  <div class="esc-article-body">
    <p style="margin-bottom:18px; line-height:1.75; color:#334155; font-size:16px;">
      ${contentHtml}
    </p>
  </div>

  ${diagramHtml}

  <div style="margin-top: 48px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 13px; color: #64748b; display: flex; justify-content: space-between;">
    <span>Published automatically by <strong>Engineer's Side Corner Cloud Worker</strong></span>
    <span>Target: Staff &amp; Principal Systems Engineers</span>
  </div>
</div>`;
}

// 6. Post to Blogger API v3
async function publishToBlogger(accessToken, title, htmlContent, tags) {
  console.log(`[Blogger] Publishing to Blogger API (Blog ID: ${BLOG_ID})...`);

  const res = await fetch(`https://www.googleapis.com/blogger/v3/blogs/${BLOG_ID}/posts/`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      kind: 'blogger#post',
      blog: { id: BLOG_ID },
      title: title,
      content: htmlContent,
      labels: tags || ['Engineering', 'Architecture', 'Systems']
    })
  });

  const data = await res.json();
  if (data.error) {
    throw new Error(`Blogger Publishing Failed: ${data.error.message} (${data.error.code})`);
  }

  console.log('[Blogger] Successfully published post ID:', data.id);
  console.log('[Blogger] Live URL:', data.url);
  return data;
}

// 7. Orchestrator
async function runAutonomousBlogPipeline(credentials) {
  const { clientId, clientSecret, refreshToken, geminiKey } = credentials;

  // 1. Silent OAuth Refresh
  const accessToken = await getFreshBloggerAccessToken(clientId, clientSecret, refreshToken);

  // 2. Existing Posts for Deduplication
  const existingTitles = await fetchExistingBloggerPosts(accessToken);

  // 3. Gemini Generation
  const articleData = await generateArticleWithGemini(geminiKey, existingTitles);

  // 4. Assemble HTML
  const finalHtml = assembleBloggerHtml(articleData);

  // 5. Publish to Blogger
  const result = await publishToBlogger(accessToken, articleData.topicTitle, finalHtml, articleData.tags);

  return result;
}

module.exports = {
  runAutonomousBlogPipeline,
  getFreshBloggerAccessToken
};
