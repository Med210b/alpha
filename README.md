# 4lfa - AI Companion for Najla

This is a personalized AI companion app built with React, Vite, and the Gemini API.

## How to Deploy for FREE on GitHub Pages

This repository is already configured to automatically deploy to GitHub Pages for free! Just follow these steps:

### 1. Push to GitHub
Upload this code to a new public or private repository on your GitHub account.

### 2. Set the Gemini API Key Secret
For the AI to work, it needs your Gemini API Key. Since this is a static site, the key is securely injected during the build process.

1. Go to your GitHub repository.
2. Click on **Settings** > **Secrets and variables** > **Actions**.
3. Click **New repository secret**.
4. Name: `GEMINI_API_KEY`
5. Secret: Paste your Gemini API key here (get it from [Google AI Studio](https://aistudio.google.com/)).
6. Click **Add secret**.

### 3. Enable GitHub Pages
1. Go to **Settings** > **Pages**.
2. Under **Build and deployment**, change the **Source** to **GitHub Actions**.

### 4. Trigger the Deployment
1. Go to the **Actions** tab in your repository.
2. Click on the **Deploy to GitHub Pages** workflow on the left.
3. Click **Run workflow** and wait for it to finish.
4. Your app will be live at `https://[your-username].github.io/[repository-name]/`!

## Features
- **100% Free Hosting:** Uses GitHub Pages.
- **Voice Input & Output:** Uses built-in browser Web Speech API (Free).
- **Sound Effects:** Uses built-in Web Audio API (Free).
- **History:** Saves chats locally in the browser (Free).
- **Graceful Error Handling:** Warns you if the API key is missing or quota is exceeded.
