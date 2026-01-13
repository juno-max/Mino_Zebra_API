#!/bin/bash
# Test script for Mino Zebra API

set -e

echo "================================"
echo "Testing Mino Zebra API"
echo "================================"
echo ""

# Check if server is running
echo "1. Testing health endpoint..."
HEALTH=$(curl -s http://localhost:3000/health)
echo "$HEALTH" | jq .
echo "✓ Health check passed"
echo ""

# Create a quote request
echo "2. Creating quote request..."
RESPONSE=$(curl -s -X POST http://localhost:3000/api/quotes \
  -H "Content-Type: application/json" \
  -d '{
    "vin": "12389adsfjalkdsf1",
    "employmentStatus": "EMPLOYED",
    "educationLevel": "BACHELORS",
    "phone": "555-555-5555",
    "policyStartDate": "2025-12-15",
    "mailingAddress": "321 main street",
    "isMailingSameAsGaraging": true
  }')

echo "$RESPONSE" | jq .
RUN_ID=$(echo "$RESPONSE" | jq -r .runId)
echo "✓ Quote request created with runId: $RUN_ID"
echo ""

# Stream updates for 20 seconds
echo "3. Streaming quote updates (20 seconds)..."
echo "Press Ctrl+C to stop early"
curl -N --max-time 20 "http://localhost:3000/api/quotes/$RUN_ID/stream" 2>/dev/null | while IFS= read -r line; do
  if [[ $line == data:* ]]; then
    echo "$line" | sed 's/^data: //' | jq -c '.aggregation.quotes[] | {provider: .provider, status: .status, progress: .progress}'
  fi
done
echo ""
echo "✓ Streaming completed"
echo ""

# Check final status
echo "4. Checking final status..."
STATUS=$(curl -s "http://localhost:3000/api/quotes/$RUN_ID")
echo "$STATUS" | jq .
echo ""

echo "================================"
echo "Test completed successfully!"
echo "================================"
