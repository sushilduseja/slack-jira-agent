#!/bin/bash

# Test Slack Webhook Locally
# 
# Simulates Slack webhook requests for local testing
# Requires: curl, jq (optional, for JSON pretty-print)

WEBHOOK_URL="${1:-http://localhost:3000/webhook}"
MESSAGE="${2:-Test message from Slack}"

# Slack event payload structure
generate_payload() {
  local message="$1"
  local user_id="U12345678"
  local channel_id="C12345678"
  local timestamp=$(date +%s)
  
  cat <<EOF
{
  "token": "verification_token",
  "team_id": "T12345678",
  "event_id": "Ev123456789",
  "event": {
    "type": "app_mention",
    "user": "$user_id",
    "text": "<@U87654321> $message",
    "ts": "$timestamp.000100",
    "channel": "$channel_id",
    "event_ts": "$timestamp.000100"
  },
  "type": "event_callback",
  "event_time": $timestamp
}
EOF
}

# Generate signature for verification
generate_signature() {
  local timestamp="$1"
  local body="$2"
  local signing_secret="${SLACK_SIGNING_SECRET:-test_secret}"
  
  local base_string="v0:${timestamp}:${body}"
  
  # HMAC-SHA256
  echo "v0=$(echo -n "$base_string" | openssl dgst -sha256 -hmac "$signing_secret" | cut -d' ' -f2)"
}

echo "🔍 Slack Webhook Test"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Webhook URL: $WEBHOOK_URL"
echo "Message: $MESSAGE"
echo ""

# Generate payload
PAYLOAD=$(generate_payload "$MESSAGE")
TIMESTAMP=$(date +%s)
SIGNATURE=$(generate_signature "$TIMESTAMP" "$PAYLOAD")

echo "📤 Sending webhook request..."
echo ""

# Send webhook
response=$(curl -s -w "\n%{http_code}" \
  -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -H "X-Slack-Request-Timestamp: $TIMESTAMP" \
  -H "X-Slack-Signature: $SIGNATURE" \
  -d "$PAYLOAD")

# Parse response
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | head -n-1)

echo "✓ Response Status: $http_code"
echo ""
echo "📋 Response Body:"
echo "$body" | jq '.' 2>/dev/null || echo "$body"

echo ""
if [ "$http_code" = "200" ]; then
  echo "✅ Webhook test successful!"
else
  echo "⚠️  Unexpected status code: $http_code"
fi
