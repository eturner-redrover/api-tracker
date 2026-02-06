#!/bin/bash

# Quick HubSpot API Usage Checker
# Run this anytime to see current usage without updating the dashboard
# Usage: ./check-usage.sh YOUR_HUBSPOT_KEY

echo "🔍 Checking HubSpot API Usage..."
echo ""

# Get API key from argument or prompt
API_KEY="$1"

if [ -z "$API_KEY" ]; then
    echo "💡 Usage: ./check-usage.sh YOUR_HUBSPOT_KEY"
    echo ""
    read -sp "🔑 Enter your HubSpot API key: " API_KEY
    echo ""
    echo ""
fi

if [ -z "$API_KEY" ]; then
    echo "❌ Error: API key is required"
    exit 1
fi

# Make a minimal API call to HubSpot to get usage headers
RESPONSE=$(curl -s -i "https://api.hubapi.com/crm/v3/objects/contacts?limit=1" \
    -H "Authorization: Bearer $API_KEY" 2>&1)

# Extract the rate limit headers
DAILY_LIMIT=$(echo "$RESPONSE" | grep -i "x-hubspot-ratelimit-daily:" | awk '{print $2}' | tr -d '\r')
REMAINING=$(echo "$RESPONSE" | grep -i "x-hubspot-ratelimit-daily-remaining:" | awk '{print $2}' | tr -d '\r')

if [ -z "$DAILY_LIMIT" ] || [ -z "$REMAINING" ]; then
    echo "❌ Error: Could not fetch usage data from HubSpot"
    echo "Check if your API key is valid"
    exit 1
fi

# Calculate used calls
USED=$((DAILY_LIMIT - REMAINING))
PERCENTAGE=$((USED * 100 / DAILY_LIMIT))

# Display results
echo "📊 Current API Usage (Today)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Used:      $USED / $DAILY_LIMIT calls"
echo "Remaining: $REMAINING calls"
echo "Usage:     $PERCENTAGE%"
echo ""

# Color-coded status
if [ $PERCENTAGE -lt 50 ]; then
    echo "✅ Status: Healthy (under 50%)"
elif [ $PERCENTAGE -lt 80 ]; then
    echo "⚠️  Status: Moderate (50-80%)"
else
    echo "🔴 Status: High (over 80%)"
fi

echo ""
echo "💡 Tip: This check doesn't update your dashboard"
