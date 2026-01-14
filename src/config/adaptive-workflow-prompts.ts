/**
 * SIMPLIFIED Goal-Oriented Workflow Prompts
 * Let the Mino AI agent decide the best approach for each provider
 */

import { ProviderWorkflowConfig } from '../types/workflow.js';

/**
 * Simple goal-oriented prompts that let the agent be autonomous
 */
const SIMPLE_GOAL_PROMPTS = {
  step1_find_form: (providerName: string, baseUrl: string) => `
Go to ${baseUrl} and find the auto insurance quote form. Click any buttons needed to access the quote form.

Return JSON: {"form_accessible": true, "success": true}
`,

  step2_start_quote: (providerName: string) => `
Start an auto insurance quote for:
- ZIP: {{zipcode}}
- Vehicle: {{year}} {{make}} {{model}}
- VIN: {{vin}}

Fill whatever fields are on this page and continue to the next step.

Return JSON: {"fields_filled": true, "success": true}
`,

  step3_driver_details: (providerName: string) => `
Complete driver information section with:
- Name: {{firstName}} {{lastName}}
- Date of Birth: {{dateOfBirth}}
- Email: {{email}}
- Phone: {{phone}}
- Gender: {{gender}}
- Marital Status: {{maritalStatus}}

Fill whatever driver fields are present and continue.

Return JSON: {"driver_info_completed": true, "success": true}
`,

  step4_vehicle_and_address: (providerName: string) => `
Complete vehicle and address information with:
- Address: {{mailingAddress}}, {{city}}, {{state}} {{zipcode}}
- VIN: {{vin}}
- Policy Start Date: {{policyStartDate}}
- Employment: {{employmentStatus}}
- Education: {{educationLevel}}

Fill whatever fields are present and continue.

Return JSON: {"vehicle_address_completed": true, "success": true}
`,

  step5_get_quote: (providerName: string) => `
Complete any remaining steps and extract the final insurance quote.

Look for the monthly premium amount on the page. It might say "$XXX/month", "$XXX per month", or "$XXX monthly premium".

If the site says "call for quote" or "agent required", return: {"quote": null, "details": "Requires agent contact", "success": true}

Otherwise return: {"quote": <monthly_amount_as_number>, "success": true}
`
};

/**
 * Helper to fill prompt template with user data
 */
