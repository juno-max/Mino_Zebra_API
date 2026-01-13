# Postman / cURL Commands - Mino Zebra API

## 🚀 Quick Start - Test the API

Use these commands in **Postman** or your terminal to test the API.

---

## 1️⃣ Health Check

### **cURL Command:**
```bash
curl --location 'http://localhost:3000/health'
```

### **Expected Response:**
```json
{
  "status": "healthy",
  "service": "Mino Zebra API",
  "version": "1.0.0",
  "timestamp": "2026-01-13T18:30:00.000Z"
}
```

### **Postman Setup:**
- Method: `GET`
- URL: `http://localhost:3000/health`
- Headers: None needed

---

## 2️⃣ Get Sample Data

### **cURL Command:**
```bash
curl --location 'http://localhost:3000/sample-data'
```

### **Expected Response:**
```json
{
  "driver": {
    "firstName": "Crystal",
    "lastName": "Mcpherson",
    "dateOfBirth": "10/06/1987",
    "gender": 1,
    "phone": "3372548478",
    "email": "xyz_1_tf@thezebra.com",
    "maritalStatus": 0,
    "education": 1,
    "employment": 0,
    "licenseNumber": "3726454522",
    "licenseState": "TX"
  },
  "vehicle": {
    "vin": "2C3CDZAG2GH967639",
    "year": 2016,
    "make": "Dodge",
    "model": "Challenger",
    "submodel": "SXT 2dr Coupe",
    "annualMileage": 10000,
    "garagingAddress": "1304 E Copeland Rd"
  },
  "address": {
    "street": "1304 E Copeland Rd",
    "city": "Arlington",
    "state": "TX",
    "zipcode": "76011",
    "county": "Tarrant County"
  },
  "policy": {
    "startDate": "2025-09-25",
    "currentlyInsured": true
  }
}
```

---

## 3️⃣ Create Quote Request (Main API Call)

### **cURL Command:**
```bash
curl --location 'http://localhost:3000/api/quotes' \
--header 'Content-Type: application/json' \
--data '{
  "vin": "2C3CDZAG2GH967639",
  "employmentStatus": "EMPLOYED",
  "educationLevel": "BACHELORS",
  "phone": "337-254-8478",
  "policyStartDate": "2025-09-25",
  "mailingAddress": "1304 E Copeland Rd",
  "isMailingSameAsGaraging": true
}'
```

### **Postman Setup:**
- Method: `POST`
- URL: `http://localhost:3000/api/quotes`
- Headers:
  - `Content-Type: application/json`
- Body (raw JSON):
```json
{
  "vin": "2C3CDZAG2GH967639",
  "employmentStatus": "EMPLOYED",
  "educationLevel": "BACHELORS",
  "phone": "337-254-8478",
  "policyStartDate": "2025-09-25",
  "mailingAddress": "1304 E Copeland Rd",
  "isMailingSameAsGaraging": true
}
```

### **Expected Response:**
```json
{
  "runId": "a1b2c3d4e5f6789012345678",
  "status": "processing",
  "streamUrl": "/api/quotes/a1b2c3d4e5f6789012345678/stream"
}
```

### **Field Descriptions:**
| Field | Type | Required | Description | Example |
|-------|------|----------|-------------|---------|
| `vin` | string | ✅ Yes | Vehicle Identification Number (17 chars) | "2C3CDZAG2GH967639" |
| `employmentStatus` | enum | ✅ Yes | EMPLOYED, UNEMPLOYED, SELF_EMPLOYED, RETIRED, STUDENT | "EMPLOYED" |
| `educationLevel` | enum | ✅ Yes | HIGH_SCHOOL, SOME_COLLEGE, BACHELORS, MASTERS, DOCTORATE | "BACHELORS" |
| `phone` | string | ✅ Yes | Phone number (min 10 digits) | "337-254-8478" |
| `policyStartDate` | string | ✅ Yes | Policy start date (YYYY-MM-DD format) | "2025-09-25" |
| `mailingAddress` | string | ✅ Yes | Street address | "1304 E Copeland Rd" |
| `isMailingSameAsGaraging` | boolean | ✅ Yes | Same address for mailing and garaging? | true |
| `firstName` | string | ❌ Optional | Driver first name | "Crystal" |
| `lastName` | string | ❌ Optional | Driver last name | "Mcpherson" |
| `dateOfBirth` | string | ❌ Optional | MM/DD/YYYY or YYYY-MM-DD | "10/06/1987" |
| `email` | string | ❌ Optional | Email address | "test@example.com" |
| `city` | string | ❌ Optional | City | "Arlington" |
| `state` | string | ❌ Optional | State code | "TX" |
| `zipcode` | string | ❌ Optional | ZIP code | "76011" |
| `garagingAddress` | string | ❌ Optional | Different garaging address (if not same as mailing) | "123 Main St" |

