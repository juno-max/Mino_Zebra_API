/**
 * Workflow Orchestrator for Multi-Step Insurance Quote Process
 * Executes 5 sequential steps per provider for higher success rates
 */

import { randomBytes } from 'crypto';
import { EventEmitter } from 'events';
import {
  QuoteWorkflow,
  QuoteWorkflowStep,
  StepExecutionResult,
  WorkflowProgressEvent,
  WorkflowSessionData
} from '../types/workflow.js';
import { WORKFLOW_CONFIGS, fillPromptTemplate } from '../config/adaptive-workflow-prompts.js';
import { runMinoAutomation, MinoAutomationResult } from './mino-client.js';
import { UserData } from '../types/user-data.js';

export class WorkflowOrchestrator extends EventEmitter {
  private workflows: Map<string, QuoteWorkflow> = new Map();

  /**
   * Start a new workflow for a provider
   */
  async startWorkflow(
    providerId: string,
    userData: UserData,
    apiKey: string,
    runId: string
  ): Promise<QuoteWorkflow> {
    const config = WORKFLOW_CONFIGS[providerId];
    if (!config) {
      throw new Error(`No workflow configuration found for provider: ${providerId}`);
    }

    const workflowId = randomBytes(16).toString('hex');

    const workflow: QuoteWorkflow = {
      workflowId,
      runId,
      providerId,
      providerName: config.providerName,
      currentStep: 0,
      totalSteps: config.steps.length,
      steps: config.steps.map((stepConfig, index) => ({
        step: index + 1,
        name: stepConfig.name,
        description: stepConfig.description,
        minoGoalTemplate: stepConfig.promptTemplate,
        inputData: {},
        status: 'pending',
        retryCount: 0,
        maxRetries: stepConfig.maxRetries
      })),
      sessionData: {
        currentUrl: config.baseUrl
      },
      startTime: new Date(),
      status: 'initializing',
      minoRunIds: [] // Track all Mino API run IDs
    };

    this.workflows.set(workflowId, workflow);

    // Start execution in background
    this.executeWorkflow(workflow, userData, apiKey).catch(error => {
      console.error(`Workflow ${workflowId} failed:`, error);
    });

    return workflow;
  }

