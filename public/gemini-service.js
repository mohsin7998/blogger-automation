import { generateArchitectureDiagramSvg, generateBenchmarkChartSvg } from "./diagram-engine.js";
/**
 * Engineer'sSideCorner - Google Gemini API Integration Service
 * Powers AI Topic Brainstorming, Deep Technical Drafting & Prompt Synthesis
 */

let GEMINI_API_KEY = "";

// Dynamically load Gemini key from protected git-ignored config
try {
  const configModule = await import("./firebase-config.js");
  if (configModule.GEMINI_API_KEY) {
    GEMINI_API_KEY = configModule.GEMINI_API_KEY;
  }
} catch (e) {
  console.warn("Could not load GEMINI_API_KEY from firebase-config.js:", e);
}

// Fallback to localStorage if manually configured
if (!GEMINI_API_KEY && typeof window !== "undefined") {
  GEMINI_API_KEY = localStorage.getItem("esc_gemini_api_key") || "";
}

// Primary & Fallback Models supported by Google Generative Language API
const GEMINI_MODELS = [
  "gemini-flash-lite-latest",
  "gemini-3-flash-preview",
  "gemini-3.1-flash-lite-preview"
];

/**
 * Checks if Gemini API key is available
 */
export function isGeminiAvailable() {
  return Boolean(GEMINI_API_KEY && GEMINI_API_KEY.length > 10);
}

/**
 * Core caller to Google Generative Language API v1beta
 */
export async function callGemini(prompt, systemInstruction = "") {
  if (!isGeminiAvailable()) {
    throw new Error("Gemini API key is not configured.");
  }

  let lastError = null;

  for (const model of GEMINI_MODELS) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
    
    const contents = [];
    if (systemInstruction) {
      contents.push({
        role: "user",
        parts: [{ text: `[SYSTEM INSTRUCTION: ${systemInstruction}]` }]
      });
      contents.push({
        role: "model",
        parts: [{ text: "Understood. I will strictly follow this instruction." }]
      });
    }
    contents.push({
      role: "user",
      parts: [{ text: prompt }]
    });

    const payload = {
      contents,
      generationConfig: {
        temperature: 0.7,
        topP: 0.95,
        maxOutputTokens: 8192
      }
    };

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const data = await response.json();
        const candidate = data.candidates?.[0];
        const text = candidate?.content?.parts?.[0]?.text;
        if (text) {
          return {
            success: true,
            model,
            text
          };
        }
      } else {
        const errData = await response.json().catch(() => ({}));
        lastError = new Error(errData.error?.message || response.statusText);
      }
    } catch (netErr) {
      lastError = netErr;
    }
  }

  throw lastError || new Error("Failed to generate content with Gemini models.");
}

/**
 * Generates an authoritative, 1,200+ word engineering blog post using Gemini
 */
export async function generateBlogPostWithGemini(topic) {
  const prompt = `You are a Principal Software Architect and distinguished technical author for "Engineer'sSideCorner" (a publication for senior engineers, cloud architects, and systems developers).

Write an authoritative, rigorous, deep-dive engineering blog post on the following topic:

TOPIC: ${topic.title}
CATEGORY: ${topic.category}
TARGET AUDIENCE: Senior software engineers, systems programmers, distributed systems architects.
STRATEGIC ANGLE: ${topic.suggestedAngle}
SEO KEYWORDS TO NATURALLY INTEGRATE: ${topic.keywords ? topic.keywords.join(", ") : topic.category}

MANDATORY ARTICLE STRUCTURE (Use clean Markdown):
# ${topic.title}

*An architectural evaluation and implementation guide for production systems engineers.*

---

## 1. Executive Summary & Market Context
- Deconstruct the foundational problem space and why conventional architectures fail at scale.
- Include a highlighted engineering principle callout (use > blockquote).

---

## 2. Technical Architecture & Component Interaction
- Detailed subsystems breakdown: Ingestion, state machine execution, consensus, failure boundaries.
- Include realistic code or configuration snippet in a fenced code block (\`\`\`yaml, \`\`\`go, or \`\`\`python).

---

## 3. Real-World Benchmarks & Trade-Off Matrix
- Include a Markdown comparative table with columns: Metric Dimension | Legacy Approach | Modern Pattern (${topic.category}) | Production Impact.
- Analyze throughput, p99 latency, compute utilization, and fault recovery.

---

## 4. Key Implementation Lessons & Production Failure Modes
- Provide 3 concrete, non-obvious engineering war stories/lessons (e.g. memory pressure, cascading backpressure, state drift).

---

## 5. Conclusion & Actionable Roadmap
- Pragmatic migration roadmap and closing call-to-action for the Engineer'sSideCorner community.

WRITING GUIDELINES:
- Maintain high technical density. Avoid fluffy marketing phrases or generic beginner advice.
- Write at least 1,000 words. Output clean Markdown only without extraneous preamble.`;

  const systemInstruction = "You are a world-class systems architect writing for the technical engineering publication Engineer'sSideCorner. Prioritize technical rigor, code correctness, and production engineering realities.";

  const result = await callGemini(prompt, systemInstruction);
  return result.text;
}

