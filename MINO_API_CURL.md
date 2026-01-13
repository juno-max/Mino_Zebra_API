# Direct Mino API cURL Commands

## 🎯 Call Mino.ai API Directly

This is the **external API** that your backend calls to run browser automations.

---

## 📡 Mino API Endpoint

```
POST https://mino.ai/v1/automation/run-sse
```

---

## 🔑 Your API Key

```
sk-mino-t-r-Gn4zmELmclwnkMtgtYK-GtcyAMH5
```

---

## 1️⃣ Simple Test - Get Page Title

### **cURL Command:**
```bash
curl --location 'https://mino.ai/v1/automation/run-sse' \
--header 'X-API-Key: sk-mino-t-r-Gn4zmELmclwnkMtgtYK-GtcyAMH5' \
--header 'Content-Type: application/json' \
--data '{
  "url": "https://example.com",
  "goal": "Get the page title and return it as JSON: {\"title\": \"the title text\"}",
  "browser_profile": "lite"
}'
```

### **Postman Setup:**
- **Method:** `POST`
- **URL:** `https://mino.ai/v1/automation/run-sse`
- **Headers:**
  - `X-API-Key: sk-mino-t-r-Gn4zmELmclwnkMtgtYK-GtcyAMH5`
  - `Content-Type: application/json`
- **Body (raw JSON):**
```json
{
  "url": "https://example.com",
  "goal": "Get the page title and return it as JSON: {\"title\": \"the title text\"}",
  "browser_profile": "lite"
}
```

### **Expected Response (SSE Stream):**
```
data: {"type":"STARTED","runId":"run_abc123","timestamp":"2026-01-13T18:00:00Z"}

data: {"type":"STREAMING_URL","streamingUrl":"https://mino.ai/stream/run_abc123"}

data: {"type":"PROGRESS","purpose":"Navigating to https://example.com"}

data: {"type":"PROGRESS","purpose":"Reading page content"}

data: {"type":"COMPLETE","status":"COMPLETED","resultJson":{"title":"Example Domain"}}
```

---

## 2️⃣ GEICO Insurance Quote (Real Use Case)

### **cURL Command:**
```bash
curl --location 'https://mino.ai/v1/automation/run-sse' \
--header 'X-API-Key: sk-mino-t-r-Gn4zmELmclwnkMtgtYK-GtcyAMH5' \
--header 'Content-Type: application/json' \
--data '{
  "url": "https://www.geico.com/",
  "goal": "You are an AI agent filling out a GEICO auto insurance quote form. Navigate to the quote page and complete ALL fields with this REAL customer data:\n\n**DRIVER INFORMATION:**\n- First Name: Crystal\n- Last Name: Mcpherson\n- Date of Birth: 10/06/1987\n- Gender: Female\n- Marital Status: Single\n- Email: xyz_1_tf@thezebra.com\n- Phone: 337-254-8478\n- License Number: 3726454522\n- License State: TX\n\n**VEHICLE INFORMATION:**\n- Year: 2016\n- Make: Dodge\n- Model: Challenger\n- VIN: 2C3CDZAG2GH967639\n\n**ADDRESS:**\n- Street: 1304 E Copeland Rd\n- City: Arlington\n- State: TX\n- ZIP: 76011\n\n**POLICY:**\n- Start Date: 2025-09-25\n- Employment: EMPLOYED\n- Education: BACHELORS\n\nIMPORTANT: Navigate through ALL form pages, fill out EVERY required field, and extract the final quote.\n\nReturn JSON format:\n{\n  \"quote\": <monthly premium as number>,\n  \"estimatedMin\": <number or null>,\n  \"estimatedMax\": <number or null>,\n  \"details\": \"<coverage details>\"\n}",
  "browser_profile": "lite"
}'
```

### **Postman Setup:**
- **Method:** `POST`
- **URL:** `https://mino.ai/v1/automation/run-sse`
- **Headers:**
  - `X-API-Key: sk-mino-t-r-Gn4zmELmclwnkMtgtYK-GtcyAMH5`
  - `Content-Type: application/json`
- **Body (raw JSON):**
```json
{
  "url": "https://www.geico.com/",
  "goal": "You are an AI agent filling out a GEICO auto insurance quote form. Navigate to the quote page and complete ALL fields with this REAL customer data:\n\n**DRIVER INFORMATION:**\n- First Name: Crystal\n- Last Name: Mcpherson\n- Date of Birth: 10/06/1987\n- Gender: Female\n- Marital Status: Single\n- Email: xyz_1_tf@thezebra.com\n- Phone: 337-254-8478\n- License Number: 3726454522\n- License State: TX\n\n**VEHICLE INFORMATION:**\n- Year: 2016\n- Make: Dodge\n- Model: Challenger\n- VIN: 2C3CDZAG2GH967639\n\n**ADDRESS:**\n- Street: 1304 E Copeland Rd\n- City: Arlington\n- State: TX\n- ZIP: 76011\n\n**POLICY:**\n- Start Date: 2025-09-25\n- Employment: EMPLOYED\n- Education: BACHELORS\n\nIMPORTANT: Navigate through ALL form pages, fill out EVERY required field, and extract the final quote.\n\nReturn JSON format:\n{\n  \"quote\": <monthly premium as number>,\n  \"estimatedMin\": <number or null>,\n  \"estimatedMax\": <number or null>,\n  \"details\": \"<coverage details>\"\n}",
  "browser_profile": "lite"
}
```

