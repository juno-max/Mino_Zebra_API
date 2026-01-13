/**
 * Multi-Step Workflow Types for Insurance Quote Process
 * Based on Mino best practices - break complex tasks into sequential steps
 */

export type StepStatus = 'pending' | 'running' | 'success' | 'failed' | 'skipped';

export interface QuoteWorkflowStep {
  step: number;
  name: string;
  description: string;
  minoGoalTemplate: string;
  inputData: Record<string, any>;
  outputData?: Record<string, any>;
  status: StepStatus;
  startTime?: Date;
  endTime?: Date;
  duration?: number; // milliseconds
  error?: string;
  retryCount: number;
  maxRetries: number;
  minoRunId?: string;
}

export interface WorkflowSessionData {
  currentUrl?: string;
  cookies?: string;
  formState?: Record<string, any>;
  sessionId?: string;
  quoteReference?: string;
  [key: string]: any;
}

export interface QuoteWorkflow {
  workflowId: string;
  runId: string;
  providerId: string;
  providerName: string;
  currentStep: number;
  totalSteps: number;
  steps: QuoteWorkflowStep[];
  sessionData: WorkflowSessionData;
  startTime: Date;
  endTime?: Date;
  totalDuration?: number;
  finalQuote?: {
    quote: number | null;
    estimatedMin?: number | null;
    estimatedMax?: number | null;
    details?: string;
    quoteReference?: string;
  };
  status: 'initializing' | 'running' | 'completed' | 'failed' | 'partial';
  minoRunIds: string[]; // Track all Mino API run IDs (one per step)
}

export interface StepPromptTemplate {
  step: number;
  name: string;
  description: string;
  promptTemplate: string;
  expectedOutput: {
    schema: Record<string, string>;
    required: string[];
  };
  timeout: number; // milliseconds
  maxRetries: number;
}

export interface ProviderWorkflowConfig {
  providerId: string;
  providerName: string;
  baseUrl: string;
  steps: StepPromptTemplate[];
  requiresAgentContact?: boolean; // Some providers don't offer online quotes
  specialHandling?: string; // Notes about provider-specific quirks
}

/**
 * Result from a single workflow step execution
 */
export interface StepExecutionResult {
  success: boolean;
  outputData?: Record<string, any>;
  error?: string;
  duration: number;
  minoRunId?: string;
}

/**
 * Progress event emitted during workflow execution
 */
export interface WorkflowProgressEvent {
  type: 'workflow_started' | 'step_started' | 'step_completed' | 'step_failed' | 'workflow_completed' | 'workflow_failed';
  workflowId: string;
  runId: string;
  providerId: string;
  providerName: string;
  currentStep?: number;
  totalSteps: number;
  stepName?: string;
  stepStatus?: StepStatus;
  progress: number; // 0-100
  message: string;
  error?: string;
  timestamp: Date;
  minoRunId?: string; // Current step's Mino run ID
  allMinoRunIds?: string[]; // All Mino run IDs for this workflow so far
}
