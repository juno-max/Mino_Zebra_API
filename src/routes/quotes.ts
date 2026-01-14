import { Router, Request, Response } from 'express';
import { randomBytes } from 'crypto';
import { validateUserData } from '../types/user-data.js';
import { QuoteAggregationResult, ProgressEvent } from '../types/quote.js';
import { aggregateQuotes } from '../services/quote-aggregator.js';
import { kv as vercelKV } from '@vercel/kv';

const router = Router();

// KV instance - automatically configured from environment variables
// Will be available in production with KV_REST_API_URL and KV_REST_API_TOKEN
const kv = process.env.KV_REST_API_URL ? vercelKV : null;

// Shared storage interface - works with both Vercel KV and in-memory fallback
interface QuoteRunData {
  status: 'processing' | 'completed';
  result?: QuoteAggregationResult;
  events: ProgressEvent[];
}

// In-memory fallback for local development
const localQuoteRuns = new Map<string, QuoteRunData>();

// Storage helpers that work with both KV and local
async function getQuoteRun(runId: string): Promise<QuoteRunData | null> {
  if (kv) {
    // Use Vercel KV in production
    return await kv.get<QuoteRunData>(`quote:${runId}`);
  } else {
    // Use in-memory for local development
    return localQuoteRuns.get(runId) || null;
  }
}

async function setQuoteRun(runId: string, data: QuoteRunData): Promise<void> {
  if (kv) {
    // Use Vercel KV with 2-hour expiration
    await kv.set(`quote:${runId}`, data, { ex: 7200 });
  } else {
    // Use in-memory for local development
    localQuoteRuns.set(runId, data);
  }
}

async function updateQuoteRunEvents(runId: string, event: ProgressEvent): Promise<void> {
  const run = await getQuoteRun(runId);
  if (run) {
    run.events.push(event);
    await setQuoteRun(runId, run);
  }
}

/**
 * POST /api/quotes
 * Start a new quote aggregation
 */
router.post('/quotes', async (req: Request, res: Response) => {
  try {
    // Validate user data
    const validation = validateUserData(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: 'Invalid user data',
        details: validation.errors,
      });
    }

    const userData = validation.data;

    // Get API key from environment
    const apiKey = process.env.MINO_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        error: 'Server configuration error',
        details: 'MINO_API_KEY not configured',
      });
    }

    // Generate unique run ID
    const runId = randomBytes(16).toString('hex');

    // Initialize run storage in shared storage
    await setQuoteRun(runId, {
      status: 'processing',
      events: [],
    });

    // Start aggregation in background - ONE API call per provider
    aggregateQuotes(userData, apiKey, runId, async (event: ProgressEvent) => {
      await updateQuoteRunEvents(runId, event);
    })
      .then(async result => {
        const run = await getQuoteRun(runId);
        if (run) {
          run.status = 'completed';
          run.result = result;
          await setQuoteRun(runId, run);
        }
      })
      .catch(async error => {
        console.error(`Error in quote aggregation ${runId}:`, error);
        const run = await getQuoteRun(runId);
        if (run) {
          run.status = 'completed';
          await setQuoteRun(runId, run);
        }
      });

    // Return run ID immediately
    return res.json({
      runId,
      status: 'processing',
      streamUrl: `/api/quotes/${runId}/stream`,
    });
  } catch (error) {
    console.error('Error starting quote aggregation:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/quotes/:runId
 * Get current status of a quote run (supports HTTP polling fallback)
 */
router.get('/quotes/:runId', async (req: Request, res: Response) => {
  const { runId } = req.params;
  const run = await getQuoteRun(runId);

  if (!run) {
    return res.status(404).json({
      error: 'Quote run not found',
    });
  }

  if (run.status === 'completed' && run.result) {
    return res.json(run.result);
  }

  // Return current progress for HTTP polling fallback
  // Find the latest progress event
  const progressEvents = run.events.filter(e => e.type === 'progress' || e.type === 'complete');
  const latestProgress = progressEvents[progressEvents.length - 1];

  if (latestProgress && latestProgress.aggregation) {
    return res.json(latestProgress.aggregation);
  }

  return res.json({
    runId,
    status: 'processing',
    streamUrl: `/api/quotes/${runId}/stream`,
  });
});

/**
 * GET /api/quotes/:runId/stream
 * SSE endpoint for real-time quote updates with reconnection support
 */
router.get('/quotes/:runId/stream', async (req: Request, res: Response) => {
  const { runId } = req.params;
  const run = await getQuoteRun(runId);

  if (!run) {
    return res.status(404).json({
      error: 'Quote run not found',
    });
  }

  // Set SSE headers with longer timeout
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering

  // Support reconnection - check Last-Event-ID
  const lastEventId = req.headers['last-event-id'];
  const lastEventIdStr = Array.isArray(lastEventId) ? lastEventId[0] : lastEventId;
  let lastEventIndex = lastEventIdStr ? parseInt(lastEventIdStr, 10) + 1 : 0;

  // Send existing events (from lastEventIndex onwards)
  for (let i = lastEventIndex; i < run.events.length; i++) {
    res.write(`id: ${i}\n`);
    res.write(`data: ${JSON.stringify(run.events[i])}\n\n`);
    lastEventIndex = i + 1;
  }

  // Poll for new events from shared storage
  const intervalId = setInterval(async () => {
    const currentRun = await getQuoteRun(runId);
    if (!currentRun) {
      clearInterval(intervalId);
      res.end();
      return;
    }

    // Send new events with IDs
    for (let i = lastEventIndex; i < currentRun.events.length; i++) {
      res.write(`id: ${i}\n`);
      res.write(`data: ${JSON.stringify(currentRun.events[i])}\n\n`);
      lastEventIndex = i + 1;
    }

    // Check if completed
    if (currentRun.status === 'completed') {
      // Send final result with ID
      if (currentRun.result) {
        res.write(`id: ${lastEventIndex}\n`);
        res.write(`data: ${JSON.stringify({
          type: 'complete',
          aggregation: currentRun.result,
        })}\n\n`);
      }
      clearInterval(intervalId);
      clearInterval(heartbeatId);
      clearTimeout(gracefulTimeoutId);
      res.end();
    }
  }, 500); // Poll every 500ms

  // Send heartbeat more frequently to keep connection alive
  const heartbeatId = setInterval(() => {
    res.write(': heartbeat\n\n');
  }, 5000); // Every 5 seconds

  // Graceful timeout: Close connection after 4 minutes to avoid Vercel timeout (5 min max)
  // Client will automatically reconnect and resume from last event ID
  const gracefulTimeoutId = setTimeout(() => {
    console.log(`SSE stream ${runId}: Graceful timeout, closing connection for reconnect`);
    clearInterval(intervalId);
    clearInterval(heartbeatId);

    // Send a reconnect message before closing
    res.write(`: reconnect-needed\n\n`);

    // Close the connection gracefully
    res.end();
  }, 240000); // 4 minutes (240 seconds) - before Vercel's 5-minute limit

  // Cleanup on client disconnect
  req.on('close', () => {
    clearInterval(intervalId);
    clearInterval(heartbeatId);
    clearTimeout(gracefulTimeoutId);
  });
});

export default router;
