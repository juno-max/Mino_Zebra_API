# Complete API Call Flow - Mino Zebra API

## 🔄 Full Request/Response Cycle

This document shows the **complete end-to-end flow** of how API calls work in the Mino Zebra insurance quote aggregator.

---

## 📊 Architecture Overview

```
┌─────────────┐        ┌─────────────┐        ┌──────────────┐        ┌─────────────┐
│   Browser   │──POST──│  Express    │─calls──│    Quote     │─calls──│  Mino API   │
│ (Frontend)  │◄──SSE──│  (Backend)  │◄───────│  Aggregator  │◄───────│ (External)  │
└─────────────┘        └─────────────┘        └──────────────┘        └─────────────┘
     │                       │                        │                       │
     │                       │                        │                       │
  index.html          src/routes/quotes.ts    quote-aggregator.ts    mino-client.ts
```

---

## 1️⃣ FRONTEND - Browser (index.html)

### **Location:** `index.html` lines 741-843

### **What Happens:**
User fills form and clicks "Search All Providers" button.

### **Code:**
```javascript
// Line 671-673: API Base URL (auto-detects localhost or Vercel)
const API_BASE = window.location.origin;

// Lines 741-750: Collect form data
async function startQuoteSearch() {
    const formData = {
        vin: document.getElementById('vin').value,
        employmentStatus: 'EMPLOYED',
        educationLevel: 'BACHELORS',
        phone: formatPhone(document.getElementById('phone').value),
        policyStartDate: document.getElementById('policyStartDate').value,
        mailingAddress: document.getElementById('address').value,
        isMailingSameAsGaraging: true
    };

    // Lines 771-787: Send POST request to create quote
    const response = await fetch(`${API_BASE}/api/quotes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
    });

    // Check response
    if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', errorText);
        addLog(`✗ API returned error: ${response.status}`, 'error');
        throw new Error(`API error: ${response.status}`);
    }

    const responseData = await response.json();
    const { runId, streamUrl } = responseData;
    // Response: { runId: "abc123...", status: "processing", streamUrl: "/api/quotes/abc123.../stream" }

    // Lines 794-816: Open Server-Sent Events (SSE) stream for real-time updates
    eventSource = new EventSource(`${API_BASE}${streamUrl}`);

    eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data);

        // Handle different event types:
        if (data.type === 'activity') {
            // Agent activity updates (e.g., "Filling form...")
            addLog(`🤖 ${data.provider}: ${data.activity}`, 'agent');
        }

        if (data.type === 'progress') {
            // Progress updates with current quote statuses
            updateProviderCards(data.aggregation);
        }

        if (data.type === 'complete') {
            // All providers done
            eventSource.close();
            addLog('✓ All agents completed', 'success');
        }
    };

    eventSource.onerror = (error) => {
        console.error('SSE Connection Error:', error);
        eventSource.close();
        addLog('✗ Connection lost', 'error');
    };
}
```

### **API Calls Made:**
1. **POST** `/api/quotes` - Start quote aggregation
2. **GET** `/api/quotes/:runId/stream` - SSE stream for updates

---

## 2️⃣ BACKEND - Express Route Handler (src/routes/quotes.ts)

### **Location:** `src/routes/quotes.ts`

### **Endpoint 1: POST /api/quotes** (Lines 20-86)

```typescript
router.post('/quotes', async (req: Request, res: Response) => {
  // Step 1: Validate incoming data
  const validation = validateUserData(req.body);
  if (!validation.success) {
    return res.status(400).json({
      error: 'Invalid user data',
      details: validation.errors,
    });
  }

  const userData = validation.data;

  // Step 2: Get API key from environment
  const apiKey = process.env.MINO_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: 'Server configuration error',
      details: 'MINO_API_KEY not configured',
    });
  }

  // Step 3: Generate unique run ID
  const runId = randomBytes(16).toString('hex');

  // Step 4: Initialize in-memory storage
  quoteRuns.set(runId, {
    status: 'processing',
    events: [],
  });

  // Step 5: Start aggregation in BACKGROUND (non-blocking)
  aggregateQuotes(userData, apiKey, runId, (event: ProgressEvent) => {
    // Store progress events as they come in
    const run = quoteRuns.get(runId);
    if (run) {
      run.events.push(event);
    }
  })
    .then(result => {
      // Update when complete
      const run = quoteRuns.get(runId);
      if (run) {
        run.status = 'completed';
        run.result = result;
      }
    })
    .catch(error => {
      console.error(`Error in quote aggregation ${runId}:`, error);
    });

  // Step 6: Return immediately with runId and stream URL
  return res.json({
    runId,
    status: 'processing',
    streamUrl: `/api/quotes/${runId}/stream`,
  });
});
```

### **Endpoint 2: GET /api/quotes/:runId/stream** (Lines 117-181)

```typescript
router.get('/quotes/:runId/stream', (req: Request, res: Response) => {
  const { runId } = req.params;
  const run = quoteRuns.get(runId);

  if (!run) {
    return res.status(404).json({ error: 'Quote run not found' });
  }

  // Step 1: Set Server-Sent Events headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  // Step 2: Send all existing events immediately
  let lastEventIndex = 0;
  for (const event of run.events) {
    res.write(`data: ${JSON.stringify(event)}\n\n`);
    lastEventIndex++;
  }

  // Step 3: Poll for new events every 500ms
  const intervalId = setInterval(() => {
    const currentRun = quoteRuns.get(runId);
    if (!currentRun) {
      clearInterval(intervalId);
      res.end();
      return;
    }

    // Send new events since last check
    for (let i = lastEventIndex; i < currentRun.events.length; i++) {
      res.write(`data: ${JSON.stringify(currentRun.events[i])}\n\n`);
      lastEventIndex++;
    }

    // If completed, send final result and close
    if (currentRun.status === 'completed') {
      if (currentRun.result) {
        res.write(`data: ${JSON.stringify({
          type: 'complete',
          aggregation: currentRun.result,
        })}\n\n`);
      }
      clearInterval(intervalId);
      res.end();
    }
  }, 500);

  // Step 4: Send heartbeat to keep connection alive
  const heartbeatId = setInterval(() => {
    res.write(': heartbeat\n\n');
  }, 10000);

  // Step 5: Cleanup on disconnect
  req.on('close', () => {
    clearInterval(intervalId);
    clearInterval(heartbeatId);
  });
});
```

---

## 3️⃣ BUSINESS LOGIC - Quote Aggregator (src/services/quote-aggregator.ts)

### **Location:** `src/services/quote-aggregator.ts` lines 256-269

### **Entry Point:**
```typescript
export async function aggregateQuotes(
  userData: UserData,
  apiKey: string,
  runId: string,
  onProgress?: (event: ProgressEvent) => void
): Promise<QuoteAggregationResult> {
  const aggregator = new QuoteAggregator(apiKey, runId);

  if (onProgress) {
    aggregator.on('progress', onProgress);
  }

  return await aggregator.aggregate(userData);
}
```

### **Main Aggregation Logic** (Lines 26-52)

```typescript
async aggregate(userData: UserData): Promise<QuoteAggregationResult> {
  // Step 1: Get provider configurations with user data filled in
  const providerGoals = getProviderGoals(userData);
  // Returns: [
  //   { config: { id: 'geico', name: 'GEICO', url: '...' }, goal: 'filled template...' },
  //   { config: { id: 'progressive', ... }, goal: '...' },
  //   { config: { id: 'statefarm', ... }, goal: '...' }
  // ]

  // Step 2: Initialize quotes with pending status
  for (const { config } of providerGoals) {
    this.quotes.set(config.id, {
      provider: config.name,
      providerId: config.id,
      status: 'pending',
      progress: 0,
      timestamp: new Date().toISOString(),
    });
  }

  // Step 3: Emit initial state to frontend
  this.emitProgress();

  // Step 4: Run ALL providers in parallel
  const promises = providerGoals.map(({ config, goal }) =>
    this.runProviderAutomation(config.id, config.name, config.url, goal)
  );

  await Promise.allSettled(promises);

  // Step 5: Return final aggregation
  return this.getAggregationResult('completed');
}
```

### **Single Provider Automation** (Lines 57-168)

```typescript
private async runProviderAutomation(
  providerId: string,
  providerName: string,
  url: string,
  goal: string
): Promise<void> {
  try {
    // Step 1: Update status to in_progress
    this.updateQuote(providerId, {
      status: 'in_progress',
      progress: 10,
      activity: 'Launching browser...',
    });

    // Step 2: Set up heartbeat (emits activity every 5s)
    heartbeatInterval = setInterval(() => {
      const quote = this.quotes.get(providerId);
      if (quote && quote.status === 'in_progress') {
        this.emit('progress', {
          type: 'activity',
          provider: providerName,
          providerId,
          activity: quote.activity || 'Working...',
        });
      }
    }, 5000);

    // Step 3: Call Mino API to run automation
    const result = await runMinoAutomation({
      url,
      goal,
      apiKey: this.apiKey,
      timeout: 1200000, // 20 minutes
      browserProfile: 'lite',
      onProgress: (minoEvent) => {
        // Handle progress from Mino API
        let activity = 'Processing...';
        let progressPercent = 30;

        if (minoEvent.type === 'STARTED') {
          activity = 'Browser launched, navigating...';
          progressPercent = 20;
        } else if (minoEvent.type === 'PROGRESS') {
          activity = minoEvent.purpose || 'Working...';
          progressPercent = 50 + Math.floor(Math.random() * 30);
        }

        // Update quote and emit event
        this.updateQuote(providerId, { progress: progressPercent, activity });
        this.emit('progress', { type: 'activity', provider: providerName, providerId, activity });
      },
    });

    // Step 4: Parse result and update quote
    if (result.success && result.data) {
      const quote = this.parseQuoteResult(result.data);
      this.updateQuote(providerId, {
        status: 'completed',
        progress: 100,
        finalQuote: quote.quote ?? undefined,
        details: quote.details ?? undefined,
      });
    } else {
      this.updateQuote(providerId, {
        status: 'failed',
        error: result.error || 'Unknown error',
      });
    }
  } catch (error) {
    this.updateQuote(providerId, {
      status: 'failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
```

---

## 4️⃣ EXTERNAL API - Mino Client (src/services/mino-client.ts)

### **Location:** `src/services/mino-client.ts` lines 50-167

### **Mino API Call:**

```typescript
export async function runMinoAutomation(config: MinoAutomationConfig): Promise<MinoAutomationResult> {
  const { url, goal, apiKey, timeout = 1200000, browserProfile = 'lite', onProgress } = config;

  const minoEndpoint = process.env.MINO_API_ENDPOINT || 'https://mino.ai/v1/automation/run-sse';

  // Step 1: Send POST request to Mino API
  const response = await fetch(minoEndpoint, {
    method: 'POST',
    headers: {
      'X-API-Key': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      url,                    // e.g., "https://www.geico.com/"
      goal,                   // Filled template with user data
      browser_profile: browserProfile, // 'lite' or 'stealth'
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    return {
      success: false,
      error: `Mino API error (${response.status}): ${errorText}`,
    };
  }

  // Step 2: Parse Server-Sent Events (SSE) stream from Mino
  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let runId: string | undefined;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      const event = parseSSELine(line);
      if (!event) continue;

      // Store runId
      if (event.runId && !runId) {
        runId = event.runId;
      }

      // Emit progress events
      if (onProgress && (event.type === 'STARTED' || event.type === 'PROGRESS')) {
        onProgress(event);
      }

      // Handle completion
      if (event.type === 'COMPLETE') {
        if (event.status === 'COMPLETED' && event.resultJson) {
          return {
            success: true,
            data: event.resultJson, // Parsed quote data
            runId,
          };
        } else {
          return {
            success: false,
            error: event.error || `Failed: ${event.status}`,
            runId,
          };
        }
      }
    }
  }

  return {
    success: false,
    error: 'Stream ended without completion event',
    runId,
  };
}
```

---

## 5️⃣ PROVIDER CONFIGURATION (src/config/providers.ts)

### **Location:** `src/config/providers.ts` lines 43-158

### **Provider Definitions:**

```typescript
export const PROVIDERS: ProviderConfig[] = [
  {
    id: 'geico',
    name: 'GEICO',
    url: 'https://www.geico.com/',
    goalTemplate: `You are an AI agent filling out a GEICO auto insurance quote form...

**DRIVER INFORMATION:**
- First Name: {{firstName}}
- Last Name: {{lastName}}
- VIN: {{vin}}
...

Return JSON format:
{
  "quote": <monthly premium as number>,
  "estimatedMin": <number or null>,
  "estimatedMax": <number or null>,
  "details": "<coverage details>"
}`
  },
  // ... progressive, statefarm
];

// Fill template with user data
export function getProviderGoals(userData: UserData) {
  return PROVIDERS.map(provider => ({
    config: provider,
    goal: fillTemplate(provider.goalTemplate, userData) // Replaces {{firstName}} etc.
  }));
}
```

---

## 6️⃣ TYPE DEFINITIONS

### **UserData** (src/types/user-data.ts)

```typescript
export const UserDataSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  vin: z.string().min(17).max(17),
  phone: z.string().min(10),
  employmentStatus: z.enum(['EMPLOYED', 'UNEMPLOYED', 'SELF_EMPLOYED', 'RETIRED', 'STUDENT']),
  educationLevel: z.enum(['HIGH_SCHOOL', 'SOME_COLLEGE', 'BACHELORS', 'MASTERS', 'DOCTORATE']),
  policyStartDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  mailingAddress: z.string(),
  isMailingSameAsGaraging: z.boolean(),
  // ... more fields
});

export type UserData = z.infer<typeof UserDataSchema>;
```

### **Quote Types** (src/types/quote.ts)

```typescript
export interface Quote {
  provider: string;        // "GEICO"
  providerId: string;      // "geico"
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  progress: number;        // 0-100
  activity?: string;       // "Filling form..."
  finalQuote?: number;     // 150 (monthly premium)
  estimatedQuote?: { min: number; max: number };
  details?: string;        // "Full coverage, $500 deductible"
  error?: string;
  timestamp: string;
}

export interface QuoteAggregationResult {
  runId: string;
  status: 'processing' | 'completed' | 'partial' | 'failed';
  quotes: Quote[];
  startedAt: string;
  completedAt?: string;
  totalProviders: number;
  completedProviders: number;
}

export interface ProgressEvent {
  type: 'progress' | 'complete' | 'error' | 'activity';
  provider?: string;
  providerId?: string;
  activity?: string;
  aggregation?: QuoteAggregationResult;
}
```

---

## 📈 COMPLETE DATA FLOW EXAMPLE

### **1. User Action:**
User fills form with VIN "2C3CDZAG2GH967639" and clicks "Search"

### **2. Frontend POST:**
```javascript
POST /api/quotes
{
  "vin": "2C3CDZAG2GH967639",
  "phone": "337-254-8478",
  "employmentStatus": "EMPLOYED",
  "educationLevel": "BACHELORS",
  "policyStartDate": "2025-09-25",
  "mailingAddress": "1304 E Copeland Rd",
  "isMailingSameAsGaraging": true
}
```

### **3. Backend Response:**
```json
{
  "runId": "a1b2c3d4e5f6...",
  "status": "processing",
  "streamUrl": "/api/quotes/a1b2c3d4e5f6.../stream"
}
```

### **4. Frontend Opens SSE:**
```javascript
GET /api/quotes/a1b2c3d4e5f6.../stream
```

### **5. Backend Calls Mino API (3 times in parallel):**

**For GEICO:**
```javascript
POST https://mino.ai/v1/automation/run-sse
{
  "url": "https://www.geico.com/",
  "goal": "You are an AI agent filling out a GEICO form...\nVIN: 2C3CDZAG2GH967639\n...",
  "browser_profile": "lite"
}
```

**For Progressive:**
```javascript
POST https://mino.ai/v1/automation/run-sse
{
  "url": "https://www.progressive.com/",
  "goal": "...",
  "browser_profile": "lite"
}
```

**For State Farm:**
```javascript
POST https://mino.ai/v1/automation/run-sse
{
  "url": "https://www.statefarm.com/",
  "goal": "...",
  "browser_profile": "lite"
}
```

### **6. Mino Responds with SSE Stream:**

```
data: {"type":"STARTED","runId":"mino-123","timestamp":"..."}

data: {"type":"STREAMING_URL","streamingUrl":"https://..."}

data: {"type":"PROGRESS","purpose":"Navigating to quote page"}

data: {"type":"PROGRESS","purpose":"Filling driver information"}

data: {"type":"PROGRESS","purpose":"Entering vehicle details"}

data: {"type":"COMPLETE","status":"COMPLETED","resultJson":{"quote":150,"details":"Full coverage"}}
```

### **7. Backend Forwards to Frontend via SSE:**

```
data: {"type":"activity","provider":"GEICO","providerId":"geico","activity":"Browser launched"}

data: {"type":"activity","provider":"GEICO","providerId":"geico","activity":"Navigating to quote page"}

data: {"type":"progress","aggregation":{"runId":"...","quotes":[...]}}

data: {"type":"complete","aggregation":{"quotes":[{"provider":"GEICO","finalQuote":150,...}]}}
```

### **8. Frontend Updates UI:**
- Shows live activity: "🤖 GEICO: Navigating to quote page"
- Updates progress bars: 50%, 75%, 100%
- Displays final quote: "$150/mo"

---

## 🔑 Key Concepts

### **1. Non-Blocking Architecture**
- Backend starts aggregation and returns immediately
- Frontend gets runId instantly and opens SSE stream
- Processing happens in background

### **2. Real-Time Updates via SSE**
- Server pushes updates to client as they happen
- No polling needed from frontend
- Efficient and scalable

### **3. Parallel Processing**
- All 3 providers run simultaneously
- Each has its own Mino automation running
- Results come in as they complete

### **4. Event-Driven**
- Quote Aggregator extends EventEmitter
- Emits progress events as quotes update
- Route handler listens and stores events
- SSE endpoint streams stored events to frontend

---

## 🌐 Environment Variables

```bash
MINO_API_KEY=sk-mino-t-r-Gn4zmELmclwnkMtgtYK-GtcyAMH5
MINO_API_ENDPOINT=https://mino.ai/v1/automation/run-sse
PORT=3000
NODE_ENV=production
```

---

## 📝 Summary

**The complete flow:**
1. User → Frontend: Fill form
2. Frontend → Backend: POST /api/quotes
3. Backend → Quote Aggregator: Start aggregation
4. Quote Aggregator → Mino Client: Run 3 automations in parallel
5. Mino Client → Mino API: POST to external API (3 requests)
6. Mino API → Mino Client: SSE stream with progress
7. Mino Client → Quote Aggregator: Return results
8. Quote Aggregator → Backend: Emit progress events
9. Backend → Frontend: SSE stream with updates
10. Frontend → User: Display live results

**All of this happens asynchronously with real-time updates!** 🚀
