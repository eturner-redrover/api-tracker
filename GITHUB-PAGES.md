# GitHub Pages Deployment Instructions

Your dashboard is ready to deploy! Here's the step-by-step process:

## Step 1: Create GitHub Repository

1. Go to https://github.com/new
2. Repository name: `api-tracker` (or whatever you prefer)
3. Description: "HubSpot API Usage Tracker Dashboard"
4. Choose: **Public** (required for GitHub Pages free tier)
5. Click "Create repository"

## Step 2: Push Your Code

Run these commands in your terminal:

```bash
cd /Users/ericturner/Documents/api-tracker-pages
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/api-tracker.git
git push -u origin main
```

Replace `YOUR_USERNAME` with your actual GitHub username.

## Step 3: Enable GitHub Pages

1. Go to your repository on GitHub
2. Click **Settings**
3. Scroll down to **Pages** section
4. Under "Source", select **Deploy from a branch**
5. Select: `main` branch (or `master` if that's what you used)
6. Select folder: `/ (root)`
7. Click **Save**

## Step 4: Access Your Dashboard

After a few seconds, you'll see a message like:
> "Your site is published at https://YOUR_USERNAME.github.io/api-tracker"

Click that link! Your dashboard is live.

## Step 5: Update Worker URL (if needed)

If your dashboard shows "Error loading data":

1. Open `index.html` in your browser's DevTools (F12)
2. Check the Console for the actual error
3. If it's a CORS or URL issue, you may need to update the worker URL

The worker URL should be: `https://api-tracker.eturner-6f6.workers.dev`

## Done! 🎉

Your dashboard is now hosted on GitHub Pages for free, and it will:
- Fetch 90 days of API usage data from your Cloudflare Worker
- Display a beautiful interactive chart
- Auto-refresh every 5 minutes

Next: Set up your cron job (EasyCron or GitHub Actions) to capture data every 30 minutes!