---

## 4️⃣ Get Quote Status

### **cURL Command:**
```bash
# Replace RUN_ID with the runId from step 3
curl --location 'http://localhost:3000/api/quotes/a1b2c3d4e5f6789012345678'
```

### **Expected Response (In Progress):**
```json
{
  "runId": "a1b2c3d4e5f6789012345678",
  "status": "processing",
  "streamUrl": "/api/quotes/a1b2c3d4e5f6789012345678/stream"
}
```

### **Expected Response (Completed):**
```json
{
  "runId": "a1b2c3d4e5f6789012345678",
  "status": "completed",
  "quotes": [
    {
      "provider": "GEICO",
      "providerId": "geico",
      "status": "completed",
      "progress": 100,
      "activity": "Quote extracted successfully!",
      "finalQuote": 150,
      "details": "Full coverage with $500 deductible",
      "timestamp": "2026-01-13T18:35:00.000Z"
    },
    {
      "provider": "Progressive",
      "providerId": "progressive",
      "status": "completed",
      "progress": 100,
      "finalQuote": 175,
      "timestamp": "2026-01-13T18:35:30.000Z"
    },
    {
      "provider": "State Farm",
      "providerId": "statefarm",
      "status": "completed",
      "progress": 100,
      "finalQuote": 160,
      "timestamp": "2026-01-13T18:36:00.000Z"
    }
  ],
  "startedAt": "2026-01-13T18:30:00.000Z",
  "completedAt": "2026-01-13T18:36:00.000Z",
  "totalProviders": 3,
  "completedProviders": 3
}
```

---

## 5️⃣ Stream Real-Time Updates (SSE)

### **Note:** Server-Sent Events (SSE) are not easily testable in Postman, but you can use:
- Browser: Open `http://localhost:3000/api/quotes/RUN_ID/stream` in browser
- curl with streaming
- Or use the HTML frontend

### **cURL Command (Stream):**
```bash
# Replace RUN_ID with actual runId
curl --location --no-buffer 'http://localhost:3000/api/quotes/a1b2c3d4e5f6789012345678/stream'
```

### **Expected Stream Output:**
```
data: {"type":"progress","aggregation":{"runId":"...","status":"processing","quotes":[...]}}

data: {"type":"activity","provider":"GEICO","providerId":"geico","activity":"Browser launched"}

data: {"type":"activity","provider":"GEICO","providerId":"geico","activity":"Navigating to quote page"}

data: {"type":"progress","aggregation":{"runId":"...","status":"processing","quotes":[...]}}

: heartbeat

data: {"type":"complete","aggregation":{"runId":"...","status":"completed","quotes":[...]}}
```

---

## 6️⃣ API Documentation

### **cURL Command:**
```bash
curl --location 'http://localhost:3000/api'
```

### **Expected Response:**
```json
{
  "name": "Mino Zebra API",
  "description": "Insurance quote aggregator using Mino.ai agents",
  "version": "1.0.0",
  "endpoints": {
    "health": "GET /health",
    "createQuote": "POST /api/quotes",
    "getQuote": "GET /api/quotes/:runId",
    "streamQuote": "GET /api/quotes/:runId/stream"
  },
  "documentation": {
    "createQuote": {
      "method": "POST",
      "path": "/api/quotes",
      "body": {
        "vin": "string (Vehicle Identification Number)",
        "employmentStatus": "EMPLOYED | UNEMPLOYED | SELF_EMPLOYED | RETIRED | STUDENT",
        "educationLevel": "HIGH_SCHOOL | SOME_COLLEGE | BACHELORS | MASTERS | DOCTORATE",
        "phone": "string (format: XXX-XXX-XXXX)",
        "policyStartDate": "string (format: YYYY-MM-DD)",
        "mailingAddress": "string",
        "isMailingSameAsGaraging": "boolean",
        "garagingAddress": "string (optional)"
      },
      "response": {
        "runId": "string",
        "status": "processing",
        "streamUrl": "string"
      }
    }
  }
}
```

