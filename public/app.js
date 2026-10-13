
function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

import {
  TRENDING_TECH_CATALOG,
  checkTopicOverlap,
  getSelectedTopicIds,
  selectTopic,
  unselectTopic,
  toggleTopicSelection,
  getExistingBlogTopics,
  addGeminiTopics
} from "./trending-topics.js";

import {
  isGeminiAvailable,
  generateTrendingTopicsWithGemini
} from "./gemini-service.js";

﻿/**
 * Engineer'sSideCorner - Firebase Admin Portal
 * Web SDK v10 Modular & Resilient Blogger Feed
 */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// =========================================================================
// 1. SECURE FIREBASE CONFIGURATION (Imported from git-ignored config)
// =========================================================================
let firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: ""
};

let ALLOWED_EMAILS = [];

try {
  const configModule = await import("./firebase-config.js");
  firebaseConfig = configModule.firebaseConfig;
  ALLOWED_EMAILS = configModule.ALLOWED_EMAILS;
} catch (e) {
  console.warn("Local firebase-config.js not found, checking environment or example config.", e);
}

// Check if credentials are set
const isConfigured = firebaseConfig.apiKey !== "YOUR_API_KEY" && !firebaseConfig.apiKey.includes("YOUR_");

// DOM Elements
const initialLoader = document.getElementById("initial-loader");
const authScreen = document.getElementById("auth-screen");
const dashboardScreen = document.getElementById("dashboard-screen");
const configWarning = document.getElementById("config-warning");

const btnGoogleLogin = document.getElementById("btn-google-login");
const emailLoginForm = document.getElementById("email-login-form");
const loginEmailInput = document.getElementById("login-email");
const loginPasswordInput = document.getElementById("login-password");
const btnEmailSubmit = document.getElementById("btn-email-submit");
const emailBtnText = document.getElementById("email-btn-text");
const emailBtnSpinner = document.getElementById("email-btn-spinner");

const authErrorBox = document.getElementById("auth-error-box");
const authErrorMessage = document.getElementById("auth-error-message");

const btnSignOut = document.getElementById("btn-sign-out");
const userDisplayName = document.getElementById("user-display-name");
const userDisplayEmail = document.getElementById("user-display-email");
const userAvatarContainer = document.getElementById("user-avatar-container");
const userAvatarFallback = document.getElementById("user-avatar-fallback");
const userAvatarImg = document.getElementById("user-avatar-img");

// Blog Posts Elements
const statPostsCount = document.getElementById("stat-posts-count");
const postsBadgeCount = document.getElementById("posts-badge-count");
const postsLoader = document.getElementById("posts-loader");
const postsEmpty = document.getElementById("posts-empty");
const postsContainer = document.getElementById("posts-container");
const postsSearchInput = document.getElementById("posts-search-input");
const btnRefreshPosts = document.getElementById("btn-refresh-posts");
const refreshIcon = document.getElementById("refresh-icon");

// Initial baseline cache of Engineer'sSideCorner articles for instantaneous display
const INITIAL_BLOG_POSTS = [
  {
    title: "Alaskapox: A Mysterious Disease from the Far North",
    published: "2024-02-12T19:53:00.000-08:00",
    link: "https://engineersidecorner.blogspot.com/2024/02/alaskapox-mysterious-disease-from-far.html",
    categories: ["Health & Science"]
  },
  {
    title: "Jim Jordan: The Controversial and Conservative Candidate for House Speaker",
    published: "2023-10-17T12:25:00.002-07:00",
    link: "https://engineersidecorner.blogspot.com/2023/10/jim-jordan-controversial-and.html",
    categories: ["Jim Jordan"]
  },
  {
    title: "Shiba Inu Coin: Predicting its Future Growth and Investment Opportunities",
    published: "2023-08-28T09:13:00.003-07:00",
    link: "https://engineersidecorner.blogspot.com/2023/08/shiba-inu-coin-predicting-its-future.html",
    categories: ["Crypto", "Shiba Inu Future"]
  },
  {
    title: "Top Online Side Hustles for Extra Income",
    published: "2023-08-19T12:51:00.002-07:00",
    link: "https://engineersidecorner.blogspot.com/2023/08/top-online-side-hustles-for-extra-income.html",
    categories: ["Side hustles", "Finance"]
  },
  {
    title: "Shiba Inu Coin: How It Performed in 2023 and What to Expect in 2024",
    published: "2023-08-10T06:00:00.002-07:00",
    link: "https://engineersidecorner.blogspot.com/2023/08/shiba-inu-coin-how-it-performed-in-2023.html",
    categories: ["Crypto", "Shiba Inu 2023"]
  },
  {
    title: "How AI is Enhancing Customer Experience and Loyalty in the Food Industry",
    published: "2023-08-07T23:28:00.004-07:00",
    link: "https://engineersidecorner.blogspot.com/2023/08/how-ai-is-enhancing-customer-experience.html",
    categories: ["Artificial Intelligence", "Food Industry"]
  },
  {
    title: "How AI is transforming the food industry",
    published: "2023-07-30T23:21:00.002-07:00",
    link: "https://engineersidecorner.blogspot.com/2023/07/how-ai-is-transforming-food-industry.html",
    categories: ["AI Insights"]
  },
  {
    title: "How to Use a Food Thermometer to Cook Perfectly Every Time",
    published: "2023-07-29T09:44:00.004-07:00",
    link: "https://engineersidecorner.blogspot.com/2023/07/how-to-use-food-thermometer-to-cook.html",
    categories: ["Tech & Guides"]
  },
  {
    title: "Redmi 12C: A Budget-Friendly Smartphone with a Lot to Offer",
    published: "2023-07-29T08:59:00.000-07:00",
    link: "https://engineersidecorner.blogspot.com/2023/07/redmi-12c-budget-friendly-smartphone.html",
    categories: ["Gadgets & Reviews"]
  }
];

