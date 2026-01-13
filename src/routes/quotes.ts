import { Router, Request, Response } from 'express';
import { randomBytes } from 'crypto';
import { validateUserData } from '../types/user-data.js';
import { QuoteAggregationResult, ProgressEvent } from '../types/quote.js';
import { aggregateQuotes } from '../services/quote-aggregator.js';

const router = Router();

// In-memory storage for quote runs (in production, use Redis or database)
const quoteRuns = new Map<string, {
  status: 'processing' | 'completed';
  result?: QuoteAggregationResult;
  events: ProgressEvent[];
}>();

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

    // Initialize run storage
    quoteRuns.set(runId, {
      status: 'processing',
      events: [],
    });

    // Start aggregation in background
    aggregateQuotes(userData, apiKey, runId, (event: ProgressEvent) => {
      const run = quoteRuns.get(runId);
      if (run) {
        run.events.push(event);
      }
    })
      .then(result => {
        const run = quoteRuns.get(runId);
        if (run) {
          run.status = 'completed';
          run.result = result;
        }
      })
      .catch(error => {
        console.error(`Error in quote aggregation ${runId}:`, error);
        const run = quoteRuns.get(runId);
        if (run) {
          run.status = 'completed';
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
 * Get current status of a quote run
 */
router.get('/quotes/:runId', (req: Request, res: Response) => {
  const { runId } = req.params;
  const run = quoteRuns.get(runId);

  if (!run) {
    return res.status(404).json({
      error: 'Quote run not found',
    });
  }

  if (run.status === 'completed' && run.result) {
    return res.json(run.result);
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
router.get('/quotes/:runId/stream', (req: Request, res: Response) => {
  const { runId } = req.params;
  const run = quoteRuns.get(runId);

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

  // Poll for new events
  const intervalId = setInterval(() => {
    const currentRun = quoteRuns.get(runId);
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
      res.end();
    }
  }, 500); // Poll every 500ms

  // Cleanup on client disconnect
  req.on('close', () => {
    clearInterval(intervalId);
  });

  // Send heartbeat more frequently to keep connection alive
  const heartbeatId = setInterval(() => {
    res.write(': heartbeat\n\n');
  }, 5000); // Every 5 seconds instead of 10

  req.on('close', () => {
    clearInterval(heartbeatId);
  });
});

export default router;