---

## 🧪 Complete Test Flow

### **Step 1: Check Health**
```bash
curl http://localhost:3000/health
```
✅ Should return: `{"status":"healthy",...}`

### **Step 2: Create Quote Request**
```bash
curl -X POST http://localhost:3000/api/quotes \
  -H "Content-Type: application/json" \
  -d '{
    "vin": "2C3CDZAG2GH967639",
    "employmentStatus": "EMPLOYED",
    "educationLevel": "BACHELORS",
    "phone": "337-254-8478",
    "policyStartDate": "2025-09-25",
    "mailingAddress": "1304 E Copeland Rd",
    "isMailingSameAsGaraging": true
  }'
```
✅ Should return: `{"runId":"...","status":"processing","streamUrl":"..."}`

### **Step 3: Copy the runId from response**

### **Step 4: Check Status (Optional)**
```bash
curl http://localhost:3000/api/quotes/PASTE_RUN_ID_HERE
```

### **Step 5: Open Stream in Browser**
Open in browser: `http://localhost:3000/api/quotes/PASTE_RUN_ID_HERE/stream`

You'll see real-time updates streaming in!

---

## 🌐 Vercel Production URLs

Replace `http://localhost:3000` with your Vercel URL:

```
https://mino-zebra-lseckpwka-juno-maxs-projects.vercel.app
```

### **Example:**
```bash
# Health check on Vercel
curl https://mino-zebra-lseckpwka-juno-maxs-projects.vercel.app/health

# Create quote on Vercel
curl -X POST https://mino-zebra-lseckpwka-juno-maxs-projects.vercel.app/api/quotes \
  -H "Content-Type: application/json" \
  -d '{"vin":"2C3CDZAG2GH967639","employmentStatus":"EMPLOYED",...}'
```

---

## ⚠️ Important Notes

1. **Authentication on Vercel:**
   - If you get "Authentication Required", disable Vercel Authentication in settings
   - Visit: https://vercel.com/juno-maxs-projects/mino-zebra-api/settings/deployment-protection

2. **Request Timeout:**
   - Quote aggregation can take 5-20 minutes per provider
   - Use the SSE stream to monitor progress
   - Don't wait for the POST response to complete

3. **Environment Variables:**
   - Ensure `MINO_API_KEY` is set in `.env` (local) or Vercel settings (production)
   - Without it, you'll get: `"error": "MINO_API_KEY not configured"`

4. **CORS:**
   - API allows CORS from all origins (`*`)
   - Safe for testing, should be restricted in production

---

## 📚 Additional Resources

- **Complete API Flow:** See `API_FLOW_COMPLETE.md`
- **Vercel Setup:** See `VERCEL_SETUP.md`
- **Frontend UI:** Open `http://localhost:3000/` in browser

---

## 🐛 Troubleshooting

### Error: "Invalid user data"
✅ Check that all required fields are provided:
- `vin`, `phone`, `employmentStatus`, `educationLevel`, `policyStartDate`, `mailingAddress`, `isMailingSameAsGaraging`

### Error: "MINO_API_KEY not configured"
✅ Set environment variable in `.env` file or Vercel settings

### Error: "Quote run not found"
✅ Verify the runId is correct
✅ Check if the quote run has expired (runs are stored in memory)

### No response from /api/quotes
✅ Check server logs
✅ Verify server is running on port 3000
✅ Check network/firewall settings

---

## 💡 Pro Tips

1. **Use Postman Collections:**
   - Import these cURL commands into Postman
   - Save as a collection for easy reuse
   - Use environment variables for `runId` and `baseUrl`

2. **Monitor Server Logs:**
   - Run `npm run dev` in terminal to see real-time logs
   - Helpful for debugging API calls

3. **Test with Different Data:**
   - Try different VINs, dates, addresses
   - Test validation by sending invalid data

4. **Performance Testing:**
   - Monitor how long each provider takes
   - Check logs for Mino API responses

Enjoy testing! 🚀