let allBlogPosts = [...INITIAL_BLOG_POSTS];

// Error & Notification Helpers
function displayError(message) {
  authErrorMessage.textContent = message;
  authErrorBox.classList.remove("hidden");
}

function clearError() {
  authErrorBox.classList.add("hidden");
  authErrorMessage.textContent = "";
}

function setEmailLoading(isLoading) {
  if (isLoading) {
    btnEmailSubmit.disabled = true;
    emailBtnText.classList.add("opacity-50");
    emailBtnSpinner.classList.remove("hidden");
  } else {
    btnEmailSubmit.disabled = false;
    emailBtnText.classList.remove("opacity-50");
    emailBtnSpinner.classList.add("hidden");
  }
}

function getFriendlyAuthErrorMessage(errorCode) {
  switch (errorCode) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "Invalid email or password. Please check your credentials.";
    case "auth/invalid-email":
      return "The email address is not formatted correctly.";
    case "auth/user-disabled":
      return "This user account has been disabled.";
    case "auth/too-many-requests":
      return "Access to this account has been temporarily disabled due to many failed attempts. Try again later.";
    case "auth/popup-closed-by-user":
      return "The Google sign-in window was closed before completing.";
    case "auth/popup-blocked":
      return "Popup was blocked by your browser. Please enable popups for this site.";
    case "auth/unauthorized-domain":
      return "This domain is not authorized in Firebase Console (Authentication > Settings > Authorized domains).";
    case "auth/network-request-failed":
      return "Network connection error. Please check your internet connection.";
    default:
      return "Authentication error: " + (errorCode || "Please verify credentials.");
  }
}

function isEmailAuthorized(email) {
  if (!email) return false;
  const normalized = email.toLowerCase().trim();
  const activeAllowedList = ALLOWED_EMAILS.filter(e => e && e !== "YOUR_EMAIL_HERE");
  if (activeAllowedList.length === 0) return true;
  return activeAllowedList.some(allowed => allowed.toLowerCase().trim() === normalized);
}

function formatDate(isoString) {
  if (!isoString) return "N/A";
  try {
    const d = new Date(isoString);
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  } catch {
    return isoString.split("T")[0] || isoString;
  }
}