/**
 * Generates fresh trending topics using Gemini while excluding existing blog post topics
 */
export async function generateTrendingTopicsWithGemini(existingTitles = []) {
  const existingListText = existingTitles.slice(0, 15).map(t => `- ${t}`).join("\n");

  const prompt = `Propose 4 cutting-edge, trending software engineering / cloud architecture topics that are actively breaking in the tech industry today.

CRITICAL CONSTRAINT: Do NOT duplicate or overlap with any of these already covered topics:
${existingListText || "None"}

CATEGORIES TO CHOOSE FROM:
- Artificial Intelligence
- Cloud Infrastructure
- Distributed Systems
- Security & DevSecOps
- High-Performance Computing

Return ONLY a valid JSON array of 4 topic objects with this exact structure:
[
  {
    "id": "kebab-case-slug",
    "title": "Comprehensive Topic Title with Strategic Angle",
    "category": "Artificial Intelligence",
    "searchVolume": "38K/mo",
    "momentum": "+185% Trend",
    "summary": "2-sentence technical summary explaining the problem and solution.",
    "suggestedAngle": "Specific architectural perspective for senior engineers.",
    "outline": [
      "Subsystem Architecture",
      "Benchmark Comparison",
      "Failure Mitigation Patterns"
    ],
    "keywords": ["keyword1", "keyword2", "keyword3", "keyword4"]
  }
]

Output raw JSON only. Do not wrap in markdown quotes if possible.`;

  const result = await callGemini(prompt, "You are a tech editorial curator. Output valid JSON array only.");
  let cleanJson = result.text.trim();
  if (cleanJson.startsWith("```")) {
    cleanJson = cleanJson.replace(/^```[a-z]*\n/i, "").replace(/```$/, "").trim();
  }

  try {
    const topics = JSON.parse(cleanJson);
    return topics;
  } catch (err) {
    console.error("Failed to parse Gemini topic JSON:", err, cleanJson);
    throw new Error("Gemini returned invalid JSON for topics.");
  }
}

/**
 * Generates a photorealistic AI Image prompt with Gemini
 */
export async function generateImagePromptWithGemini(topic) {
  const prompt = `Generate a single concise, hyper-detailed visual prompt (under 60 words) for Midjourney / DALL-E 3 / Imagen to create a 16:9 featured hero banner for this tech article:
TITLE: "${topic.title}"
CATEGORY: "${topic.category}"

Aesthetic: Ultra-modern tech editorial style, glowing cyan & amber fiber optic circuitry, 3D architectural perspective, 8k resolution, cinematic lighting, photorealistic.
Output ONLY the prompt text, nothing else.`;

  const result = await callGemini(prompt);
  return result.text.trim().replace(/^"|"$/g, "");
}


/**
 * Generates an AI 16:9 Featured Hero Thumbnail AT RUNTIME using Gemini prompt synthesis
 */
