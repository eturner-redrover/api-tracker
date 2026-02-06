#!/usr/bin/env python3
"""
Quick HubSpot API Usage Checker
Run this anytime to see current usage without updating the dashboard
"""

import os
import requests
from pathlib import Path

# Load .env file
env_path = Path(__file__).parent / '.env'
if env_path.exists():
    with open(env_path) as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                key, value = line.split('=', 1)
                os.environ[key.strip()] = value.strip()

# Get API key from environment
API_KEY = os.getenv('HUBSPOT_API_KEY')

if not API_KEY:
    print("❌ Error: HUBSPOT_API_KEY not found in .env file")
    print("Create a .env file with: HUBSPOT_API_KEY=your_key_here")
    exit(1)

print("🔍 Checking HubSpot API Usage...")
print()

# Make a minimal API call to get usage headers
try:
    response = requests.get(
        'https://api.hubapi.com/crm/v3/objects/contacts?limit=1',
        headers={'Authorization': f'Bearer {API_KEY}'}
    )
    
    # Extract rate limit headers
    daily_limit = int(response.headers.get('X-HubSpot-RateLimit-Daily', 0))
    remaining = int(response.headers.get('X-HubSpot-RateLimit-Daily-Remaining', 0))
    
    if daily_limit == 0 or remaining == 0:
        print("❌ Error: Could not fetch usage data from HubSpot")
        print("Check if your API key is valid")
        exit(1)
    
    # Calculate usage
    used = daily_limit - remaining
    percentage = (used * 100) // daily_limit
    
    # Display results
    print("📊 Current API Usage (Today)")
    print("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    print(f"Used:      {used:,} / {daily_limit:,} calls")
    print(f"Remaining: {remaining:,} calls")
    print(f"Usage:     {percentage}%")
    print()
    
    # Color-coded status
    if percentage < 50:
        print("✅ Status: Healthy (under 50%)")
    elif percentage < 80:
        print("⚠️  Status: Moderate (50-80%)")
    else:
        print("🔴 Status: High (over 80%)")
    
    print()
    print("💡 Tip: This check doesn't update your dashboard")
    
except requests.exceptions.RequestException as e:
    print(f"❌ Error making request: {e}")
    exit(1)