// =========================================================================
// RESILIENT BLOGGER FEED FETCHER (with Timeout & Fallback)
// =========================================================================
function fetchBloggerFeedJSONP() {
  return new Promise((resolve, reject) => {
    const callbackName = "bloggerSummaryCallback_" + Math.floor(Math.random() * 1000000);
    const script = document.createElement("script");
    let hasResolved = false;

    // Strict 4-second timeout to prevent hanging
    const timeoutTimer = setTimeout(() => {
      if (!hasResolved) {
        hasResolved = true;
        cleanup();
        reject(new Error("Blogger JSONP request timed out"));
      }
    }, 4000);

    function cleanup() {
      clearTimeout(timeoutTimer);
      delete window[callbackName];
      if (script.parentNode) script.parentNode.removeChild(script);
    }

    window[callbackName] = function (data) {
      if (hasResolved) return;
      hasResolved = true;
      cleanup();

      try {
        const feed = data.feed || {};
        const entries = feed.entry || [];
        const total = feed.openSearch$totalResults?.$t ? parseInt(feed.openSearch$totalResults.$t, 10) : entries.length;

        const posts = entries.map((entry) => {
          const alternateLink = entry.link?.find((l) => l.rel === "alternate")?.href || "https://engineersidecorner.blogspot.com/";
          const categories = Array.isArray(entry.category) 
            ? entry.category.map(c => c.term || "") 
            : (entry.category?.term ? [entry.category.term] : []);

          return {
            title: entry.title?.$t || "Untitled Article",
            published: entry.published?.$t || "",
            link: alternateLink,
            categories: categories
          };
        });

        resolve({ total, posts });
      } catch (err) {
        reject(err);
      }
    };

    script.src = `https://engineersidecorner.blogspot.com/feeds/posts/summary?alt=json-in-script&callback=${callbackName}&max-results=50`;
    script.onerror = function () {
      if (hasResolved) return;
      hasResolved = true;
      cleanup();
      reject(new Error("JSONP script loading error"));
    };

    document.head.appendChild(script);
  });
}

