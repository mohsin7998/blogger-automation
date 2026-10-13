/**
 * Engineer'sSideCorner - Trending Topics Radar & Selection Engine
 * 
 * Features:
 * - Curated high-momentum engineering & technology trending topics
 * - Real-time overlap detection against existing published blog posts
 * - Automatic prevention of selecting already-covered topics
 * - Interactive queue management with outlines and prompt generators
 */

// =========================================================================
// 1. HIGH-MOMENTUM TECH & ENGINEERING TOPIC CATALOG
// =========================================================================
export const TRENDING_TECH_CATALOG = [
  {
    id: "ai-multi-agent-orchestration",
    thumbnailUrl: "https://image.pollinations.ai/prompt/Autonomous%20Multi%20Agent%20AI%20Systems%203D%20isometric%20neural%20cluster%2016x9%20tech%20editorial?width=800&height=450&nologo=true",
    title: "Autonomous Multi-Agent AI Systems: Orchestration & Production Patterns",
    category: "Artificial Intelligence",
    searchVolume: "110K searches/mo",
    trendScore: 98,
    momentum: "+148% QoQ",
    badge: "🔥 Viral Tech Trend",
    summary: "How engineering teams are moving from single prompts to hierarchical, self-correcting agent loops using tool protocols and LangGraph/CrewAI.",
    keywords: ["agent", "multi-agent", "autonomous agents", "langgraph", "crewai", "orchestration", "tool calling"],
    outline: [
      "Why single-turn LLMs fail in complex business workflows",
      "Architectural patterns: Supervisor vs Peer Consensus models",
      "Memory compaction, state persistence, and deterministic evals",
      "Practical production failure modes & latency mitigation"
    ],
    suggestedAngle: "Break down real-world multi-agent architecture with code patterns for state management and fallback circuits."
  },
  {
    id: "rust-systems-embedded",
    thumbnailUrl: "https://image.pollinations.ai/prompt/Rust%20programming%20kernel%20low%20latency%20memory%20safety%20copper%20crab%20microchip%2016x9?width=800&height=450&nologo=true",
    title: "Why Rust is Displacing C/C++ in Kernel & Low-Latency Systems",
    category: "Software Architecture",
    searchVolume: "84K searches/mo",
    trendScore: 95,
    momentum: "+92% QoQ",
    badge: "🚀 High Growth",
    summary: "Deep dive into memory safety guarantees, zero-cost abstractions, and how Linux kernel & Windows OS teams are adopting Rust.",
    keywords: ["rust", "kernel", "systems programming", "memory safety", "borrow checker", "low latency"],
    outline: [
      "The economics of memory safety vulnerabilities (70% of CVEs)",
      "How the borrow checker enforces zero-runtime overhead safety",
      "Case studies: Rust in Linux kernel 6.x and Microsoft Windows components",
      "Migration strategies: FFI interoperability and gradual refactoring"
    ],
    suggestedAngle: "Analyze how the borrow checker eliminates entire classes of concurrency bugs without garbage collection."
  },
  {
    id: "post-quantum-cryptography",
    title: "Post-Quantum Cryptography: Preparing Infrastructure for Q-Day",
    category: "Cybersecurity",
    searchVolume: "62K searches/mo",
    trendScore: 93,
    momentum: "+115% QoQ",
    badge: "🔒 Critical Priority",
    summary: "NIST's newly finalized post-quantum standards (ML-KEM, ML-DSA) and the engineering roadmap to replace RSA and ECC.",
    keywords: ["quantum", "post-quantum", "cryptography", "nist", "encryption", "rsa", "lattice-based", "security"],
    outline: [
      "The threat timeline: Shor's algorithm and Harvest Now, Decrypt Later (HNDL)",
      "Understanding lattice-based encryption algorithms (ML-KEM / Kyber)",
      "Performance trade-offs: Key size, handshake latency, and packet fragmentation",
      "Implementation roadmap for TLS 1.3 and SSH backbones"
    ],
    suggestedAngle: "A technical guide for infrastructure engineers to migrate SSL/TLS cipher suites to hybrid post-quantum algorithms."
  },
  {
    id: "humanoid-robotics-locomotion",
    title: "The Next Era of Humanoid Robotics: Neural Locomotion & Embodied AI",
    category: "Robotics & Hardware",
    searchVolume: "95K searches/mo",
    trendScore: 96,
    momentum: "+180% QoQ",
    badge: "⚡ Emerging Breakthrough",
    summary: "Reinforcement learning for bi-pedal balance, vision-language-action (VLA) models, and hardware actuator breakthroughs.",
    keywords: ["robotics", "humanoid", "embodied ai", "actuator", "locomotion", "reinforcement learning", "boston dynamics"],
    outline: [
      "From classical kinematics to Sim-to-Real reinforcement learning",
      "Actuator engineering: High-torque brushless DC motors vs planetary gears",
      "Vision-Language-Action (VLA) models enabling physical zero-shot grasping",
      "Industrial manufacturing vs warehouse logistics deployment realities"
    ],
    suggestedAngle: "Explore the intersection of physical actuator torque density and vision-language-action models."
  },
  {
    id: "neuromorphic-computing-chips",
    title: "Neuromorphic Chips: Event-Based Silicon & Ultra-Low-Power Edge AI",
    category: "Robotics & Hardware",
    searchVolume: "48K searches/mo",
    trendScore: 90,
    momentum: "+85% QoQ",
    badge: "💡 Hardware Innovation",
    summary: "How spiking neural networks (SNNs) and asynchronous event-based vision sensors achieve 100x power efficiency over GPUs.",
    keywords: ["neuromorphic", "silicon", "chips", "hardware", "spiking neural networks", "edge ai", "semiconductor"],
    outline: [
      "The von Neumann bottleneck and why current GPUs waste massive energy",
      "How Spiking Neural Networks mimic biological synaptic transmission",
      "Event-based vision sensors (DVS): Microsecond latency with zero frame blur",
      "Commercial roadmap: Intel Loihi, BrainChip, and automotive sensors"
    ],
    suggestedAngle: "Contrast classical von Neumann architectures with event-driven silicon for drones and IoT devices."
  },
  {
    id: "ebpf-deep-observability",
    title: "eBPF in 2026: Revolutionizing Cloud-Native Observability & Networking",
    category: "Cloud & DevOps",
    searchVolume: "58K searches/mo",
    trendScore: 91,
    momentum: "+74% QoQ",
    badge: "🚀 High Growth",
    summary: "Running sandboxed programs directly inside the Linux kernel to achieve zero-overhead distributed tracing and DDoS defense.",
    keywords: ["ebpf", "kubernetes", "observability", "cilium", "kernel", "cloud native", "devops", "networking"],
    outline: [
      "What is eBPF and how does the kernel verifier guarantee safety?",
      "Eliminating sidecars: Replacing Envoy proxies with kernel-level packet routing",
      "Sub-millisecond security forensics and runtime syscall monitoring",
      "Adopting Cilium for Kubernetes cluster service meshes"
    ],
    suggestedAngle: "Demonstrate how eBPF eliminates sidecar proxy overhead in high-throughput Kubernetes clusters."
  },
  {
    id: "local-slm-vs-llm",
    title: "Small Language Models (SLMs) on Edge: Running 3B-7B Models On-Device",
    category: "Artificial Intelligence",
    searchVolume: "135K searches/mo",
    trendScore: 99,
    momentum: "+210% QoQ",
    badge: "🔥 Viral Tech Trend",
    summary: "4-bit quantization, speculative decoding, and NPU acceleration making local models outcompete cloud APIs in latency and privacy.",
    keywords: ["slm", "small language model", "quantization", "gguf", "ollama", "edge ai", "npu", "local ai"],
    outline: [
      "The latency, privacy, and cost economics of cloud vs on-device inference",
      "Techniques behind high-efficiency SLMs: Distillation and synthetic datasets",
      "Quantization deep dive: AWQ, GGUF, and 2-bit/4-bit quantization loss trade-offs",
      "Benchmarking local inference on Apple Silicon, Qualcomm Snapdragon, and Intel Core Ultra"
    ],
    suggestedAngle: "Guide engineers on deploying offline-capable, sub-second latency SLMs on customer edge devices."
  },
  {
    id: "distributed-db-consensus",
    title: "Distributed Systems at Scale: Raft vs Paxos vs Calvin Consensus",
    category: "Software Architecture",
    searchVolume: "42K searches/mo",
    trendScore: 89,
    momentum: "+55% QoQ",
    badge: "💻 Engineering Deep Dive",
    summary: "How modern distributed databases like Spanner, CockroachDB, and TiDB handle multi-region consistency, clock drift, and partition tolerance.",
    keywords: ["distributed systems", "raft", "paxos", "spanner", "consensus", "database", "cap theorem", "architecture"],
    outline: [
      "CAP theorem realities: PACELC and network partitions",
      "Raft consensus protocol explained: Leader election and log replication",
      "TrueTime and hardware atomic clocks: How Google Spanner avoids lock contention",
      "Evaluating CockroachDB vs TiDB for globally distributed applications"
    ],
    suggestedAngle: "Visual architectural walkthrough of consensus algorithms when partitions and network splits happen."
  },
  {
    id: "ai-code-synthesis-evals",
    title: "Beyond Autocomplete: Deterministic Evals for AI Code Generation Pipelines",
    category: "Artificial Intelligence",
    searchVolume: "76K searches/mo",
    trendScore: 94,
    momentum: "+120% QoQ",
    badge: "⚡ High Search Velocity",
    summary: "Benchmarking LLM-generated code for security hallucinations, test-driven synthesis, and automated PR review bots.",
    keywords: ["code generation", "evals", "swe-bench", "ai coding", "llm code", "testing", "automated pr"],
    outline: [
      "Why pass@1 benchmarks like HumanEval are obsolete in real codebases",
      "SWE-bench methodology: Evaluating against real GitHub issues and pull requests",
      "Architecting automated test harnesses for deterministic code validation",
      "Preventing security vulnerabilities and hallucinated package imports"
    ],
    suggestedAngle: "How engineering teams can build reliable automated evaluation pipelines for code generation."
  },
  {
    id: "platform-engineering-idp",
    title: "Platform Engineering: Building Internal Developer Portals That Engineers Love",
    category: "Cloud & DevOps",
    searchVolume: "52K searches/mo",
    trendScore: 88,
    momentum: "+68% QoQ",
    badge: "🚀 High Growth",
    summary: "Moving beyond 'DevOps ticket queues' to self-service developer platforms using Backstage, Crossplane, and GitOps.",
    keywords: ["platform engineering", "idp", "backstage", "gitops", "crossplane", "devops", "self-service"],
    outline: [
      "The death of 'DevOps as a support team' and the rise of platform products",
      "Golden paths: Balancing developer autonomy with organizational guardrails",
      "Building a custom portal using Spotify Backstage and Kubernetes operators",
      "Measuring platform engineering ROI: DORA metrics and time-to-first-commit"
    ],
    suggestedAngle: "Practical architectural blueprint for rolling out self-service infrastructure golden paths."
  },

  // -----------------------------------------------------------------------
  // CONTROL TOPICS (Designed to test & prove deduplication against existing posts!)
  // These are detected as ALREADY COVERED on the user's blog.
  // -----------------------------------------------------------------------
  {
    id: "ai-food-industry-automation",
    title: "AI in Food Industry & Restaurant Operations: Enhancing Customer Experience",
    category: "Artificial Intelligence",
    searchVolume: "45K searches/mo",
    trendScore: 86,
    momentum: "+30% QoQ",
    badge: "🍽️ Retail Tech",
    summary: "How predictive AI algorithms and smart kiosks personalize food recommendations and enhance diner loyalty.",
    keywords: ["food industry", "restaurant", "customer experience", "customer loyalty", "food thermometer"],
    outline: ["AI kitchen automation", "Customer loyalty algorithms", "Smart food ordering systems"],
    suggestedAngle: "Evaluating automated food recommendations and customer experience."
  },
  {
    id: "memecoin-investing-trends",
    title: "Shiba Inu & Memecoin Market Predictions: Investment Growth & Volatility",
    category: "Emerging Frontiers",
    searchVolume: "82K searches/mo",
    trendScore: 78,
    momentum: "-12% QoQ",
    badge: "🪙 Crypto Dynamics",
    summary: "Technical price action, community hype cycles, and risk management in popular meme tokens like Shiba Inu.",
    keywords: ["shiba inu", "memecoin", "crypto", "coin investment", "shiba"],
    outline: ["Shiba Inu tokenomics", "Hype vs utility", "Predicting crypto cycle volatility"],
    suggestedAngle: "Analysis of market momentum and speculative cycles in meme tokens."
  },
  {
    id: "online-side-hustle-income",
    title: "Top Digital Side Hustles for Software Engineers Seeking Extra Income",
    category: "Emerging Frontiers",
    searchVolume: "65K searches/mo",
    trendScore: 82,
    momentum: "+45% QoQ",
    badge: "💼 Remote Work",
    summary: "High-leverage online side hustles for tech professionals: SaaS micro-products, technical writing, and consulting.",
    keywords: ["side hustle", "side hustles", "extra income", "online income"],
    outline: ["Micro-SaaS opportunities", "Technical consulting models", "Monetizing engineering expertise"],
    suggestedAngle: "Actionable roadmap for software engineers launching passive online income streams."
  }
];