export function fillPromptTemplate(template: string, data: Record<string, any>): string {
  let filled = template;
  for (const [key, value] of Object.entries(data)) {
    const placeholder = `{{${key}}}`;
    filled = filled.replace(new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g'), String(value || ''));
  }
  return filled;
}

/**
 * Workflow configurations for all 10 providers
 */
export const WORKFLOW_CONFIGS: Record<string, ProviderWorkflowConfig> = {
  geico: {
    providerId: 'geico',
    providerName: 'GEICO',
    baseUrl: 'https://www.geico.com/',
    steps: [
      {
        step: 1,
        name: 'Form Discovery',
        description: 'Find and access quote form',
        promptTemplate: SIMPLE_GOAL_PROMPTS.step1_find_form('GEICO', 'https://www.geico.com/'),
        expectedOutput: { schema: { form_accessible: 'boolean', success: 'boolean' }, required: ['success'] },
        timeout: 120000,
        maxRetries: 2
      },
      {
        step: 2,
        name: 'Initial Entry',
        description: 'Enter ZIP and vehicle info',
        promptTemplate: SIMPLE_GOAL_PROMPTS.step2_start_quote('GEICO'),
        expectedOutput: { schema: { fields_filled: 'boolean', success: 'boolean' }, required: ['success'] },
        timeout: 180000,
        maxRetries: 2
      },
      {
        step: 3,
        name: 'Driver Information',
        description: 'Complete driver details',
        promptTemplate: SIMPLE_GOAL_PROMPTS.step3_driver_details('GEICO'),
        expectedOutput: { schema: { driver_info_completed: 'boolean', success: 'boolean' }, required: ['success'] },
        timeout: 240000,
        maxRetries: 2
      },
      {
        step: 4,
        name: 'Vehicle & Address',
        description: 'Complete vehicle and address',
        promptTemplate: SIMPLE_GOAL_PROMPTS.step4_vehicle_and_address('GEICO'),
        expectedOutput: { schema: { vehicle_address_completed: 'boolean', success: 'boolean' }, required: ['success'] },
        timeout: 240000,
        maxRetries: 2
      },
      {
        step: 5,
        name: 'Quote Extraction',
        description: 'Get final quote',
        promptTemplate: SIMPLE_GOAL_PROMPTS.step5_get_quote('GEICO'),
        expectedOutput: { schema: { quote: 'number|null', success: 'boolean' }, required: ['success'] },
        timeout: 300000,
        maxRetries: 2
      }
    ]
  },

  progressive: {
    providerId: 'progressive',
    providerName: 'Progressive',
    baseUrl: 'https://www.progressive.com/',
    steps: [
      {
        step: 1,
        name: 'Form Discovery',
        description: 'Find and access quote form',
        promptTemplate: SIMPLE_GOAL_PROMPTS.step1_find_form('Progressive', 'https://www.progressive.com/'),
        expectedOutput: { schema: { form_accessible: 'boolean', success: 'boolean' }, required: ['success'] },
        timeout: 120000,
        maxRetries: 2
      },
      {
        step: 2,
        name: 'Initial Entry',
        description: 'Enter ZIP and vehicle info',
        promptTemplate: SIMPLE_GOAL_PROMPTS.step2_start_quote('Progressive'),
        expectedOutput: { schema: { fields_filled: 'boolean', success: 'boolean' }, required: ['success'] },
        timeout: 180000,
        maxRetries: 2
      },
      {
        step: 3,
        name: 'Driver Information',
        description: 'Complete driver details',
        promptTemplate: SIMPLE_GOAL_PROMPTS.step3_driver_details('Progressive'),
        expectedOutput: { schema: { driver_info_completed: 'boolean', success: 'boolean' }, required: ['success'] },
        timeout: 240000,
        maxRetries: 2
      },
      {
        step: 4,
        name: 'Vehicle & Address',
        description: 'Complete vehicle and address',
        promptTemplate: SIMPLE_GOAL_PROMPTS.step4_vehicle_and_address('Progressive'),
        expectedOutput: { schema: { vehicle_address_completed: 'boolean', success: 'boolean' }, required: ['success'] },
        timeout: 240000,
        maxRetries: 2
      },
      {
        step: 5,
        name: 'Quote Extraction',
        description: 'Get final quote',
        promptTemplate: SIMPLE_GOAL_PROMPTS.step5_get_quote('Progressive'),
        expectedOutput: { schema: { quote: 'number|null', success: 'boolean' }, required: ['success'] },
        timeout: 300000,
        maxRetries: 2
      }
    ]
  },

  statefarm: {
    providerId: 'statefarm',
    providerName: 'State Farm',
    baseUrl: 'https://www.statefarm.com/',
    steps: [
      {
        step: 1,
        name: 'Form Discovery',
        description: 'Find and access quote form',
        promptTemplate: SIMPLE_GOAL_PROMPTS.step1_find_form('State Farm', 'https://www.statefarm.com/'),
        expectedOutput: { schema: { form_accessible: 'boolean', success: 'boolean' }, required: ['success'] },
        timeout: 120000,
        maxRetries: 2
      },
      {
        step: 2,
        name: 'Initial Entry',
        description: 'Enter ZIP and vehicle info',
        promptTemplate: SIMPLE_GOAL_PROMPTS.step2_start_quote('State Farm'),
        expectedOutput: { schema: { fields_filled: 'boolean', success: 'boolean' }, required: ['success'] },
        timeout: 180000,
        maxRetries: 2
      },
      {
        step: 3,
        name: 'Driver Information',
        description: 'Complete driver details',
        promptTemplate: SIMPLE_GOAL_PROMPTS.step3_driver_details('State Farm'),
        expectedOutput: { schema: { driver_info_completed: 'boolean', success: 'boolean' }, required: ['success'] },
        timeout: 240000,
        maxRetries: 2
      },
      {
        step: 4,
        name: 'Vehicle & Address',
        description: 'Complete vehicle and address',
        promptTemplate: SIMPLE_GOAL_PROMPTS.step4_vehicle_and_address('State Farm'),
        expectedOutput: { schema: { vehicle_address_completed: 'boolean', success: 'boolean' }, required: ['success'] },
        timeout: 240000,
        maxRetries: 2
      },
      {
        step: 5,
        name: 'Quote Extraction',
        description: 'Get final quote',
        promptTemplate: SIMPLE_GOAL_PROMPTS.step5_get_quote('State Farm'),
        expectedOutput: { schema: { quote: 'number|null', success: 'boolean' }, required: ['success'] },
        timeout: 300000,
        maxRetries: 2
      }
    ],
    requiresAgentContact: true,
    specialHandling: 'State Farm often requires agent contact for final quote'
  },

  allstate: {
    providerId: 'allstate',
    providerName: 'Allstate',
    baseUrl: 'https://www.allstate.com/',
    steps: [
      {
        step: 1,
        name: 'Form Discovery',
        description: 'Find and access quote form',
        promptTemplate: SIMPLE_GOAL_PROMPTS.step1_find_form('Allstate', 'https://www.allstate.com/'),
        expectedOutput: { schema: { form_accessible: 'boolean', success: 'boolean' }, required: ['success'] },
        timeout: 120000,
        maxRetries: 2
      },
      {
        step: 2,
        name: 'Initial Entry',
        description: 'Enter ZIP and vehicle info',
        promptTemplate: SIMPLE_GOAL_PROMPTS.step2_start_quote('Allstate'),
        expectedOutput: { schema: { fields_filled: 'boolean', success: 'boolean' }, required: ['success'] },
        timeout: 180000,
        maxRetries: 2
      },
      {
        step: 3,
        name: 'Driver Information',
        description: 'Complete driver details',
        promptTemplate: SIMPLE_GOAL_PROMPTS.step3_driver_details('Allstate'),
        expectedOutput: { schema: { driver_info_completed: 'boolean', success: 'boolean' }, required: ['success'] },
        timeout: 240000,
        maxRetries: 2
      },
      {
        step: 4,
        name: 'Vehicle & Address',
        description: 'Complete vehicle and address',
        promptTemplate: SIMPLE_GOAL_PROMPTS.step4_vehicle_and_address('Allstate'),
        expectedOutput: { schema: { vehicle_address_completed: 'boolean', success: 'boolean' }, required: ['success'] },
        timeout: 240000,
        maxRetries: 2
      },
      {
        step: 5,
        name: 'Quote Extraction',
        description: 'Get final quote',
        promptTemplate: SIMPLE_GOAL_PROMPTS.step5_get_quote('Allstate'),
        expectedOutput: { schema: { quote: 'number|null', success: 'boolean' }, required: ['success'] },
        timeout: 300000,
        maxRetries: 2
      }
    ]
  },

  libertymutual: {
    providerId: 'libertymutual',
    providerName: 'Liberty Mutual',
    baseUrl: 'https://www.libertymutual.com/',
    steps: [
      {
        step: 1,
        name: 'Form Discovery',
        description: 'Find and access quote form',
        promptTemplate: SIMPLE_GOAL_PROMPTS.step1_find_form('Liberty Mutual', 'https://www.libertymutual.com/'),
        expectedOutput: { schema: { form_accessible: 'boolean', success: 'boolean' }, required: ['success'] },
        timeout: 120000,
        maxRetries: 2
      },
      {
        step: 2,
        name: 'Initial Entry',
        description: 'Enter ZIP and vehicle info',
        promptTemplate: SIMPLE_GOAL_PROMPTS.step2_start_quote('Liberty Mutual'),
        expectedOutput: { schema: { fields_filled: 'boolean', success: 'boolean' }, required: ['success'] },
        timeout: 180000,
        maxRetries: 2
      },
      {
        step: 3,
        name: 'Driver Information',
        description: 'Complete driver details',
        promptTemplate: SIMPLE_GOAL_PROMPTS.step3_driver_details('Liberty Mutual'),
        expectedOutput: { schema: { driver_info_completed: 'boolean', success: 'boolean' }, required: ['success'] },
        timeout: 240000,
        maxRetries: 2
      },
      {
        step: 4,
        name: 'Vehicle & Address',
        description: 'Complete vehicle and address',
        promptTemplate: SIMPLE_GOAL_PROMPTS.step4_vehicle_and_address('Liberty Mutual'),
        expectedOutput: { schema: { vehicle_address_completed: 'boolean', success: 'boolean' }, required: ['success'] },
        timeout: 240000,
        maxRetries: 2
      },
      {
        step: 5,
        name: 'Quote Extraction',
        description: 'Get final quote',
        promptTemplate: SIMPLE_GOAL_PROMPTS.step5_get_quote('Liberty Mutual'),
        expectedOutput: { schema: { quote: 'number|null', success: 'boolean' }, required: ['success'] },
        timeout: 300000,
        maxRetries: 2
      }
    ]
  },

  nationwide: {
    providerId: 'nationwide',
    providerName: 'Nationwide',
    baseUrl: 'https://www.nationwide.com/',
    steps: [
      {
        step: 1,
        name: 'Form Discovery',
        description: 'Find and access quote form',
        promptTemplate: SIMPLE_GOAL_PROMPTS.step1_find_form('Nationwide', 'https://www.nationwide.com/'),
        expectedOutput: { schema: { form_accessible: 'boolean', success: 'boolean' }, required: ['success'] },
        timeout: 120000,
        maxRetries: 2
      },
      {
        step: 2,
        name: 'Initial Entry',
        description: 'Enter ZIP and vehicle info',
        promptTemplate: SIMPLE_GOAL_PROMPTS.step2_start_quote('Nationwide'),
        expectedOutput: { schema: { fields_filled: 'boolean', success: 'boolean' }, required: ['success'] },
        timeout: 180000,
        maxRetries: 2
      },
      {
        step: 3,
        name: 'Driver Information',
        description: 'Complete driver details',
        promptTemplate: SIMPLE_GOAL_PROMPTS.step3_driver_details('Nationwide'),
        expectedOutput: { schema: { driver_info_completed: 'boolean', success: 'boolean' }, required: ['success'] },
        timeout: 240000,
        maxRetries: 2
      },
      {
        step: 4,
        name: 'Vehicle & Address',
        description: 'Complete vehicle and address',
        promptTemplate: SIMPLE_GOAL_PROMPTS.step4_vehicle_and_address('Nationwide'),
        expectedOutput: { schema: { vehicle_address_completed: 'boolean', success: 'boolean' }, required: ['success'] },
        timeout: 240000,
        maxRetries: 2
      },
      {
        step: 5,
        name: 'Quote Extraction',
        description: 'Get final quote',
        promptTemplate: SIMPLE_GOAL_PROMPTS.step5_get_quote('Nationwide'),
        expectedOutput: { schema: { quote: 'number|null', success: 'boolean' }, required: ['success'] },
        timeout: 300000,
        maxRetries: 2
      }
    ]
  },

  farmers: {
    providerId: 'farmers',
    providerName: 'Farmers Insurance',
    baseUrl: 'https://www.farmers.com/',
    steps: [
      {
        step: 1,
        name: 'Form Discovery',
        description: 'Find and access quote form',
        promptTemplate: SIMPLE_GOAL_PROMPTS.step1_find_form('Farmers Insurance', 'https://www.farmers.com/'),
        expectedOutput: { schema: { form_accessible: 'boolean', success: 'boolean' }, required: ['success'] },
        timeout: 120000,
        maxRetries: 2
      },
      {
        step: 2,
        name: 'Initial Entry',
        description: 'Enter ZIP and vehicle info',
        promptTemplate: SIMPLE_GOAL_PROMPTS.step2_start_quote('Farmers Insurance'),
        expectedOutput: { schema: { fields_filled: 'boolean', success: 'boolean' }, required: ['success'] },
        timeout: 180000,
        maxRetries: 2
      },
      {
        step: 3,
        name: 'Driver Information',
        description: 'Complete driver details',
        promptTemplate: SIMPLE_GOAL_PROMPTS.step3_driver_details('Farmers Insurance'),
        expectedOutput: { schema: { driver_info_completed: 'boolean', success: 'boolean' }, required: ['success'] },
        timeout: 240000,
        maxRetries: 2
      },
      {
        step: 4,
        name: 'Vehicle & Address',
        description: 'Complete vehicle and address',
        promptTemplate: SIMPLE_GOAL_PROMPTS.step4_vehicle_and_address('Farmers Insurance'),
        expectedOutput: { schema: { vehicle_address_completed: 'boolean', success: 'boolean' }, required: ['success'] },
        timeout: 240000,
        maxRetries: 2
      },
      {
        step: 5,
        name: 'Quote Extraction',
        description: 'Get final quote',
        promptTemplate: SIMPLE_GOAL_PROMPTS.step5_get_quote('Farmers Insurance'),
        expectedOutput: { schema: { quote: 'number|null', success: 'boolean' }, required: ['success'] },
        timeout: 300000,
        maxRetries: 2
      }
    ]
  },

  usaa: {
    providerId: 'usaa',
    providerName: 'USAA',
    baseUrl: 'https://www.usaa.com/',
    steps: [
      {
        step: 1,
        name: 'Form Discovery',
        description: 'Find and access quote form',
        promptTemplate: SIMPLE_GOAL_PROMPTS.step1_find_form('USAA', 'https://www.usaa.com/'),
        expectedOutput: { schema: { form_accessible: 'boolean', success: 'boolean' }, required: ['success'] },
        timeout: 120000,
        maxRetries: 2
      },
      {
        step: 2,
        name: 'Initial Entry',
        description: 'Enter ZIP and vehicle info',
        promptTemplate: SIMPLE_GOAL_PROMPTS.step2_start_quote('USAA'),
        expectedOutput: { schema: { fields_filled: 'boolean', success: 'boolean' }, required: ['success'] },
        timeout: 180000,
        maxRetries: 2
      },
      {
        step: 3,
        name: 'Driver Information',
        description: 'Complete driver details',
        promptTemplate: SIMPLE_GOAL_PROMPTS.step3_driver_details('USAA'),
        expectedOutput: { schema: { driver_info_completed: 'boolean', success: 'boolean' }, required: ['success'] },
        timeout: 240000,
        maxRetries: 2
      },
      {
        step: 4,
        name: 'Vehicle & Address',
        description: 'Complete vehicle and address',
        promptTemplate: SIMPLE_GOAL_PROMPTS.step4_vehicle_and_address('USAA'),
        expectedOutput: { schema: { vehicle_address_completed: 'boolean', success: 'boolean' }, required: ['success'] },
        timeout: 240000,
        maxRetries: 2
      },
      {
        step: 5,
        name: 'Quote Extraction',
        description: 'Get final quote',
        promptTemplate: SIMPLE_GOAL_PROMPTS.step5_get_quote('USAA'),
        expectedOutput: { schema: { quote: 'number|null', success: 'boolean' }, required: ['success'] },
        timeout: 300000,
        maxRetries: 2
      }
    ],
    requiresAgentContact: false,
    specialHandling: 'USAA requires military affiliation'
  },

  travelers: {
    providerId: 'travelers',
    providerName: 'Travelers',
    baseUrl: 'https://www.travelers.com/',
    steps: [
      {
        step: 1,
        name: 'Form Discovery',
        description: 'Find and access quote form',
        promptTemplate: SIMPLE_GOAL_PROMPTS.step1_find_form('Travelers', 'https://www.travelers.com/'),
        expectedOutput: { schema: { form_accessible: 'boolean', success: 'boolean' }, required: ['success'] },
        timeout: 120000,
        maxRetries: 2
      },
      {
        step: 2,
        name: 'Initial Entry',
        description: 'Enter ZIP and vehicle info',
        promptTemplate: SIMPLE_GOAL_PROMPTS.step2_start_quote('Travelers'),
        expectedOutput: { schema: { fields_filled: 'boolean', success: 'boolean' }, required: ['success'] },
        timeout: 180000,
        maxRetries: 2
      },
      {
        step: 3,
        name: 'Driver Information',
        description: 'Complete driver details',
        promptTemplate: SIMPLE_GOAL_PROMPTS.step3_driver_details('Travelers'),
        expectedOutput: { schema: { driver_info_completed: 'boolean', success: 'boolean' }, required: ['success'] },
        timeout: 240000,
        maxRetries: 2
      },
      {
        step: 4,
        name: 'Vehicle & Address',
        description: 'Complete vehicle and address',
        promptTemplate: SIMPLE_GOAL_PROMPTS.step4_vehicle_and_address('Travelers'),
        expectedOutput: { schema: { vehicle_address_completed: 'boolean', success: 'boolean' }, required: ['success'] },
        timeout: 240000,
        maxRetries: 2
      },
      {
        step: 5,
        name: 'Quote Extraction',
        description: 'Get final quote',
        promptTemplate: SIMPLE_GOAL_PROMPTS.step5_get_quote('Travelers'),
        expectedOutput: { schema: { quote: 'number|null', success: 'boolean' }, required: ['success'] },
        timeout: 300000,
        maxRetries: 2
      }
    ]
  },

  americanfamily: {
    providerId: 'americanfamily',
    providerName: 'American Family',
    baseUrl: 'https://www.amfam.com/',
    steps: [
      {
        step: 1,
        name: 'Form Discovery',
        description: 'Find and access quote form',
        promptTemplate: SIMPLE_GOAL_PROMPTS.step1_find_form('American Family', 'https://www.amfam.com/'),
        expectedOutput: { schema: { form_accessible: 'boolean', success: 'boolean' }, required: ['success'] },
        timeout: 120000,
        maxRetries: 2
      },
      {
        step: 2,
        name: 'Initial Entry',
        description: 'Enter ZIP and vehicle info',
        promptTemplate: SIMPLE_GOAL_PROMPTS.step2_start_quote('American Family'),
        expectedOutput: { schema: { fields_filled: 'boolean', success: 'boolean' }, required: ['success'] },
        timeout: 180000,
        maxRetries: 2
      },
      {
        step: 3,
        name: 'Driver Information',
        description: 'Complete driver details',
        promptTemplate: SIMPLE_GOAL_PROMPTS.step3_driver_details('American Family'),
        expectedOutput: { schema: { driver_info_completed: 'boolean', success: 'boolean' }, required: ['success'] },
        timeout: 240000,
        maxRetries: 2
      },
      {
        step: 4,
        name: 'Vehicle & Address',
        description: 'Complete vehicle and address',
        promptTemplate: SIMPLE_GOAL_PROMPTS.step4_vehicle_and_address('American Family'),
        expectedOutput: { schema: { vehicle_address_completed: 'boolean', success: 'boolean' }, required: ['success'] },
        timeout: 240000,
        maxRetries: 2
      },
      {
        step: 5,
        name: 'Quote Extraction',
        description: 'Get final quote',
        promptTemplate: SIMPLE_GOAL_PROMPTS.step5_get_quote('American Family'),
        expectedOutput: { schema: { quote: 'number|null', success: 'boolean' }, required: ['success'] },
        timeout: 300000,
        maxRetries: 2
      }
    ]
  }
};

/**
 * Get all provider IDs
 */
export function getAllProviders(): string[] {
  return Object.keys(WORKFLOW_CONFIGS);
}