// Fallback fetcher via CORS proxy if browser blocks JSONP
async function fetchBloggerFeedProxy() {
  const targetUrl = "https://engineersidecorner.blogspot.com/feeds/posts/summary?alt=json&max-results=50";
  const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`;
  const res = await fetch(proxyUrl, { cache: "no-store" });
  if (!res.ok) throw new Error("Proxy fetch failed");
  const data = await res.json();
  const feed = data.feed || {};
  const entries = feed.entry || [];
  const total = feed.openSearch$totalResults?.$t ? parseInt(feed.openSearch$totalResults.$t, 10) : entries.length;

  const posts = entries.map((entry) => {
    const alternateLink = entry.link?.find((l) => l.rel === "alternate")?.href || "https://engineersidecorner.blogspot.com/";
    const categories = Array.isArray(entry.category) 
      ? entry.category.map(c => c.term || "") 
      : (entry.category?.term ? [entry.category.term] : []);

    return {
      title: entry.title?.$t || "Untitled Article",
      published: entry.published?.$t || "",
      link: alternateLink,
      categories: categories
    };
  });

  return { total, posts };
}

// Render dynamic post rows
function renderPostsList(posts) {
  postsContainer.innerHTML = "";

  if (!posts || posts.length === 0) {
    postsEmpty.classList.remove("hidden");
    postsContainer.classList.add("hidden");
    return;
  }

  postsEmpty.classList.add("hidden");
  postsContainer.classList.remove("hidden");

  posts.forEach((post) => {
    const item = document.createElement("div");
    item.className = "py-4 sm:py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 group transition-all duration-200 hover:bg-white/[0.02] px-2 sm:px-4 rounded-xl border-b border-slate-800/60 last:border-0";

    const formattedDate = formatDate(post.published);

    const tagsHtml = post.categories && post.categories.length > 0
      ? post.categories.slice(0, 2).map(tag => 
          `<span class="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 font-medium">${tag}</span>`
        ).join("")
      : "";

    item.innerHTML = `
      <div class="flex-1 min-w-0 pr-4">
        <div class="flex items-center gap-2 mb-1.5 flex-wrap">
          <span class="inline-flex items-center gap-1 text-[11px] font-mono text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
            </svg>
            Uploaded: ${formattedDate}
          </span>
          ${tagsHtml}
        </div>
        <h5 class="text-sm sm:text-base font-semibold text-slate-100 group-hover:text-indigo-300 transition-colors line-clamp-2">
          ${post.title}
        </h5>
      </div>

      <div class="shrink-0 pt-2 sm:pt-0">
        <a href="${post.link}" target="_blank" rel="noopener noreferrer"
           class="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800/90 hover:bg-indigo-600 text-slate-200 hover:text-white border border-slate-700/80 hover:border-indigo-500 transition-all duration-200 shadow group/btn cursor-pointer whitespace-nowrap">
          <span>Open Blog Post</span>
          <svg class="w-3.5 h-3.5 transition-transform group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
          </svg>
        </a>
      </div>
    `;

    postsContainer.appendChild(item);
  });
}

function filterAndRenderPosts() {
  const query = (postsSearchInput.value || "").toLowerCase().trim();
  if (!query) {
    renderPostsList(allBlogPosts);
    return;
  }

  const filtered = allBlogPosts.filter((post) => {
    const matchTitle = (post.title || "").toLowerCase().includes(query);
    const matchTags = (post.categories || []).some((cat) => cat.toLowerCase().includes(query));
    return matchTitle || matchTags;
  });

  renderPostsList(filtered);
}

// Load and display blog posts without hanging
async function loadBlogData() {
  refreshIcon.classList.add("animate-spin");

  // Show immediate cached content so user is never stuck on Loading
  statPostsCount.textContent = `${allBlogPosts.length} Posts`;
  postsBadgeCount.textContent = allBlogPosts.length;
  filterAndRenderPosts();
    renderTrendingRadar();
  postsLoader.classList.add("hidden");

  try {
    let result;
    try {
      // 1st Attempt: fast summary JSONP
      result = await fetchBloggerFeedJSONP();
    } catch (jsonpErr) {
      console.warn("JSONP attempt failed or timed out, trying fallback proxy...", jsonpErr);
      // 2nd Attempt: fallback proxy
      result = await fetchBloggerFeedProxy();
    }

    if (result && result.posts && result.posts.length > 0) {
      allBlogPosts = result.posts;
      statPostsCount.textContent = `${result.total} Posts`;
      postsBadgeCount.textContent = result.total;
      filterAndRenderPosts();
    renderTrendingRadar();
    }
  } catch (error) {
    console.warn("Live feed sync fallback to cache:", error);
    // Even if both live attempts fail, the cache remains cleanly rendered!
    statPostsCount.textContent = `${allBlogPosts.length} Posts`;
    postsBadgeCount.textContent = allBlogPosts.length;
    filterAndRenderPosts();
    renderTrendingRadar();
  } finally {
    postsLoader.classList.add("hidden");
    refreshIcon.classList.remove("animate-spin");
  }
}

// Event Listeners
postsSearchInput.addEventListener("input", filterAndRenderPosts);
btnRefreshPosts.addEventListener("click", loadBlogData);

// =========================================================================
// FIREBASE APP INITIALIZATION
// =========================================================================
if (!isConfigured) {
  if (configWarning) configWarning.classList.remove("hidden");
  initialLoader.classList.add("hidden");
  authScreen.classList.remove("hidden");
  displayError("Please set your real Firebase credentials in public/app.js to enable live authentication.");
}

let app;
let auth;
let googleProvider;

if (isConfigured) {
  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    googleProvider = new GoogleAuthProvider();
    googleProvider.addScope("https://www.googleapis.com/auth/blogger");
    googleProvider.setCustomParameters({ prompt: "select_account" });

    // Auth state listener
    onAuthStateChanged(auth, async (user) => {
      initialLoader.classList.add("hidden");

      if (user) {
        // Enforce user whitelist check
        if (!isEmailAuthorized(user.email)) {
          console.warn(`Unauthorized login attempt by: ${user.email}`);
          await signOut(auth);
          dashboardScreen.classList.add("hidden");
          authScreen.classList.remove("hidden");
          displayError(`Access Denied: The account (${user.email || 'unknown'}) is not authorized to access this dashboard.`);
          return;
        }

        // Authenticated & Authorized: Reveal Dashboard Immediately
        authScreen.classList.add("hidden");
        dashboardScreen.classList.remove("hidden");

        const name = user.displayName || user.email?.split("@")[0] || "Admin";
        const email = user.email || "No email associated";

        userDisplayName.textContent = name;
        userDisplayEmail.textContent = email;

        if (user.photoURL) {
          userAvatarImg.src = user.photoURL;
          userAvatarImg.classList.remove("hidden");
          userAvatarFallback.classList.add("hidden");
        } else {
          userAvatarFallback.textContent = name.charAt(0).toUpperCase();
          userAvatarFallback.classList.remove("hidden");
          userAvatarImg.classList.add("hidden");
        }

        // Load posts immediately
        loadBlogData();

      } else {
        dashboardScreen.classList.add("hidden");
        authScreen.classList.remove("hidden");
      }
    });

    // Google Sign-In with Blogger OAuth token capture
    btnGoogleLogin.addEventListener("click", async () => {
      clearError();
      try {
        const result = await signInWithPopup(auth, googleProvider);
        const credential = GoogleAuthProvider.credentialFromResult(result);
        if (credential?.accessToken) {
          sessionStorage.setItem("esc_blogger_access_token", credential.accessToken);
          localStorage.setItem("esc_blogger_access_token", credential.accessToken);
        }
      } catch (error) {
        console.error("Google sign-in error:", error);
        displayError(getFriendlyAuthErrorMessage(error.code));
      }
    });

    // Email Sign-In
    emailLoginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      clearError();

      const email = loginEmailInput.value.trim();
      const password = loginPasswordInput.value;

      if (!email || !password) {
        displayError("Please enter both email and password.");
        return;
      }

      if (!isEmailAuthorized(email)) {
        displayError(`Access Denied: "${email}" is not authorized for this dashboard.`);
        return;
      }

      setEmailLoading(true);

      try {
        await signInWithEmailAndPassword(auth, email, password);
      } catch (error) {
        console.error("Email sign-in error:", error);
        displayError(getFriendlyAuthErrorMessage(error.code));
      } finally {
        setEmailLoading(false);
      }
    });

    // Sign Out
    btnSignOut.addEventListener("click", async () => {
      try {
        await signOut(auth);
      } catch (error) {
        console.error("Sign out error:", error);
      }
    });

  } catch (initError) {
    console.error("Firebase initialization failed:", initError);
    initialLoader.classList.add("hidden");
    authScreen.classList.remove("hidden");
    displayError("Failed to initialize Firebase: " + initError.message);
  }
} else {
  btnGoogleLogin.addEventListener("click", () => {
    displayError("Firebase is not configured yet. Add your Firebase keys in public/app.js.");
  });
  emailLoginForm.addEventListener("submit", (e) => {
    e.preventDefault();
    displayError("Firebase is not configured yet. Add your Firebase keys in public/app.js.");
  });
}


// =========================================================================
// TRENDING TOPICS RADAR CONTROLLER
// =========================================================================
let activeCategoryFilter = "all";
let radarSearchQuery = "";
let hideCoveredTopics = true;

const radarStatTotal = document.getElementById("radar-stat-total");
const radarStatFresh = document.getElementById("radar-stat-fresh");
const radarStatCovered = document.getElementById("radar-stat-covered");
const radarStatSelected = document.getElementById("radar-stat-selected");
const existingTopicsCloud = document.getElementById("existing-topics-cloud");
const existingTopicsCount = document.getElementById("existing-topics-count");
const radarCardsGrid = document.getElementById("radar-cards-grid");
const radarEmptyState = document.getElementById("radar-empty-state");
const toggleHideCovered = document.getElementById("toggle-hide-covered");
const radarSearchInput = document.getElementById("radar-search-input");
const radarCategoryPills = document.getElementById("radar-category-pills");
const selectedTopicQueueBox = document.getElementById("selected-topic-queue-box");
const selectedQueueBadge = document.getElementById("selected-queue-badge");
const selectedTopicDetails = document.getElementById("selected-topic-details");
const btnCopyTopicPrompt = document.getElementById("btn-copy-topic-prompt");
const btnClearQueue = document.getElementById("btn-clear-queue");

function renderExistingTopicsCloud() {
  if (!existingTopicsCloud) return;
  const topics = getExistingBlogTopics(allBlogPosts);
  existingTopicsCloud.innerHTML = "";
  
  if (topics.length === 0) {
    existingTopicsCloud.innerHTML = `<span class="text-slate-500 italic">No topic labels detected yet.</span>`;
    if (existingTopicsCount) existingTopicsCount.textContent = "0 Labels";
    return;
  }

  if (existingTopicsCount) existingTopicsCount.textContent = `${topics.length} Distinct Labels`;

  topics.forEach(({ name, count }) => {
    const pill = document.createElement("span");
    pill.className = "px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700/80 text-slate-300 font-medium flex items-center gap-1.5 hover:border-slate-500 transition-colors";
    pill.innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-indigo-400"></span> ${escapeHtml(name)} <span class="text-[10px] text-slate-400 font-mono">(${count})</span>`;
    existingTopicsCloud.appendChild(pill);
  });
}

