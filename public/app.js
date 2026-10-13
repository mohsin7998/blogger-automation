/**
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
    }
  } catch (error) {
    console.warn("Live feed sync fallback to cache:", error);
    // Even if both live attempts fail, the cache remains cleanly rendered!
    statPostsCount.textContent = `${allBlogPosts.length} Posts`;
    postsBadgeCount.textContent = allBlogPosts.length;
    filterAndRenderPosts();
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

    // Google Sign-In
    btnGoogleLogin.addEventListener("click", async () => {
      clearError();
      try {
        await signInWithPopup(auth, googleProvider);
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
