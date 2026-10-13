# Engineer\'sSideCorner — Admin Dashboard

A lightweight, modern, glassmorphic Single Page Application (SPA) designed as an administrative dashboard for the **[Engineer\'sSideCorner](https://engineersidecorner.blogspot.com/)** publication.

Built to run entirely on **Firebase Hosting (Spark Free Tier)** with **Firebase Authentication (v10 Modular Web SDK)**, requiring zero server maintenance or runtime compute costs.

---

## 🚀 Features

- **Trending Topics Radar**: Curated tech & engineering topic recommendations with automated deduplication against existing published blog posts (prevents duplicate topic coverage).
- **Zero-Cost Serverless Hosting**: Designed 100% for the Firebase Spark free plan.
- **Secure Authentication**: Supports both **Google Sign-In** and **Email/Password** authentication.
- **Clean Modern UI**: Dark-mode aesthetic featuring Tailwind CSS, glassmorphism, responsive grid layouts, and micro-interactions.
- **Instant Redirection**: Fast access link and verified metadata directly to the live blog on Blogger (`https://engineersidecorner.blogspot.com/`).
- **No Build Tools Required**: Pure HTML5, Vanilla JavaScript (ES Modules), and modern CSS.

---

## 📁 Project Structure

```text
D:\blogger-automation\
├── .gitignore                    # Protects private credentials & environment configs
├── firebase.json                 # Firebase Hosting configuration & SPA rewrite rules
├── modern-tech-theme.xml         # Modern 4-column Blogger template XML with Dark Mode
├── blogger-theme-enhancement.css # Modular CSS patches & widget cleanup
├── README.md                     # Setup, local testing, and deployment guide
└── public/
    ├── index.html                # Main SPA interface (Tailwind CSS + Google Fonts)
    ├── app.js                    # Admin controller & live Blogger feed integration
    ├── trending-topics.js        # Trending topic radar, deduplication & queue logic
    ├── firebase-config.example.js# Safe credential template for GitHub
    ├── styles.css                # Glassmorphic dark styling & ambient animations
    └── theme-preview.html        # Interactive theme preview with live articles
```

---

## 🛠️ Step-by-Step Setup Guide

### 1. Create Firebase Project (Free Tier)
1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Click **Add project** and enter a project name (e.g., `engineersidecorner-admin`).
3. (Optional) Disable Google Analytics if not needed, then click **Create project**.
4. Your project will automatically start on the **Spark (No-cost)** plan.

### 2. Enable Authentication Providers
1. In the Firebase Console, navigate to **Build** > **Authentication**.
2. Click **Get Started**.
3. Under the **Sign-in method** tab:
   - **Google**: Click Google, toggle **Enable**, select your project support email, and click **Save**.
   - **Email/Password**: Click Email/Password, toggle **Enable**, and click **Save**.
4. Under the **Settings** tab > **Authorized domains**:
   - Ensure `localhost` and your Firebase Hosting domain (`<project-id>.web.app`) are listed.

### 3. Add a Web App & Copy Credentials
1. Go to **Project Settings** (gear icon in the top left) > **General**.
2. Under **Your apps**, click the **Web icon (`</>`)**.
3. Register the app with nickname `Engineer'sSideCorner Web`.
4. Copy the values inside `firebaseConfig`.

### 4. Insert Credentials into `public/app.js`
Open `public/app.js` and replace the placeholder configuration block:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef..."
};
```

Update `.firebaserc` with your Firebase project ID:
```json
{
  "projects": {
    "default": "your-project-id"
  }
}
```

---

## 💻 Local Testing

You can run the app locally using the Firebase CLI emulator:

```powershell
# In D:\blogger-automation
npx -y firebase-tools emulators:start --only hosting
```
Or with `firebase serve`:
```powershell
npx -y firebase-tools serve --only hosting
```

Open your browser to:
```
http://localhost:5000
```

---

## 🚢 Deploy to Firebase Hosting

When you are ready to publish:

1. **Log into Firebase via CLI** (if not already logged in):
   ```powershell
   npx -y firebase-tools login
   ```

2. **Deploy only hosting**:
   ```powershell
   npx -y firebase-tools deploy --only hosting
   ```

3. Your dashboard will be live at:
   - `https://<your-project-id>.web.app`
   - `https://<your-project-id>.firebaseapp.com`