### **Expected Response (SSE Stream):**
```
data: {"type":"STARTED","runId":"run_geico_123","timestamp":"2026-01-13T18:00:00Z"}

data: {"type":"STREAMING_URL","streamingUrl":"https://mino.ai/stream/run_geico_123"}

data: {"type":"PROGRESS","purpose":"Opening browser and navigating to GEICO"}

data: {"type":"PROGRESS","purpose":"Finding quote form"}

data: {"type":"PROGRESS","purpose":"Filling driver information"}

data: {"type":"PROGRESS","purpose":"Entering vehicle details"}

data: {"type":"PROGRESS","purpose":"Completing address fields"}

data: {"type":"PROGRESS","purpose":"Submitting form and waiting for quote"}

data: {"type":"PROGRESS","purpose":"Extracting quote information"}

data: {"type":"COMPLETE","status":"COMPLETED","resultJson":{"quote":150,"estimatedMin":null,"estimatedMax":null,"details":"Full coverage with $500 deductible"}}
```

---

## 3️⃣ Progressive Insurance Quote

### **cURL Command:**
```bash
curl --location 'https://mino.ai/v1/automation/run-sse' \
--header 'X-API-Key: sk-mino-t-r-Gn4zmELmclwnkMtgtYK-GtcyAMH5' \
--header 'Content-Type: application/json' \
--data '{
  "url": "https://www.progressive.com/",
  "goal": "You are an AI agent filling out a Progressive auto insurance quote form. Complete ALL form fields with this REAL data:\n\n**DRIVER:**\n- Name: Crystal Mcpherson\n- DOB: 10/06/1987\n- Gender: Female\n- Marital Status: Single\n- Email: xyz_1_tf@thezebra.com\n- Phone: 337-254-8478\n- DL#: 3726454522\n\n**VEHICLE:**\n- 2016 Dodge Challenger\n- VIN: 2C3CDZAG2GH967639\n\n**LOCATION:**\n- Address: 1304 E Copeland Rd, Arlington, TX 76011\n\n**POLICY:**\n- Start: 2025-09-25\n- Employment: EMPLOYED\n- Education: BACHELORS\n\nNavigate through the entire quote flow and extract the final premium.\n\nReturn JSON:\n{\n  \"quote\": <monthly premium number>,\n  \"estimatedMin\": <number or null>,\n  \"estimatedMax\": <number or null>,\n  \"details\": \"<coverage info>\"\n}",
  "browser_profile": "lite"
}'
```

---

## 4️⃣ State Farm Insurance Quote

### **cURL Command:**
```bash
curl --location 'https://mino.ai/v1/automation/run-sse' \
--header 'X-API-Key: sk-mino-t-r-Gn4zmELmclwnkMtgtYK-GtcyAMH5' \
--header 'Content-Type: application/json' \
--data '{
  "url": "https://www.statefarm.com/",
  "goal": "You are an AI agent getting a State Farm auto insurance quote. Fill out their quote form with this COMPLETE REAL customer data:\n\n**PERSONAL:**\nCrystal Mcpherson\nDOB: 10/06/1987\nGender: Female, Marital: Single\nContact: xyz_1_tf@thezebra.com, 337-254-8478\nLicense: 3726454522 (TX)\n\n**VEHICLE:**\n2016 Dodge Challenger\nVIN: 2C3CDZAG2GH967639\nLocation: 1304 E Copeland Rd, Arlington, TX 76011\n\n**POLICY DETAILS:**\nEffective: 2025-09-25\nEmployment: EMPLOYED\nEducation: BACHELORS\n\nComplete the ENTIRE quote process and get the final monthly premium.\n\nReturn JSON:\n{\n  \"quote\": <monthly $ amount>,\n  \"estimatedMin\": <$ or null>,\n  \"estimatedMax\": <$ or null>,\n  \"details\": \"<policy details>\"\n}",
  "browser_profile": "lite"
}'
```

---

## 📊 Request Parameters

### **Required Headers:**
| Header | Value | Description |
|--------|-------|-------------|
| `X-API-Key` | `sk-mino-t-r-...` | Your Mino API authentication key |
| `Content-Type` | `application/json` | Request body format |