function renderSelectedQueueBox() {
  if (!selectedTopicQueueBox) return;
  const selectedIds = getSelectedTopicIds();
  const selectedTopics = TRENDING_TECH_CATALOG.filter(t => selectedIds.includes(t.id));

  if (selectedTopics.length === 0) {
    selectedTopicQueueBox.classList.add("hidden");
    return;
  }

  selectedTopicQueueBox.classList.remove("hidden");
  if (selectedQueueBadge) selectedQueueBadge.textContent = `${selectedTopics.length} In Queue`;

  const leadTopic = selectedTopics[0];
  const btnLaunchGen = document.getElementById("btn-launch-generator");
  const btnAutopilotQueue = document.getElementById("btn-launch-generator-autopilot");
  if (leadTopic) {
    if (btnLaunchGen) btnLaunchGen.href = `./generator.html?topic=${leadTopic.id}`;
    if (btnAutopilotQueue) btnAutopilotQueue.href = `./generator.html?topic=${leadTopic.id}&autopilot=true`;
  }
  if (selectedTopicDetails) {
    selectedTopicDetails.innerHTML = `
      <div class="col-span-1 md:col-span-2 space-y-2">
        <div class="flex items-center gap-2">
          <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">${escapeHtml(leadTopic.category)}</span>
          <span class="text-slate-400 font-mono text-[11px]">${escapeHtml(leadTopic.searchVolume)}</span>
          <span class="text-emerald-400 font-mono text-[11px]">${escapeHtml(leadTopic.momentum)}</span>
        </div>
        <h6 class="text-sm font-bold text-white">${escapeHtml(leadTopic.title)}</h6>
        <p class="text-slate-300 text-xs leading-relaxed">${escapeHtml(leadTopic.suggestedAngle)}</p>
        
        <div class="pt-2">
          <span class="text-[11px] font-semibold text-indigo-300 block mb-1">Recommended Outline for Engineer'sSideCorner:</span>
          <ul class="list-disc list-inside space-y-0.5 text-slate-300 text-[11px]">
            ${leadTopic.outline.map(point => `<li>${escapeHtml(point)}</li>`).join("")}
          </ul>
        </div>
      </div>

      <div class="col-span-1 p-3.5 rounded-xl bg-slate-950/60 border border-indigo-500/20 flex flex-col justify-between">
        <div>
          <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">SEO Keywords for Blogger</span>
          <div class="flex flex-wrap gap-1.5 mb-3">
            ${leadTopic.keywords.map(kw => `<span class="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-300 text-[10px] font-mono">${escapeHtml(kw)}</span>`).join("")}
          </div>
        </div>
        <button onclick="window.unselectTrendingTopic('${leadTopic.id}')" class="text-left text-[11px] text-rose-400 hover:text-rose-300 underline cursor-pointer mt-2">
          Remove this topic from queue
        </button>
      </div>
    `;
  }
}