  /**
   * Execute all steps in the workflow sequentially
   */
  private async executeWorkflow(
    workflow: QuoteWorkflow,
    userData: UserData,
    apiKey: string
  ): Promise<void> {
    workflow.status = 'running';
    this.emitProgress(workflow, 'workflow_started', 'Workflow started');

    try {
      for (let i = 0; i < workflow.steps.length; i++) {
        const step = workflow.steps[i];
        workflow.currentStep = i + 1;

        const success = await this.executeStep(workflow, step, userData, apiKey);

        if (!success) {
          // Step failed after all retries
          workflow.status = 'failed';
          this.emitProgress(workflow, 'workflow_failed', `Workflow failed at step ${step.step}: ${step.name}`);
          return;
        }

        // Step succeeded, update workflow progress
        const progress = Math.round(((i + 1) / workflow.steps.length) * 100);
        this.emitProgress(workflow, 'step_completed', `Step ${step.step} completed: ${step.name}`, progress);
      }

      // All steps completed successfully
      workflow.status = 'completed';
      workflow.endTime = new Date();
      workflow.totalDuration = workflow.endTime.getTime() - workflow.startTime.getTime();

      // Extract final quote from last step
      const lastStep = workflow.steps[workflow.steps.length - 1];
      if (lastStep.outputData && lastStep.outputData.quote !== undefined) {
        workflow.finalQuote = {
          quote: lastStep.outputData.quote,
          estimatedMin: lastStep.outputData.estimatedMin,
          estimatedMax: lastStep.outputData.estimatedMax,
          details: lastStep.outputData.details,
          quoteReference: lastStep.outputData.quote_reference
        };
      }

      this.emitProgress(workflow, 'workflow_completed', 'Workflow completed successfully', 100);

    } catch (error) {
      workflow.status = 'failed';
      this.emitProgress(workflow, 'workflow_failed', `Workflow error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Execute a single step with retry logic
   */
  private async executeStep(
    workflow: QuoteWorkflow,
    step: QuoteWorkflowStep,
    userData: UserData,
    apiKey: string
  ): Promise<boolean> {
    while (step.retryCount <= step.maxRetries) {
      step.status = 'running';
      step.startTime = new Date();

      const retryText = step.retryCount > 0 ? ` (retry ${step.retryCount}/${step.maxRetries})` : '';
      this.emitProgress(workflow, 'step_started', `Step ${step.step} started: ${step.name}${retryText}`);

      try {
        const result = await this.executeSingleStep(workflow, step, userData, apiKey);

        step.endTime = new Date();
        step.duration = step.endTime.getTime() - step.startTime.getTime();

        if (result.success) {
          step.status = 'success';
          step.outputData = result.outputData;
          step.minoRunId = result.minoRunId;

          // Track Mino run ID in workflow array
          if (result.minoRunId) {
            workflow.minoRunIds.push(result.minoRunId);
          }

          // Update session data with output for next step
          workflow.sessionData = {
            ...workflow.sessionData,
            ...result.outputData
          };

          return true;
        } else {
          // Step failed, prepare for retry
          step.status = 'failed';
          step.error = result.error || 'Step execution failed';
          step.retryCount++;

          if (step.retryCount <= step.maxRetries) {
            // Will retry
            this.emitProgress(workflow, 'step_failed', `Step ${step.step} failed, retrying: ${step.error}`);
            await this.sleep(2000 * step.retryCount); // Exponential backoff: 2s, 4s, 6s...
          } else {
            // Max retries exceeded
            this.emitProgress(workflow, 'step_failed', `Step ${step.step} failed after ${step.maxRetries} retries: ${step.error}`);
            return false;
          }
        }
      } catch (error) {
        step.endTime = new Date();
        step.duration = step.endTime.getTime() - step.startTime.getTime();
        step.status = 'failed';
        step.error = error instanceof Error ? error.message : 'Unknown error';
        step.retryCount++;

        if (step.retryCount <= step.maxRetries) {
          this.emitProgress(workflow, 'step_failed', `Step ${step.step} error, retrying: ${step.error}`);
          await this.sleep(2000 * step.retryCount);
        } else {
          this.emitProgress(workflow, 'step_failed', `Step ${step.step} failed after ${step.maxRetries} retries: ${step.error}`);
          return false;
        }
      }
    }

    return false;
  }

  /**
   * Execute a single step by calling Mino API
   */
  private async executeSingleStep(
    workflow: QuoteWorkflow,
    step: QuoteWorkflowStep,
    userData: UserData,
    apiKey: string
  ): Promise<StepExecutionResult> {
    const startTime = Date.now();

    // Prepare template variables
    const templateVars = {
      ...userData,
      current_url: workflow.sessionData.currentUrl || '',
      ...workflow.sessionData
    };

    // Fill prompt template with actual data
    const goal = fillPromptTemplate(step.minoGoalTemplate, templateVars);

    // Call Mino API
    const result: MinoAutomationResult = await runMinoAutomation({
      url: workflow.sessionData.currentUrl || WORKFLOW_CONFIGS[workflow.providerId].baseUrl,
      goal,
      apiKey,
      browserProfile: 'lite'
    });

    const duration = Date.now() - startTime;

    // Parse result
    if (result.success && result.data && typeof result.data === 'object') {
      const output = result.data as Record<string, any>;

      return {
        success: output.success === true,
        outputData: output,
        error: output.error || undefined,
        duration,
        minoRunId: result.runId
      };
    }

    // Failed to parse or no output
    return {
      success: false,
      error: result.error || 'Failed to parse step output',
      duration,
      minoRunId: result.runId
    };
  }

  /**
   * Emit progress event
   */
  private emitProgress(
    workflow: QuoteWorkflow,
    type: WorkflowProgressEvent['type'],
    message: string,
    progress?: number
  ): void {
    const currentStep = workflow.steps[workflow.currentStep - 1];

    const event: WorkflowProgressEvent = {
      type,
      workflowId: workflow.workflowId,
      runId: workflow.runId,
      providerId: workflow.providerId,
      providerName: workflow.providerName,
      currentStep: workflow.currentStep,
      totalSteps: workflow.totalSteps,
      stepName: currentStep?.name,
      stepStatus: currentStep?.status,
      progress: progress !== undefined ? progress : Math.round((workflow.currentStep / workflow.totalSteps) * 100),
      message,
      error: currentStep?.error,
      timestamp: new Date(),
      minoRunId: currentStep?.minoRunId, // Current step's Mino run ID
      allMinoRunIds: workflow.minoRunIds // All Mino run IDs collected so far
    };

    this.emit('progress', event);
  }

  /**
   * Get workflow by ID
   */
  getWorkflow(workflowId: string): QuoteWorkflow | undefined {
    return this.workflows.get(workflowId);
  }

  /**
   * Get all workflows for a run
   */
  getWorkflowsByRunId(runId: string): QuoteWorkflow[] {
    return Array.from(this.workflows.values()).filter(w => w.runId === runId);
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Singleton instance
export const workflowOrchestrator = new WorkflowOrchestrator();