export async function generateRuntimeHeroThumbnail(topic) {
  let promptText = "";
  try {
    promptText = await generateImagePromptWithGemini(topic);
  } catch (err) {
    promptText = `High-end 16:9 tech editorial banner for "${topic.title}", ${topic.category}, glowing cyan and amber circuits, 3D architectural perspective, 8k resolution`;
  }

  const seed = Math.floor(Math.random() * 899999) + 100000;
  const runtimeUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(promptText)}?width=1280&height=720&nologo=true&seed=${seed}`;

  return {
    prompt: promptText,
    url: runtimeUrl
  };
}

/**
 * Generates custom In-Article Technical Diagrams & Figures AT RUNTIME for the blog
 */
export async function generateRuntimeArticleVisuals(topic) {
  // Generate rich, detailed technical vector architecture diagram
  const fig1Url = generateArchitectureDiagramSvg(topic);
  // Generate empirical comparative latency and benchmark visualization chart
  const fig2Url = generateBenchmarkChartSvg(topic);

  return [
    {
      id: "diagram-1",
      title: `${topic.category} Subsystem Architecture`,
      url: fig1Url,
      alt: `Technical architectural pipeline and state machine for ${topic.title}`,
      caption: `Figure 1: Production Subsystem Architecture & Data Pipeline for ${topic.title}.`
    },
    {
      id: "diagram-2",
      title: "Empirical Latency & Cost Trade-Offs",
      url: fig2Url,
      alt: `Empirical benchmarks, throughput and memory metrics for ${topic.title}`,
      caption: `Figure 2: Production Benchmark Metrics, Latency Profiles & Trade-Off Matrix.`
    }
  ];
}


/**
 * Strict image preloader: actually waits for the browser to load and render the image!
 */
export function preloadAndVerifyImage(imageUrl, timeoutMs = 25000) {
  return new Promise((resolve) => {
    let settled = false;
    const timer = setTimeout(() => {
      if (!settled) {
        settled = true;
        console.warn("Image load timeout after " + (timeoutMs / 1000) + "s:", imageUrl);
        resolve({ success: false, url: imageUrl });
      }
    }, timeoutMs);

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      if (!settled) {
        settled = true;
        clearTimeout(timer);
        resolve({ success: true, url: imageUrl, width: img.naturalWidth, height: img.naturalHeight });
      }
    };
    img.onerror = (e) => {
      if (!settled) {
        settled = true;
        clearTimeout(timer);
        console.warn("Image load failed for:", imageUrl, e);
        resolve({ success: false, url: imageUrl });
      }
    };
    img.src = imageUrl;
  });
}

/**
 * Generates an instant high-resolution 16:9 canvas graphic if external network latency spikes
 */
export function generateCanvasFallbackImage(title, category) {
  try {
    const canvas = document.createElement("canvas");
    canvas.width = 1280;
    canvas.height = 720;
    const ctx = canvas.getContext("2d");

    // Background gradient
    const bgGrad = ctx.createRadialGradient(640, 360, 50, 640, 360, 750);
    bgGrad.addColorStop(0, "#1e1b4b");
    bgGrad.addColorStop(0.5, "#0f172a");
    bgGrad.addColorStop(1, "#020617");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 1280, 720);

    // Grid pattern
    ctx.strokeStyle = "rgba(99, 102, 241, 0.12)";
    ctx.lineWidth = 1;
    for (let x = 40; x < 1280; x += 80) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 720);
      ctx.stroke();
    }
    for (let y = 40; y < 720; y += 80) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(1280, y);
      ctx.stroke();
    }

    // Glowing network nodes
    const nodeColors = ["#6366f1", "#06b6d4", "#f59e0b", "#10b981"];
    for (let i = 0; i < 24; i++) {
      const nx = (i * 137) % 1200 + 40;
      const ny = (i * 229) % 640 + 40;
      const color = nodeColors[i % nodeColors.length];
      ctx.beginPath();
      ctx.arc(nx, ny, 3, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = 10;
      ctx.fill();
    }
    ctx.shadowBlur = 0;

    // Category Badge
    ctx.fillStyle = "rgba(99, 102, 241, 0.25)";
    ctx.strokeStyle = "rgba(99, 102, 241, 0.5)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(80, 110, 260, 42, 21);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#818cf8";
    ctx.font = "bold 15px -apple-system, BlinkMacSystemFont, sans-serif";
    ctx.fillText((category || "ENGINEERING SPEC").toUpperCase(), 105, 137);

    // Title Text
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 42px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    ctx.shadowColor = "rgba(0,0,0,0.8)";
    ctx.shadowBlur = 8;
    
    const words = (title || "Engineering Systems Deep Dive").split(" ");
    let line = "";
    let y = 230;
    const maxWidth = 1080;
    const lineHeight = 54;

    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + " ";
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && n > 0) {
        ctx.fillText(line.trim(), 80, y);
        line = words[n] + " ";
        y += lineHeight;
        if (y > 450) {
          ctx.fillText(words.slice(n).join(" "), 80, y);
          break;
        }
      } else {
        line = testLine;
      }
    }
    if (line.trim() && y <= 450) {
      ctx.fillText(line.trim(), 80, y);
    }

    // Subtitle & Signature
    ctx.shadowBlur = 0;
    ctx.fillStyle = "#94a3b8";
    ctx.font = "16px -apple-system, BlinkMacSystemFont, sans-serif";
    ctx.fillText("ENGINEER'S SIDE CORNER  *  PRODUCTION ARCHITECTURE", 80, 610);

    return canvas.toDataURL("image/jpeg", 0.92);
  } catch (err) {
    console.error("Canvas image fallback error:", err);
    return "";
  }
}