// Gemini AI Topic Discovery Button
const btnGeminiDiscover = document.getElementById("btn-gemini-discover-topics");

if (btnGeminiDiscover) {
  btnGeminiDiscover.addEventListener("click", async () => {
    if (!isGeminiAvailable()) {
      showToast("Gemini API key is not configured.");
      return;
    }

    const origHtml = btnGeminiDiscover.innerHTML;
    btnGeminiDiscover.disabled = true;
    btnGeminiDiscover.innerHTML = `<i class="fa-solid fa-spinner animate-spin"></i> <span>Gemini Brainstorming...</span>`;

    try {
      const existingTitles = allBlogPosts.map(p => p.title);
      const newGeminiTopics = await generateTrendingTopicsWithGemini(existingTitles);
      
      if (newGeminiTopics && newGeminiTopics.length > 0) {
        addGeminiTopics(newGeminiTopics);
        renderTrendingRadar();
        showToast(`✨ Gemini discovered ${newGeminiTopics.length} fresh trending topics!`);
      } else {
        showToast("Gemini did not return any topics.");
      }
    } catch (err) {
      console.error("Gemini discovery error:", err);
      showToast("Gemini discovery notice: " + err.message);
    } finally {
      btnGeminiDiscover.disabled = false;
      btnGeminiDiscover.innerHTML = origHtml;
    }
  });
}

