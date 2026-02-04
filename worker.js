/**
 * HubSpot API Usage Tracker - Cloudflare Worker
 * 
 * This worker captures HubSpot API usage data once daily (at end of day)
 * to minimize KV storage writes while still tracking usage trends.
 * 
 * Deploy: wrangler deploy
 */

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      if (path === '/data') {
        // Get 90 days of historical data
        const data = await get90DaysData(env);
        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (path === '/current') {
        // Get current day's live usage (doesn't write to KV)
        const key = url.searchParams.get('key');
        if (!key) {
          return new Response('Missing key parameter', { status: 400, headers: corsHeaders });
        }
        const usage = await fetchCurrentUsage(key);
        return new Response(JSON.stringify(usage), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (path === '/sync' && request.method === 'POST') {
        // Manual sync - captures current usage to KV
        const key = url.searchParams.get('key');
        if (!key) {
          return new Response('Missing key parameter', { status: 400, headers: corsHeaders });
        }
        await captureUsage(env, key);
        return new Response('Synced', { headers: corsHeaders });
      }

      if (path === '/daily-capture' && request.method === 'POST') {
        // End-of-day capture - designed to be called once daily
        // This stores the final daily usage to the historical graph
        const key = url.searchParams.get('key');
        if (!key) {
          return new Response('Missing key parameter', { status: 400, headers: corsHeaders });
        }
        await captureEndOfDayUsage(env, key);
        return new Response('Daily usage captured', { headers: corsHeaders });
      }

      return new Response('Not found', { status: 404, headers: corsHeaders });
    } catch (error) {
      return new Response(`Error: ${error.message}`, { status: 500, headers: corsHeaders });
    }
  },

  // Scheduled trigger - runs once daily at end of HubSpot's API day
  // HubSpot resets at 9 AM CST, so we capture at 8:55 AM CST (before reset)
  async scheduled(event, env, ctx) {
    const hubspotKey = env.HUBSPOT_KEY;
    if (!hubspotKey) {
      console.error('HUBSPOT_KEY environment variable not set');
      return;
    }
    
    await captureEndOfDayUsage(env, hubspotKey);
    console.log('Daily usage captured via scheduled trigger');
  },
};

/**
 * Fetches current API usage from HubSpot (read-only, no KV write)
 */
async function fetchCurrentUsage(hubspotKey) {
  const response = await fetch('https://api.hubapi.com/crm/v3/objects/contacts?limit=1', {
    headers: {
      Authorization: `Bearer ${hubspotKey}`,
    },
  });

  const callsUsed = parseInt(response.headers.get('X-HubSpot-RateLimit-Daily-Remaining') || '0');
  const dailyLimit = parseInt(response.headers.get('X-HubSpot-RateLimit-Daily') || '500000');
  const used = dailyLimit - callsUsed;

  return {
    date: getTodayCST(),
    callsUsed: used,
    dailyLimit: dailyLimit,
    timestamp: Date.now(),
  };
}

/**
 * Captures end-of-day usage - writes to KV only once per day
 * This is the key function that minimizes KV writes
 */
async function captureEndOfDayUsage(env, hubspotKey) {
  const usage = await fetchCurrentUsage(hubspotKey);
  const dateKey = `usage:${usage.date}`;
  
  // Store this day's final usage
  await env.USAGE_DATA.put(dateKey, JSON.stringify(usage));
  
  // Clean up old data (keep 90 days)
  await cleanupOldData(env);
  
  return usage;
}

/**
 * Legacy sync function - still writes to KV (for backward compatibility)
 * Consider using daily-capture instead to reduce KV writes
 */
async function captureUsage(env, hubspotKey) {
  return captureEndOfDayUsage(env, hubspotKey);
}

/**
 * Gets today's date in CST timezone
 * HubSpot's API limits reset at 9 AM CST
 */
function getTodayCST() {
  const now = new Date();
  // CST is UTC-6
  const cstOffset = -6 * 60;
  const cstTime = new Date(now.getTime() + (cstOffset * 60 * 1000) + (now.getTimezoneOffset() * 60 * 1000));
  
  // If before 9 AM CST, count as previous day (HubSpot resets at 9 AM)
  if (cstTime.getHours() < 9) {
    cstTime.setDate(cstTime.getDate() - 1);
  }
  
  return cstTime.toISOString().split('T')[0];
}

/**
 * Retrieves 90 days of historical usage data
 */
async function get90DaysData(env) {
  const data = [];
  const today = new Date();

  for (let i = 89; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    const key = `usage:${dateStr}`;

    const stored = await env.USAGE_DATA.get(key);
    if (stored) {
      data.push(JSON.parse(stored));
    }
  }

  return data;
}

/**
 * Removes data older than 90 days to keep KV storage clean
 */
async function cleanupOldData(env) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - 91);
  const cutoffKey = `usage:${cutoffDate.toISOString().split('T')[0]}`;

  // List and delete old keys
  const list = await env.USAGE_DATA.list({ prefix: 'usage:' });
  for (const key of list.keys) {
    if (key.name < cutoffKey) {
      await env.USAGE_DATA.delete(key.name);
    }
  }
}