### **Request Body:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `url` | string | ✅ Yes | Target website URL to automate |
| `goal` | string | ✅ Yes | Natural language instructions for the AI agent |
| `browser_profile` | string | ❌ Optional | `"lite"` (default) or `"stealth"` for harder-to-detect browsing |

---

## 📡 Response Format (Server-Sent Events)

Mino API returns a **streaming response** using Server-Sent Events (SSE).

### **Event Types:**

#### **1. STARTED** - Automation has begun
```json
{
  "type": "STARTED",
  "runId": "run_abc123",
  "timestamp": "2026-01-13T18:00:00Z"
}
```

#### **2. STREAMING_URL** - Live browser session URL
```json
{
  "type": "STREAMING_URL",
  "streamingUrl": "https://mino.ai/stream/run_abc123"
}
```
**Note:** You can open this URL in a browser to **watch the AI agent work in real-time**!

#### **3. PROGRESS** - Progress updates
```json
{
  "type": "PROGRESS",
  "purpose": "Filling driver information"
}
```

#### **4. HEARTBEAT** - Keep-alive signal
```json
{
  "type": "HEARTBEAT"
}
```

#### **5. COMPLETE** - Automation finished
```json
{
  "type": "COMPLETE",
  "status": "COMPLETED",
  "resultJson": {
    "quote": 150,
    "estimatedMin": null,
    "estimatedMax": null,
    "details": "Full coverage with $500 deductible"
  }
}
```

**Or if failed:**
```json
{
  "type": "COMPLETE",
  "status": "FAILED",
  "error": "Could not find quote form"
}
```

---

## 🔍 How Your Backend Calls This

**From:** `src/services/mino-client.ts` lines 57-68

```typescript
const response = await fetch('https://mino.ai/v1/automation/run-sse', {
  method: 'POST',
  headers: {
    'X-API-Key': apiKey,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    url,                    // e.g., "https://www.geico.com/"
    goal,                   // Filled template with user data
    browser_profile: browserProfile, // 'lite'
  }),
});
```

---

## 🎬 Watch AI Agent Live

When you make a request, Mino returns a `streamingUrl` in the STREAMING_URL event:

```
https://mino.ai/stream/run_abc123
```

**Open this URL in your browser** to watch the AI agent work in real-time! You'll see:
- Browser window opening
- Agent navigating the website
- Forms being filled automatically
- AI making decisions

---

## ⏱️ Typical Timing

| Provider | Average Time |
|----------|--------------|
| Simple task (get title) | 10-30 seconds |
| GEICO quote | 5-15 minutes |
| Progressive quote | 5-20 minutes |
| State Farm quote | 5-15 minutes |

**Note:** Some insurance sites require agent contact and won't return a direct quote.

---

## 🐛 Common Issues

### **401 Unauthorized**
```json
{"error": "Invalid API key"}
```
✅ Check that `X-API-Key` header is correct

### **Timeout**
Automation runs for too long (>20 minutes)
✅ Insurance sites can be slow
✅ Check the streaming URL to see what the agent is doing

### **No Quote Returned**
```json
{
  "type": "COMPLETE",
  "status": "COMPLETED",
  "resultJson": {
    "details": "Site requires agent contact. No online quote available."
  }
}
```
✅ This is normal - many insurance sites require phone contact for final quotes

---

## 💡 Tips for Writing Good Goals

### **✅ Good Goal:**
```
Fill out the insurance form with:
- VIN: 2C3CDZAG2GH967639
- Name: Crystal Mcpherson
- DOB: 10/06/1987

Return JSON: {"quote": <number>, "details": "<text>"}
```

### **❌ Bad Goal:**
```
Get me a quote
```

**Key Points:**
1. Be specific and detailed
2. Provide all required data
3. Specify the return format (JSON)
4. Give clear instructions

---

## 📚 Mino API Documentation

Official docs: https://mino.ai/docs

---

## 🚨 Security Notes

1. **Never commit API keys to Git**
2. **Rotate keys periodically**
3. **Monitor usage and costs**
4. **Use environment variables for keys**

---

## 🎯 Quick Test in Postman

1. Create new **POST** request
2. URL: `https://mino.ai/v1/automation/run-sse`
3. Headers:
   - `X-API-Key: sk-mino-t-r-Gn4zmELmclwnkMtgtYK-GtcyAMH5`
   - `Content-Type: application/json`
4. Body (raw JSON):
```json
{
  "url": "https://example.com",
  "goal": "Get the page title",
  "browser_profile": "lite"
}
```
5. Send and watch the stream!

---

**Your API Key:** `sk-mino-t-r-Gn4zmELmclwnkMtgtYK-GtcyAMH5`

**Endpoint:** `https://mino.ai/v1/automation/run-sse`

Ready to test! 🚀