function renderTrendingRadar() {
  if (!radarCardsGrid) return;

  renderExistingTopicsCloud();
  renderSelectedQueueBox();

  const selectedIds = getSelectedTopicIds();
  let freshCount = 0;
  let coveredCount = 0;

  // Process all topics with overlap detection against all published posts
  const analyzedTopics = TRENDING_TECH_CATALOG.map(topic => {
    const overlap = checkTopicOverlap(topic, allBlogPosts);
    if (overlap.isCovered) {
      coveredCount++;
    } else {
      freshCount++;
    }
    return {
      ...topic,
      isCovered: overlap.isCovered,
      matchingPost: overlap.matchingPost,
      overlapReason: overlap.reason,
      isSelected: selectedIds.includes(topic.id)
    };
  });

  // Update Stats
  if (radarStatTotal) radarStatTotal.textContent = TRENDING_TECH_CATALOG.length;
  if (radarStatFresh) radarStatFresh.textContent = freshCount;
  if (radarStatCovered) radarStatCovered.textContent = coveredCount;
  if (radarStatSelected) radarStatSelected.textContent = selectedIds.length;

  // Filter topics
  const query = (radarSearchQuery || "").toLowerCase().trim();
  const filtered = analyzedTopics.filter(topic => {
    // Category filter
    if (activeCategoryFilter !== "all" && topic.category !== activeCategoryFilter) {
      return false;
    }
    // Hide covered toggle
    if (hideCoveredTopics && topic.isCovered) {
      return false;
    }
    // Search query
    if (query) {
      const matchTitle = topic.title.toLowerCase().includes(query);
      const matchDesc = topic.summary.toLowerCase().includes(query);
      const matchKeywords = topic.keywords.some(k => k.toLowerCase().includes(query));
      return matchTitle || matchDesc || matchKeywords;
    }
    return true;
  });

  radarCardsGrid.innerHTML = "";

  if (filtered.length === 0) {
    if (radarEmptyState) radarEmptyState.classList.remove("hidden");
    radarCardsGrid.classList.add("hidden");
    return;
  }

  if (radarEmptyState) radarEmptyState.classList.add("hidden");
  radarCardsGrid.classList.remove("hidden");

  filtered.forEach(topic => {
    const card = document.createElement("div");
    card.className = `p-5 rounded-2xl glass-panel relative flex flex-col justify-between transition-all duration-300 hover:translate-y-[-2px] border ${
      topic.isSelected 
        ? "border-indigo-500 shadow-lg shadow-indigo-500/20 bg-indigo-950/20" 
        : topic.isCovered 
          ? "border-rose-900/40 bg-rose-950/10 opacity-75" 
          : "border-slate-800/80 hover:border-slate-700"
    }`;

    // Status Header
    let statusBadge = "";
    if (topic.isCovered) {
      statusBadge = `
        <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-300 border border-rose-500/20 flex items-center gap-1">
          <span class="w-1.5 h-1.5 rounded-full bg-rose-400"></span> Already on Blog
        </span>
      `;
    } else if (topic.isSelected) {
      statusBadge = `
        <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1">
          ✓ In Selection Queue
        </span>
      `;
    } else {
      statusBadge = `
        <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 flex items-center gap-1">
          <span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Fresh Opportunity
        </span>
      `;
    }

    // Action button
    let actionButton = "";
    if (topic.isCovered) {
      actionButton = `
        <div class="mt-4 pt-3 border-t border-slate-800/60">
          <button disabled class="w-full py-2 px-3 rounded-xl text-xs font-semibold bg-slate-900/80 text-slate-500 border border-slate-800 cursor-not-allowed flex items-center justify-center gap-1.5">
            <svg class="w-3.5 h-3.5 text-rose-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
            </svg>
            <span>Covered (Cannot Select)</span>
          </button>
          <p class="text-[10px] text-rose-300/80 mt-1.5 leading-tight">
            ${escapeHtml(topic.overlapReason)}
          </p>
        </div>
      `;
    } else if (topic.isSelected) {
      actionButton = `
        <div class="mt-4 pt-3 border-t border-slate-800/60 flex items-center gap-2">
          <button onclick="window.unselectTrendingTopic('${topic.id}')" class="flex-1 py-2 px-3 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md cursor-pointer flex items-center justify-center gap-1.5 transition-colors">
            <span>✓ Selected (Click to Remove)</span>
          </button>
        </div>
      `;
    } else {
      actionButton = `
        <div class="mt-4 pt-3 border-t border-slate-800/60 flex flex-col sm:flex-row items-center gap-2">
          <button onclick="window.selectTrendingTopic('${topic.id}')" class="w-full sm:flex-1 py-2 px-3 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-900 border border-slate-700/80 cursor-pointer flex items-center justify-center gap-1.5 transition-colors">
            <span>Select Queue</span>
          </button>
          <a href="./generator.html?topic=${topic.id}&autopilot=true" class="w-full sm:flex-1 btn-primary py-2 px-3 rounded-xl text-xs font-bold text-white cursor-pointer flex items-center justify-center gap-1.5 shadow-lg bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-400 hover:to-indigo-500">
            <svg class="w-3 h-3 text-amber-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
            </svg>
            <span>1-Click Publish</span>
          </a>
        </div>
      `;
    }

    const thumbImgHtml = topic.thumbnailUrl ? `
      <div class="mb-3.5 rounded-xl overflow-hidden aspect-[16/9] w-full bg-slate-900 border border-slate-800/80 relative group shadow-md">
        <img src="${topic.thumbnailUrl}" alt="${escapeHtml(topic.title)}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy">
        <span class="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/80 backdrop-blur-md text-[9px] font-mono text-indigo-300 border border-indigo-500/30 font-bold">16:9 AI Visual</span>
      </div>
    ` : '';

    card.innerHTML = `
      <div>
        ${thumbImgHtml}
        <div class="flex items-center justify-between gap-2 mb-2.5">
          <span class="text-[10px] font-bold uppercase tracking-wider text-indigo-400 font-mono">${escapeHtml(topic.category)}</span>
          ${statusBadge}
        </div>

        <h5 class="text-sm font-bold text-white leading-snug mb-2 hover:text-indigo-300 transition-colors">
          ${escapeHtml(topic.title)}
        </h5>

        <p class="text-xs text-slate-400 leading-relaxed line-clamp-3 mb-3">
          ${escapeHtml(topic.summary)}
        </p>

        <div class="flex flex-wrap items-center gap-2 text-[10px] font-mono text-slate-400 mb-2">
          <span class="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">${escapeHtml(topic.searchVolume)}</span>
          <span class="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-emerald-400">${escapeHtml(topic.momentum)}</span>
          <span class="px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 font-sans font-semibold">${escapeHtml(topic.badge)}</span>
        </div>
      </div>

      ${actionButton}
    `;

    radarCardsGrid.appendChild(card);
  });
}

