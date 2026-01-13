#!/bin/bash

echo "Testing Mino API Key..."
echo ""

curl -s --max-time 10 --location https://mino.ai/v1/automation/run-sse \
  -H "X-API-Key: sk-mino-t-r-Gn4zmELmclwnkMtgtYK-GtcyAMH5" \
  -H "Content-Type: application/json" \
  -d '{"url":"https://example.com","goal":"Get page title","browser_profile":"lite"}' \
  | head -5

echo ""
echo "If you see SSE events above, API key is working!"
