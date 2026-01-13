# Mino Zebra API - Insurance Quote Aggregator

A minimalist, premium REST API that autonomously fills out insurance forms across multiple providers using Mino.ai agents and returns aggregated quotes in real-time.

## Design Philosophy

Built with a first-principles approach inspired by Andrej Karpathy:
- **Focus on core value**: Parallel form filling and quote aggregation
- **Minimal abstraction**: Only what's needed, nothing more
- **Clear separation**: API, service, and integration layers
- **Type safety**: TypeScript for reliability
- **Observable**: Real-time streaming for transparency

## Architecture

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │ POST /api/quotes
       │ GET /api/quotes/:runId/stream (SSE)
       ▼
┌─────────────────────────────────┐
│      Express API Server         │
│  - Request validation           │
│  - SSE endpoint                 │
└────────────┬────────────────────┘
             │
             ▼
┌─────────────────────────────────┐
│   Quote Aggregator Service      │
│  - Parallel execution           │
│  - Progress tracking            │
│  - Result aggregation           │
└────────────┬────────────────────┘
             │
             ▼
┌─────────────────────────────────┐
│    Mino.ai Integration Layer    │
│  - Provider-specific automation │
│  - Form filling logic           │
│  - SSE stream handling          │
└─────────────────────────────────┘
```

## Setup

### Prerequisites
- Node.js 20+
- Mino.ai API key (get one at https://mino.ai/api-keys)

### Installation

1. Clone the repository:
```bash
cd Mino_Zebra_API
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment:
```bash
cp .env.example .env
# Edit .env and add your MINO_API_KEY
```

4. Start the development server:
```bash
npm run dev
```

The API will be available at `http://localhost:3000`

## API Usage

### 1. Create a Quote Request

**Endpoint**: `POST /api/quotes`

**Request Body**:
```json
{
  "vin": "12389adsfjalkdsf1",
  "employmentStatus": "EMPLOYED",
  "educationLevel": "BACHELORS",
  "phone": "555-555-5555",
  "policyStartDate": "2025-12-15",
  "mailingAddress": "321 main street",
  "isMailingSameAsGaraging": true
}
```

**Response**:
```json
{
  "runId": "abc123...",
  "status": "processing",
  "streamUrl": "/api/quotes/abc123.../stream"
}
```

### 2. Stream Real-Time Updates

**Endpoint**: `GET /api/quotes/:runId/stream`

**Response**: Server-Sent Events (SSE) stream

```
data: {"type":"progress","aggregation":{...}}

data: {"type":"progress","aggregation":{...}}

data: {"type":"complete","aggregation":{...}}
```

### 3. Get Final Results

**Endpoint**: `GET /api/quotes/:runId`

**Response**:
```json
{
  "runId": "abc123...",
  "status": "completed",
  "quotes": [
    {
      "provider": "Traders Insurance",
      "providerId": "traders",
      "status": "completed",
      "progress": 100,
      "finalQuote": 213,
      "estimatedQuote": { "min": 213, "max": 250 },
      "timestamp": "2026-01-12T..."
    },
    ...
  ],
  "totalProviders": 3,
  "completedProviders": 3
}
```

## Example Usage

### cURL

```bash
# Start a quote request
curl -X POST http://localhost:3000/api/quotes \
  -H "Content-Type: application/json" \
  -d '{
    "vin": "12389adsfjalkdsf1",
    "employmentStatus": "EMPLOYED",
    "educationLevel": "BACHELORS",
    "phone": "555-555-5555",
    "policyStartDate": "2025-12-15",
    "mailingAddress": "321 main street",
    "isMailingSameAsGaraging": true
  }'

# Stream real-time updates (use the runId from above)
curl -N http://localhost:3000/api/quotes/<runId>/stream
```

### JavaScript (fetch)

```javascript
// Start quote request
const response = await fetch('http://localhost:3000/api/quotes', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    vin: '12389adsfjalkdsf1',
    employmentStatus: 'EMPLOYED',
    educationLevel: 'BACHELORS',
    phone: '555-555-5555',
    policyStartDate: '2025-12-15',
    mailingAddress: '321 main street',
    isMailingSameAsGaraging: true,
  }),
});

const { runId, streamUrl } = await response.json();

// Listen to SSE stream
const eventSource = new EventSource(`http://localhost:3000${streamUrl}`);
eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Progress update:', data);
};
```

## Project Structure

```
Mino_Zebra_API/
├── src/
│   ├── index.ts                 # API server entry point
│   ├── config/
│   │   └── providers.ts         # Insurance provider configs
│   ├── types/
│   │   ├── user-data.ts         # User information schema
│   │   └── quote.ts             # Quote response types
│   ├── services/
│   │   ├── quote-aggregator.ts  # Orchestrates parallel quotes
│   │   └── mino-client.ts       # Mino.ai API integration
│   └── routes/
│       └── quotes.ts            # Quote endpoints
├── package.json
├── tsconfig.json
├── .env
└── README.md
```

## Development

### Run in development mode with auto-reload:
```bash
npm run dev
```

### Build for production:
```bash
npm run build
```

### Run production build:
```bash
npm start
```

## Configuration

### Environment Variables

- `MINO_API_KEY` - Your Mino.ai API key (required)
- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Environment (development/production)

### Provider Configuration

Edit `src/config/providers.ts` to:
- Add/remove insurance providers
- Customize form filling instructions
- Adjust automation goals

## Error Handling

- **400 Bad Request**: Invalid user data (missing fields, wrong format)
- **404 Not Found**: Quote run ID not found
- **500 Internal Server Error**: API key missing or automation error

## Limitations

- Demo version uses 3 test providers
- No persistent storage (quotes stored in-memory)
- No authentication required
- 90 second timeout per provider

## Future Enhancements

- Database for quote history
- User authentication
- Rate limiting
- More insurance providers
- Quote comparison UI
- Caching for similar quotes

## License

MIT

## Support

For issues with:
- **This API**: Check the console logs and verify your `.env` configuration
- **Mino.ai**: Visit https://docs.mino.ai/ or contact their support

---

Built with simplicity and performance in mind.