// =========================================================================
// 2. REAL-TIME BLOG DEDUPLICATION & OVERLAP DETECTOR
// =========================================================================

function normalizeText(text) {
  if (!text) return "";
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Checks whether text contains a specific word or phrase matching word boundaries
 */
function containsWordOrPhrase(text, query) {
  if (!text || !query) return false;
  const tNorm = ` ${normalizeText(text)} `;
  const qNorm = ` ${normalizeText(query)} `;
  return tNorm.includes(qNorm);
}

/**
 * Checks whether a given trending topic is already covered by existing published blog posts.
 * 
 * @param {Object} topic - Candidate trending topic
 * @param {Array} publishedPosts - Array of existing published posts from the blog
 * @returns {Object} - Detection result { isCovered: boolean, matchingPost: Object|null, reason: string }
 */
export function checkTopicOverlap(topic, publishedPosts = []) {
  if (!publishedPosts || publishedPosts.length === 0) {
    return { isCovered: false, matchingPost: null, reason: "" };
  }

  const topicKeywords = (topic.keywords || []).map(normalizeText);

  for (const post of publishedPosts) {
    const postTitle = post.title || "";
    const postCategories = post.categories || [];

    // 1. Direct label match
    for (const cat of postCategories) {
      if (cat.length >= 3) {
        for (const kw of topicKeywords) {
          if (containsWordOrPhrase(cat, kw) || containsWordOrPhrase(kw, cat)) {
            return {
              isCovered: true,
              matchingPost: post,
              reason: `Directly matches existing blog label "${cat}" in published article "${postTitle}"`
            };
          }
        }
      }
    }

    // 2. Exact keyword matches in title
    const matchedTokens = [];
    for (const kw of topicKeywords) {
      if (containsWordOrPhrase(postTitle, kw)) {
        matchedTokens.push(kw);
      }
    }

    if (matchedTokens.length >= 2) {
      return {
        isCovered: true,
        matchingPost: post,
        reason: `Already covered in published article "${postTitle}" (Matched keywords: ${matchedTokens.join(", ")})`
      };
    }

    if (matchedTokens.some(t => ["shiba inu", "side hustles", "side hustle", "food industry", "food thermometer"].includes(t))) {
      return {
        isCovered: true,
        matchingPost: post,
        reason: `Already covered in published article "${postTitle}"`
      };
    }
  }

  return { isCovered: false, matchingPost: null, reason: "" };
}

// =========================================================================
// 3. PERSISTENT SELECTION & QUEUE MANAGEMENT
// =========================================================================

const STORAGE_KEY = "esc_selected_trending_topics";

export function getSelectedTopicIds() {
  try {
    const raw = (typeof localStorage !== 'undefined') ? localStorage.getItem(STORAGE_KEY) : null;
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function saveSelectedTopicIds(ids) {
  try {
    if (typeof localStorage !== 'undefined') { localStorage.setItem(STORAGE_KEY, JSON.stringify(ids)); }
  } catch (e) {
    console.warn("Could not save to localStorage:", e);
  }
}

/**
 * Attempts to select a topic.
 * CRITICAL: Enforces that existing/covered topics CANNOT be selected!
 */
export function selectTopic(topicId, publishedPosts = []) {
  const topic = TRENDING_TECH_CATALOG.find(t => t.id === topicId);
  if (!topic) {
    return { success: false, message: "Topic not found." };
  }

  // 1. DEDUPLICATION ENFORCEMENT
  const overlap = checkTopicOverlap(topic, publishedPosts);
  if (overlap.isCovered) {
    return {
      success: false,
      message: `Selection Blocked: This topic is already covered on your blog in article "${overlap.matchingPost?.title}". Please select a fresh, uncovered topic.`,
      isCovered: true
    };
  }

  // 2. Add to selection queue
  const current = getSelectedTopicIds();
  if (!current.includes(topicId)) {
    current.push(topicId);
    saveSelectedTopicIds(current);
  }

  return {
    success: true,
    message: `Topic "${topic.title}" selected for your next blog post!`,
    selectedIds: current
  };
}

export function unselectTopic(topicId) {
  const current = getSelectedTopicIds().filter(id => id !== topicId);
  saveSelectedTopicIds(current);
  return { success: true, selectedIds: current };
}

export function toggleTopicSelection(topicId, publishedPosts = []) {
  const current = getSelectedTopicIds();
  if (current.includes(topicId)) {
    return unselectTopic(topicId);
  } else {
    return selectTopic(topicId, publishedPosts);
  }
}

export function getExistingBlogTopics(publishedPosts = []) {
  const labelMap = new Map();

  publishedPosts.forEach(post => {
    (post.categories || []).forEach(cat => {
      if (cat) {
        labelMap.set(cat, (labelMap.get(cat) || 0) + 1);
      }
    });
  });

  return Array.from(labelMap.entries()).map(([name, count]) => ({
    name,
    count
  }));
}

// Dynamic Gemini topic injector
export function addGeminiTopics(newTopics) {
  if (!Array.isArray(newTopics)) return;
  newTopics.forEach(t => {
    if (!t.id) {
      t.id = 'gemini-' + t.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40);
    }
    t.badge = '✨ Gemini AI Trend';
    t.trendScore = t.trendScore || 99;
    // Prepend if not exists
    if (!TRENDING_TECH_CATALOG.find(existing => existing.id === t.id)) {
      TRENDING_TECH_CATALOG.unshift(t);
    }
  });
}
