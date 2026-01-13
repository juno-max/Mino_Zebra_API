import { EventEmitter } from 'events';
import { Quote, QuoteAggregationResult, ProgressEvent } from '../types/quote.js';
import { UserData } from '../types/user-data.js';
import { getProviderGoals } from '../config/providers.js';
import { runMinoAutomation } from './mino-client.js';

/**
 * Quote aggregator that runs parallel automations and emits progress events
 */
export class QuoteAggregator extends EventEmitter {
  private apiKey: string;
  private runId: string;
  private quotes: Map<string, Quote> = new Map();
  private startedAt: string;

  constructor(apiKey: string, runId: string) {
    super();
    this.apiKey = apiKey;
    this.runId = runId;
    this.startedAt = new Date().toISOString();
  }

  /**
   * Start aggregating quotes from all providers
   */
  async aggregate(userData: UserData): Promise<QuoteAggregationResult> {
    const providerGoals = getProviderGoals(userData);

    // Initialize quotes with pending status
    for (const { config } of providerGoals) {
      this.quotes.set(config.id, {
        provider: config.name,
        providerId: config.id,
        status: 'pending',
        progress: 0,
        timestamp: new Date().toISOString(),
      });
    }

    // Emit initial state
    this.emitProgress();

    // Run all automations in parallel
    const promises = providerGoals.map(({ config, goal }) =>
      this.runProviderAutomation(config.id, config.name, config.url, goal)
    );

    await Promise.allSettled(promises);

    // Return final aggregation
    return this.getAggregationResult('completed');
  }

  /**
   * Run automation for a single provider
   */
  private async runProviderAutomation(
    providerId: string,
    providerName: string,
    url: string,
    goal: string
  ): Promise<void> {
    let heartbeatInterval: NodeJS.Timeout | null = null;

    try {
      // Update to in_progress
      this.updateQuote(providerId, {
        status: 'in_progress',
        progress: 10,
        activity: 'Launching browser...',
      });

      // Set up heartbeat to show agent is alive
      heartbeatInterval = setInterval(() => {
        const quote = this.quotes.get(providerId);
        if (quote && quote.status === 'in_progress') {
          // Emit activity event to keep UI updated
          const event: ProgressEvent = {
            type: 'activity',
            provider: providerName,
            providerId,
            activity: quote.activity || 'Working...',
          };
          this.emit('progress', event);
        }
      }, 5000); // Heartbeat every 5 seconds

      // Run the automation
      const result = await runMinoAutomation({
        url,
        goal,
        apiKey: this.apiKey,
        timeout: 600000, // 10 minutes per provider
        browserProfile: 'lite',
        onProgress: (minoEvent) => {
          // Extract activity from Mino progress events
          let activity = 'Processing...';
          let progressPercent = 30;

          if (minoEvent.type === 'STARTED') {
            activity = 'Browser launched, navigating to site...';
            progressPercent = 20;
          } else if (minoEvent.type === 'STREAMING_URL') {
            activity = 'Live session started, interacting with page...';
            progressPercent = 40;
          } else if (minoEvent.type === 'PROGRESS' && minoEvent.purpose) {
            activity = minoEvent.purpose;
            progressPercent = 50 + Math.floor(Math.random() * 30); // 50-80%
          }

          // Update quote with activity
          this.updateQuote(providerId, {
            progress: progressPercent,
            activity,
          });

          // Emit specific activity event
          const event: ProgressEvent = {
            type: 'activity',
            provider: providerName,
            providerId,
            activity,
          };
          this.emit('progress', event);
        },
      });

      // Clear heartbeat
      if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
      }

      if (result.success && result.data) {
        // Parse the result
        const quote = this.parseQuoteResult(result.data);

        this.updateQuote(providerId, {
          status: 'completed',
          progress: 100,
          activity: 'Quote extracted successfully!',
          finalQuote: quote.quote,
          estimatedQuote: quote.estimatedMin && quote.estimatedMax
            ? { min: quote.estimatedMin, max: quote.estimatedMax }
            : undefined,
          details: quote.details,
        });
      } else {
        this.updateQuote(providerId, {
          status: 'failed',
          progress: 100,
          activity: 'Failed to get quote',
          error: result.error || 'Unknown error',
        });
      }
    } catch (error) {
      // Clear heartbeat on error
      if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
      }

      this.updateQuote(providerId, {
        status: 'failed',
        progress: 100,
        activity: 'Error occurred',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Update a quote and emit progress event
   */
  private updateQuote(providerId: string, updates: Partial<Quote>): void {
    const quote = this.quotes.get(providerId);
    if (!quote) return;

    const updatedQuote = {
      ...quote,
      ...updates,
      timestamp: new Date().toISOString(),
    };

    this.quotes.set(providerId, updatedQuote);
    this.emitProgress();
  }

  /**
   * Emit progress event with current state
   */
  private emitProgress(): void {
    const event: ProgressEvent = {
      type: 'progress',
      aggregation: this.getAggregationResult('processing'),
    };
    this.emit('progress', event);
  }

  /**
   * Get current aggregation result
   */
  private getAggregationResult(status: 'processing' | 'completed' | 'partial' | 'failed'): QuoteAggregationResult {
    const quotes = Array.from(this.quotes.values());
    const completedProviders = quotes.filter(q => q.status === 'completed' || q.status === 'failed').length;

    return {
      runId: this.runId,
      status,
      quotes,
      startedAt: this.startedAt,
      completedAt: completedProviders === quotes.length ? new Date().toISOString() : undefined,
      totalProviders: quotes.length,
      completedProviders,
    };
  }

  /**
   * Parse quote result from Mino automation
   */
  private parseQuoteResult(data: any): {
    quote: number | null;
    estimatedMin: number | null;
    estimatedMax: number | null;
    details: string | null;
  } {
    try {
      // Handle different response formats
      if (typeof data === 'object' && data !== null) {
        return {
          quote: typeof data.quote === 'number' ? data.quote : null,
          estimatedMin: typeof data.estimatedMin === 'number' ? data.estimatedMin : null,
          estimatedMax: typeof data.estimatedMax === 'number' ? data.estimatedMax : null,
          details: typeof data.details === 'string' ? data.details : null,
        };
      }

      return {
        quote: null,
        estimatedMin: null,
        estimatedMax: null,
        details: 'Unable to parse quote data',
      };
    } catch {
      return {
        quote: null,
        estimatedMin: null,
        estimatedMax: null,
        details: 'Error parsing quote data',
      };
    }
  }
}

/**
 * Create and run a quote aggregation
 */
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
