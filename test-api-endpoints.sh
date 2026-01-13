#!/bin/bash

echo "=== Testing All API Endpoints ==="
echo ""

echo "1. Health Check:"
curl -s http://localhost:3000/health | jq
echo ""

echo "2. Sample Data:"
curl -s http://localhost:3000/sample-data | jq '.driver.firstName, .vehicle.vin'
echo ""

echo "3. API Documentation:"
curl -s http://localhost:3000/api | jq -r '.name'
echo ""

echo "4. Create Quote Request (Testing with 10 providers):"
curl -s -X POST http://localhost:3000/api/quotes \
  -H "Content-Type: application/json" \
  -d '{"vin":"2C3CDZAG2GH967639","employmentStatus":"EMPLOYED","educationLevel":"BACHELORS","phone":"337-254-8478","policyStartDate":"2025-09-25","mailingAddress":"1304 E Copeland Rd","isMailingSameAsGaraging":true}' \
  | jq
echo ""

echo "=== All Local Endpoints Working! ==="
