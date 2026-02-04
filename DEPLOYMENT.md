# 🚀 API Tracker - Deployment Summary

## What's Live Now

✅ **Cloudflare Worker**: https://api-tracker.eturner-6f6.workers.dev  
✅ **KV Storage**: Ready to store 90 days of data  
✅ **Dashboard**: index.html (ready to deploy anywhere)

## Your Next Steps

### Step 1: Setup Automatic Tracking (Once Daily)

The worker now captures usage **once daily at 8:55 AM CST** (just before HubSpot resets at 9 AM CST). This minimizes KV writes while still tracking daily usage trends.

**Option A - Cloudflare Scheduled Triggers (Recommended)**
1. Set your HubSpot key as a secret:
   ```bash
   wrangler secret put HUBSPOT_KEY
   ```
2. Deploy the worker with the cron trigger:
   ```bash
   wrangler deploy
   ```
3. The worker will automatically capture usage daily at 8:55 AM CST

**Option B - External Cron (EasyCron or GitHub Actions)**

If you prefer external scheduling, call the `/daily-capture` endpoint once per day:

*EasyCron:*
1. Go to https://www.easycron.com
2. Add a cron job:
   - URL: `https://api-tracker.eturner-6f6.workers.dev/daily-capture?key=YOUR_HUBSPOT_KEY`
   - HTTP Method: POST
   - Schedule: `55 14 * * *` (8:55 AM CST / 2:55 PM UTC)

*GitHub Actions:*
```yaml
name: Capture Daily API Usage
on:
  schedule:
    - cron: '55 14 * * *'  # 8:55 AM CST (before HubSpot's 9 AM reset)
jobs:
  capture:
    runs-on: ubuntu-latest
    steps:
      - run: curl -X POST "${{ secrets.WORKER_URL }}/daily-capture?key=${{ secrets.HUBSPOT_KEY }}"
```

### Step 2: Test It Works

```bash
curl -X POST "https://api-tracker.eturner-6f6.workers.dev/daily-capture?key=YOUR_HUBSPOT_KEY"
```

Should respond with: `Daily usage captured`

### Step 3: Deploy Your Dashboard

Upload `index.html` to:
- GitHub Pages
- Cloudflare Pages
- Netlify
- Vercel
- Or any static host

### Step 4: View Your Data

Once the daily capture is set up, you'll get one data point per day showing your total API usage. View your dashboard to see the 90-day trend!

## Testing Data Capture

```bash
# Get current live usage (doesn't write to KV)
curl "https://api-tracker.eturner-6f6.workers.dev/current?key=YOUR_HUBSPOT_KEY"

# Get 90 days of historical data
curl https://api-tracker.eturner-6f6.workers.dev/data

# Manually capture today's usage (writes to KV)
curl -X POST "https://api-tracker.eturner-6f6.workers.dev/daily-capture?key=YOUR_HUBSPOT_KEY"
```

## Why Once Daily?

Cloudflare KV free tier has write limits. Capturing once daily instead of every 30 minutes:
- **Before**: ~48 writes/day → Uses KV quota quickly
- **Now**: 1 write/day → Stays well within free tier limits

The daily capture happens at 8:55 AM CST, just before HubSpot resets API limits at 9 AM CST, so you capture the maximum usage for each day.

## Cost

**FREE** - Runs entirely on Cloudflare's free tier + free dashboard hosting

## Need Help?

- Check README.md for detailed documentation
- View worker logs: `wrangler tail`
