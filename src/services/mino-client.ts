import { MinoEvent } from '../types/quote.js';

/**
 * Configuration for Mino automation
 */
export interface MinoAutomationConfig {
  url: string;
  goal: string;
  apiKey: string;
  timeout?: number; // milliseconds
  browserProfile?: 'lite' | 'stealth';
  onProgress?: (event: MinoEvent) => void; // Callback for progress updates
}

/**
 * Result from Mino automation
 */
export interface MinoAutomationResult {
  success: boolean;
  data?: any;
  error?: string;
  runId?: string;
}

/**
 * Parse SSE event line
 */
function parseSSELine(line: string): MinoEvent | null {
  if (!line.startsWith('data: ')) {
    return null;
  }

  const data = line.slice(6).trim();
  if (!data || data === '[DONE]') {
    return null;
  }

  try {
    return JSON.parse(data) as MinoEvent;
  } catch (e) {
    console.error('Failed to parse SSE event:', data);
    return null;
  }
}

/**
 * Run a Mino.ai automation and return the result
 * Handles SSE streaming and extracts the final result
 */
export async function runMinoAutomation(config: MinoAutomationConfig): Promise<MinoAutomationResult> {
  const { url, goal, apiKey, timeout = 600000, browserProfile = 'lite', onProgress } = config;

  try {
    const response = await fetch('https://mino.ai/v1/automation/run-sse', {
      method: 'POST',
      headers: {
        'X-API-Key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url,
        goal,
        browser_profile: browserProfile,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        success: false,
        error: `Mino API error (${response.status}): ${errorText}`,
      };
    }

    if (!response.body) {
      return {
        success: false,
        error: 'No response body from Mino API',
      };
    }

    // Create a timeout promise
    const timeoutPromise = new Promise<MinoAutomationResult>((_, reject) => {
      setTimeout(() => reject(new Error('Automation timeout')), timeout);
    });

    // Parse SSE stream
    const streamPromise = new Promise<MinoAutomationResult>(async (resolve) => {
      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let runId: string | undefined;

      try {
        while (true) {
          const { done, value } = await reader.read();

          if (done) {
            break;
          }

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const event = parseSSELine(line);
            if (!event) continue;

            // Store runId from first event
            if (event.runId && !runId) {
              runId = event.runId;
            }

            // Emit progress events to callback
            if (onProgress && (event.type === 'STARTED' || event.type === 'PROGRESS' || event.type === 'STREAMING_URL')) {
              onProgress(event);
            }

            // Handle completion event
            if (event.type === 'COMPLETE') {
              if (event.status === 'COMPLETED' && event.resultJson) {
                resolve({
                  success: true,
                  data: event.resultJson,
                  runId,
                });
                return;
              } else {
                resolve({
                  success: false,
                  error: event.error || `Automation failed with status: ${event.status}`,
                  runId,
                });
                return;
              }
            }
          }
        }

        // If we exit the loop without a COMPLETE event
        resolve({
          success: false,
          error: 'Stream ended without completion event',
          runId,
        });
      } catch (e) {
        resolve({
          success: false,
          error: e instanceof Error ? e.message : 'Unknown error reading stream',
          runId,
        });
      }
    });

    // Race between timeout and stream completion
    return await Promise.race([streamPromise, timeoutPromise]);
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : 'Unknown error',
    };
  }
}

/**
 * Test the Mino API connection
 */
export async function testMinoConnection(apiKey: string): Promise<boolean> {
  try {
    const result = await runMinoAutomation({
      url: 'https://example.com',
      goal: 'Get the page title',
      apiKey,
      timeout: 10000,
    });
    return result.success;
  } catch {
    return false;
  }
}
