# HubSpot API Usage Tracker

Monitor your HubSpot API calls over time with a Cloudflare Worker and beautiful dashboard.

## ✅ Deployment Status

Your Cloudflare Worker is **live** at:
```
https://api-tracker.eturner-6f6.workers.dev
```

## Features

- **Track API Usage**: Captures your daily HubSpot API call totals
- **90-Day History**: View usage trends over the last 90 days
- **Beautiful Dashboard**: Interactive Chart.js visualization with stats
- **Easy Setup**: Simple cron-based scheduling

## Quick Start

### 1. Get Your HubSpot Private App Token

1. Go to [HubSpot Developer Portal](https://developers.hubspot.com/l/personal-apps)
2. Create a new **Private App**
3. Give it scope: `crm.objects.contacts.read` (minimal permissions)
4. Copy your **Private App Token**

### 2. Setup Automatic Tracking (Every 30 Minutes)

Choose one:

#### ✨ Option A: EasyCron.com (Easiest)
1. Go to [easycron.com](https://www.easycron.com)
2. Sign up (free)
3. Click "Add a Cron Job"
4. Enter:
   - **URL**: `https://api-tracker.eturner-6f6.workers.dev/sync?key=YOUR_HUBSPOT_KEY`
   - **HTTP Method**: POST
   - **Schedule**: Every 30 minutes
5. Save and enable

#### Option B: GitHub Actions (No extra account needed)
1. Create a new GitHub repository
2. Go to **Settings → Secrets and variables → Actions**
3. Add two secrets:
   - `WORKER_URL`: `https://api-tracker.eturner-6f6.workers.dev`
   - `HUBSPOT_KEY`: Your HubSpot Private App token
4. Create `.github/workflows/track-api.yml`:
```yaml
name: Track HubSpot API Usage
on:
  schedule:
    - cron: '*/30 * * * *'
jobs:
  track:
    runs-on: ubuntu-latest
    steps:
      - name: Track API Usage
        run: |
          curl -X POST "${{ secrets.WORKER_URL }}/sync?key=${{ secrets.HUBSPOT_KEY }}"
```
5. Push to GitHub

### 3. Test It Works

Replace `YOUR_HUBSPOT_KEY`:
```bash
curl -X POST "https://api-tracker.eturner-6f6.workers.dev/sync?key=YOUR_HUBSPOT_KEY"
```

Should respond with: `Synced`

### 4. Host Your Dashboard

Pick one:

#### GitHub Pages
1. Create a GitHub repository
2. Upload `index.html` to the root
3. Go to **Settings → Pages**
4. Set source to `main` branch
5. Access at: `https://yourusername.github.io/repo-name`

#### Cloudflare Pages
1. Connect your GitHub repo to Cloudflare Pages
2. Leave everything as default
3. It'll auto-deploy

#### Netlify / Vercel / Any Host
Just upload `index.html` anywhere

## API Endpoints

- `GET /data` → Get 90 days of usage data (JSON)
- `GET /current` → Get today's usage (JSON)
- `POST /sync?key=YOUR_HUBSPOT_KEY` → Manually capture usage

## How It Works

1. Every 30 minutes, your cron service POSTs to `/sync`
2. The Cloudflare Worker calls HubSpot API
3. It reads the rate limit headers to determine usage
4. Stores the daily total in KV storage
5. Your dashboard fetches and visualizes the data

## Data Structure

```json
{
  "date": "2026-01-27",
  "callsUsed": 450,
  "dailyLimit": 50000,
  "timestamp": 1674816000000
}
```

## Troubleshooting

**No data on dashboard?**
- Set up the cron job first (Step 2)
- Test manually: `curl -X POST "https://api-tracker.eturner-6f6.workers.dev/sync?key=YOUR_KEY"`
- Wait 5 minutes and refresh dashboard

**Chart not loading?**
- Open DevTools (F12) → Console
- Look for error messages
- Verify worker URL in `index.html` is: `https://api-tracker.eturner-6f6.workers.dev`

**Wrong HubSpot key?**
- Create a new Private App in HubSpot
- Make sure it has at least the `crm.objects.contacts.read` scope

## Local Development

```bash
# Install dependencies
npm install

# Test locally
wrangler dev

# Deploy updates
wrangler deploy
```

## Under the Hood

- **Cloudflare Worker**: Serverless function that captures HubSpot rate limits
- **Cloudflare KV**: Free global key-value storage for your data
- **Chart.js**: Beautiful, responsive charting library
- **Zero cost**: Runs on Cloudflare's free tier

## License

MIT

## Features

- **Automatic Tracking**: Captures API usage every 30 minutes via Cloudflare scheduled triggers
- **90-Day History**: View usage trends over the last 90 days
- **Daily Totals**: Shows total API calls made each day
- **Real-Time Stats**: Current day usage, average, and peak usage metrics
- **Beautiful Dashboard**: Interactive Chart.js visualization

## Setup Instructions

### 1. Prerequisites

- Cloudflare account with Workers enabled
- HubSpot Private App with API access
- GitHub account (optional, for GitHub Pages hosting)

### 2. Create HubSpot Private App

1. Go to [HubSpot Developer Portal](https://developers.hubspot.com/docs/api/private-apps)
2. Create a new Private App
3. Give it minimal scopes (just need API access to read rate limits)
4. Copy the private app access token (you'll need this)

### 3. Deploy Cloudflare Worker

1. Install Wrangler CLI:
   ```bash
   npm install -g wrangler
   ```

2. Authenticate with Cloudflare:
   ```bash
   wrangler login
   ```

3. Update `wrangler.toml`:
   - Set `account_id` to your Cloudflare account ID
   - For production, set `zone_id` and update the `route`

4. Create a KV namespace:
   ```bash
   wrangler kv:namespace create USAGE_DATA
   wrangler kv:namespace create USAGE_DATA --preview
   ```

5. Copy the namespace IDs from the output and update `wrangler.toml`:
   ```toml
   [[kv_namespaces]]
   binding = "USAGE_DATA"
   id = "your_namespace_id"
   preview_id = "your_preview_id"
   ```

6. Add your HubSpot API key as a secret:
   ```bash
   wrangler secret put HUBSPOT_API_KEY
   # Paste your HubSpot Private App token when prompted
   ```

7. Deploy:
   ```bash
   wrangler deploy
   ```

### 4. Update Dashboard URL

In `index.html`, find the line:
```javascript
const workerUrl = 'https://api-tracker-prod.yourdomain.com'; // Update this!
```

Replace with your actual Cloudflare Worker URL (shown after deployment).

### 5. Deploy Dashboard (GitHub Pages)

1. Create a GitHub repository
2. Enable GitHub Pages for the repo (Settings → Pages)
3. Set the source to `main` branch (or your branch)
4. Upload the `index.html` file to the repo root

## Environment Variables

Set these as Cloudflare secrets:

- `HUBSPOT_API_KEY`: Your HubSpot Private App access token

## API Endpoints

The Cloudflare Worker exposes these endpoints:

- `GET /data` - Get 90 days of usage data
- `GET /current` - Get today's usage
- `POST /sync?key=YOUR_API_KEY` - Manually trigger a sync

## Data Structure

Each daily record contains:

```json
{
  "date": "2026-01-27",
  "callsUsed": 450,
  "dailyLimit": 50000,
  "timestamp": 1674816000000
}
```

## How It Works

1. **Every 30 minutes**: Cloudflare Worker makes a lightweight API call to HubSpot
2. **Rate Limit Headers**: Extracts `X-HubSpot-RateLimit-Daily` and `X-HubSpot-RateLimit-Daily-Remaining`
3. **Calculates Usage**: `callsUsed = dailyLimit - remaining`
4. **Stores in KV**: Saves the maximum daily usage to Cloudflare KV with date as key
5. **Dashboard Reads**: Frontend fetches 90 days of data and renders interactive chart

## Notes

- The worker checks rate limits by making a real API call (minimal overhead)
- Daily data is stored with the date as the key (one record per day)
- If multiple checks happen in a day, it keeps the maximum calls used
- Data is stored in Cloudflare KV, which has a free tier for small datasets
- The dashboard refreshes every 5 minutes automatically

## Troubleshooting

**No data showing?**
- Wait for the first scheduled check (up to 30 minutes)
- Check Cloudflare Worker logs: `wrangler tail`
- Verify your HubSpot API key is set correctly

**Chart not loading?**
- Check browser console for CORS errors
- Ensure the worker URL in `index.html` is correct
- Verify CORS headers are being sent by the worker

**Rate limit not updating?**
- The worker runs on UTC schedule. Check your timezone offset.
- HubSpot resets daily at midnight UTC

## License

MIT
