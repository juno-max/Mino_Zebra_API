/**
 * Status of a quote request for a single provider
 */
export type QuoteStatus = 'pending' | 'in_progress' | 'completed' | 'failed';

/**
 * Quote result from a single insurance provider
 */
export interface Quote {
  provider: string;
  providerId: string;
  status: QuoteStatus;
  progress: number; // 0-100
  activity?: string; // Current activity description from agent
  estimatedQuote?: {
    min: number;
    max: number;
  };
  finalQuote?: number;
  details?: string;
  error?: string;
  timestamp: string;
  currentStepMinoRunId?: string; // Mino run ID for current step
  allMinoRunIds?: string[]; // All Mino run IDs collected so far (one per step)
}

/**
 * Aggregated quote response with all providers
 */
export interface QuoteAggregationResult {
  runId: string;
  status: 'processing' | 'completed' | 'partial' | 'failed';
  quotes: Quote[];
  startedAt: string;
  completedAt?: string;
  totalProviders: number;
  completedProviders: number;
}

/**
 * SSE event types from Mino.ai API
 */
export type MinoEventType = 'STARTED' | 'STREAMING_URL' | 'PROGRESS' | 'COMPLETE' | 'HEARTBEAT';

/**
 * Mino.ai SSE event structure
 */
export interface MinoEvent {
  type: MinoEventType;
  runId?: string;
  timestamp?: string;
  streamingUrl?: string;
  purpose?: string;
  status?: 'COMPLETED' | 'FAILED' | 'CANCELLED';
  error?: string;
  resultJson?: any;
}

/**
 * Progress update event for SSE streaming to client
 */
export interface ProgressEvent {
  type: 'progress' | 'complete' | 'error' | 'activity';
  provider?: string;
  providerId?: string;
  activity?: string; // Agent activity description
  quote?: Quote;
  aggregation?: QuoteAggregationResult;
  minoRunId?: string; // Mino run ID for current step (for activity events)
}