// Global window functions for onclick handlers
window.selectTrendingTopic = function(topicId) {
  const res = selectTopic(topicId, allBlogPosts);
  if (!res.success) {
    alert(res.message);
  }
  renderTrendingRadar();
};

window.unselectTrendingTopic = function(topicId) {
  unselectTopic(topicId);
  renderTrendingRadar();
};

// Event Listeners for Trending Radar
if (radarCategoryPills) {
  radarCategoryPills.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-cat]");
    if (!btn) return;
    
    radarCategoryPills.querySelectorAll("button").forEach(b => {
      b.className = "radar-pill px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800/80 hover:bg-slate-700 text-slate-300 cursor-pointer transition-all";
    });
    
    btn.className = "radar-pill active px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-600 text-white cursor-pointer transition-all";
    activeCategoryFilter = btn.getAttribute("data-cat");
    renderTrendingRadar();
  });
}

if (toggleHideCovered) {
  toggleHideCovered.addEventListener("change", (e) => {
    hideCoveredTopics = e.target.checked;
    renderTrendingRadar();
  });
}

if (radarSearchInput) {
  radarSearchInput.addEventListener("input", (e) => {
    radarSearchQuery = e.target.value;
    renderTrendingRadar();
  });
}

if (btnClearQueue) {
  btnClearQueue.addEventListener("click", () => {
    if (confirm("Clear all selected topics from the queue?")) {
      localStorage.removeItem("esc_selected_trending_topics");
      renderTrendingRadar();
    }
  });
}

if (btnCopyTopicPrompt) {
  btnCopyTopicPrompt.addEventListener("click", () => {
    const selectedIds = getSelectedTopicIds();
    const selectedTopics = TRENDING_TECH_CATALOG.filter(t => selectedIds.includes(t.id));
    if (selectedTopics.length === 0) return;
    const t = selectedTopics[0];

    const promptText = `Write a comprehensive, engaging, high-authority engineering blog post for "Engineer'sSideCorner" (https://engineersidecorner.blogspot.com/).

Topic: ${t.title}
Niche: ${t.category}
Primary Target Audience: Software engineers, architects, AI practitioners, and technology builders.

Key Angle:
${t.suggestedAngle}

Target SEO Keywords:
${t.keywords.join(", ")}

Required Article Outline:
${t.outline.map((p, i) => `${i + 1}. ${p}`).join("\n")}

Styling & Tone Requirements:
- Tone: Highly informative, visionary yet grounded in concrete engineering details.
- Include practical architectural explanations, trade-offs, and best practices.
- Format with clean Markdown headers (H2, H3), bullet points, and code/architecture snippets where appropriate.`;

    navigator.clipboard.writeText(promptText).then(() => {
      const origText = btnCopyTopicPrompt.innerHTML;
      btnCopyTopicPrompt.innerHTML = `<span class="text-emerald-300">✓ Prompt Copied to Clipboard!</span>`;
      setTimeout(() => {
        btnCopyTopicPrompt.innerHTML = origText;
      }, 2500);
    });
  });
}
