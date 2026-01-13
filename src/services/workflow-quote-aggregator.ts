/**
 * NEW Workflow-based Quote Aggregator
 * Uses multi-step workflow orchestrator for higher success rates
 */

import { EventEmitter } from 'events';
import { Quote, QuoteAggregationResult, ProgressEvent } from '../types/quote.js';
import { UserData } from '../types/user-data.js';
import { workflowOrchestrator } from './workflow-orchestrator.js';
import { getAllProviders } from '../config/adaptive-workflow-prompts.js';
import { WorkflowProgressEvent } from '../types/workflow.js';

export class WorkflowQuoteAggregator extends EventEmitter {
  private apiKey: string;
  private runId: string;
  private quotes: Map<string, Quote> = new Map();
  private startedAt: string;
  private workflowIds: Map<string, string> = new Map(); // providerId -> workflowId

  constructor(apiKey: string, runId: string) {
    super();
    this.apiKey = apiKey;
    this.runId = runId;
    this.startedAt = new Date().toISOString();
  }

  /**
   * Start aggregating quotes using multi-step workflows
   */
  async aggregate(userData: UserData): Promise<QuoteAggregationResult> {
    const providerIds = getAllProviders();

    // Initialize quotes with pending status
    for (const providerId of providerIds) {
      const providerName = this.getProviderName(providerId);
      this.quotes.set(providerId, {
        provider: providerName,
        providerId,
        status: 'pending',
        progress: 0,
        timestamp: new Date().toISOString(),
      });
    }

    // Emit initial state
    this.emitProgress();

    // Set up workflow progress listener
    workflowOrchestrator.on('progress', (event: WorkflowProgressEvent) => {
      this.handleWorkflowProgress(event);
    });

    // Start all workflows in parallel
    const promises = providerIds.map(providerId =>
      this.startProviderWorkflow(providerId, userData)
    );

    await Promise.allSettled(promises);

    // Clean up listener
    workflowOrchestrator.removeAllListeners('progress');

    // Return final aggregation
    return this.getAggregationResult('completed');
  }

  /**
   * Start workflow for a single provider
   */
  private async startProviderWorkflow(
    providerId: string,
    userData: UserData
  ): Promise<void> {
    try {
      // Initialize as in_progress
      this.updateQuote(providerId, {
        status: 'in_progress',
        progress: 5,
        activity: 'Starting multi-step workflow...',
      });

      // Start the workflow
      const workflow = await workflowOrchestrator.startWorkflow(
        providerId,
        userData,
        this.apiKey,
        this.runId
      );

      this.workflowIds.set(providerId, workflow.workflowId);

      // Wait for workflow to complete (orchestrator emits progress)
      // The workflow runs in background, we just wait for completion
      await this.waitForWorkflowCompletion(workflow.workflowId);

      // Get final workflow state
      const completedWorkflow = workflowOrchestrator.getWorkflow(workflow.workflowId);
      if (!completedWorkflow) {
        throw new Error('Workflow not found after completion');
      }

      // Update quote with final result
      if (completedWorkflow.status === 'completed' && completedWorkflow.finalQuote) {
        this.updateQuote(providerId, {
          status: 'completed',
          progress: 100,
          activity: 'All steps completed successfully!',
          finalQuote: completedWorkflow.finalQuote.quote ?? undefined,
          estimatedQuote: completedWorkflow.finalQuote.estimatedMin && completedWorkflow.finalQuote.estimatedMax
            ? {
                min: completedWorkflow.finalQuote.estimatedMin,
                max: completedWorkflow.finalQuote.estimatedMax
              }
            : undefined,
          details: completedWorkflow.finalQuote.details,
        });
      } else {
        // Workflow failed or partial
        const lastStep = completedWorkflow.steps[completedWorkflow.steps.length - 1];
        this.updateQuote(providerId, {
          status: 'failed',
          progress: 100,
          activity: `Failed at step ${completedWorkflow.currentStep}`,
          error: lastStep?.error || 'Workflow did not complete successfully',
        });
      }
    } catch (error) {
      this.updateQuote(providerId, {
        status: 'failed',
        progress: 100,
        activity: 'Workflow error',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Handle workflow progress events
   */
  private handleWorkflowProgress(event: WorkflowProgressEvent): void {
    const { providerId, currentStep, totalSteps, stepName, message, progress: workflowProgress, minoRunId, allMinoRunIds } = event;

    // Calculate overall progress (0-100)
    const progress = workflowProgress || (currentStep && totalSteps ? Math.round((currentStep / totalSteps) * 100) : 0);

    // Build activity message
    let activity = message;
    if (currentStep && totalSteps && stepName) {
      activity = `Step ${currentStep}/${totalSteps}: ${stepName}`;
    }

    // Update quote with Mino run IDs
    this.updateQuote(providerId, {
      progress,
      activity,
      currentStepMinoRunId: minoRunId,
      allMinoRunIds: allMinoRunIds,
    });

    // Emit specific activity event for frontend
    const activityEvent: ProgressEvent = {
      type: 'activity',
      provider: this.getProviderName(providerId),
      providerId,
      activity,
      minoRunId, // Include Mino run ID for current step
    };
    this.emit('progress', activityEvent);
  }

  /**
   * Wait for workflow to complete
   */
  private async waitForWorkflowCompletion(workflowId: string): Promise<void> {
    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        const workflow = workflowOrchestrator.getWorkflow(workflowId);
        if (workflow && (workflow.status === 'completed' || workflow.status === 'failed')) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 1000); // Check every second

      // Timeout after 25 minutes (5 steps × 5 min max each)
      setTimeout(() => {
        clearInterval(checkInterval);
        resolve();
      }, 1500000); // 25 minutes
    });
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
   * Get provider display name from ID
   */
  private getProviderName(providerId: string): string {
    const nameMap: Record<string, string> = {
      geico: 'GEICO',
      progressive: 'Progressive',
      statefarm: 'State Farm',
      allstate: 'Allstate',
      libertymutual: 'Liberty Mutual',
      nationwide: 'Nationwide',
      farmers: 'Farmers Insurance',
      usaa: 'USAA',
      travelers: 'Travelers',
      americanfamily: 'American Family'
    };
    return nameMap[providerId] || providerId.toUpperCase();
  }
}

/**
 * Create and run a workflow-based quote aggregation
 * Drop-in replacement for old aggregateQuotes function
 */
export async function aggregateQuotesWithWorkflow(
  userData: UserData,
  apiKey: string,
  runId: string,
  onProgress?: (event: ProgressEvent) => void
): Promise<QuoteAggregationResult> {
  const aggregator = new WorkflowQuoteAggregator(apiKey, runId);

  if (onProgress) {
    aggregator.on('progress', onProgress);
  }

  const result = await aggregator.aggregate(userData);

  aggregator.removeAllListeners();
  return result;
}
