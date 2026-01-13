/**
 * Step-by-Step Prompt Templates for Insurance Quote Workflows
 * Each provider has 5 sequential steps for higher success rates
 */

import { ProviderWorkflowConfig } from '../types/workflow.js';

export const WORKFLOW_CONFIGS: Record<string, ProviderWorkflowConfig> = {
  geico: {
    providerId: 'geico',
    providerName: 'GEICO',
    baseUrl: 'https://www.geico.com/',
    steps: [
      {
        step: 1,
        name: 'Form Discovery',
        description: 'Navigate to site and locate quote form',
        timeout: 120000, // 2 minutes
        maxRetries: 2,
        promptTemplate: `Navigate to https://www.geico.com/

TASK: Find and access the auto insurance quote form

STEPS:
1. Wait for page to fully load (3 seconds minimum)
2. Look for "Get a Free Quote", "Start Quote", or similar button
3. Click the button to access the quote form
4. Wait for the form page to load
5. Verify the form contains fields for ZIP code and vehicle information

Return JSON format:
{
  "form_url": "<current URL after accessing form>",
  "form_accessible": true,
  "initial_fields_found": ["zip", "vehicle_year", "make", "model"],
  "success": true,
  "error": null
}

If you cannot access the form, return:
{
  "form_url": null,
  "form_accessible": false,
  "success": false,
  "error": "Description of what prevented access"
}`,
        expectedOutput: {
          schema: {
            form_url: 'string',
            form_accessible: 'boolean',
            initial_fields_found: 'array',
            success: 'boolean',
            error: 'string | null'
          },
          required: ['form_url', 'form_accessible', 'success']
        }
      },
      {
        step: 2,
        name: 'Initial Vehicle Entry',
        description: 'Enter ZIP code and vehicle basics',
        timeout: 180000, // 3 minutes
        maxRetries: 3,
        promptTemplate: `You are continuing a GEICO auto insurance quote.
Current URL: {{current_url}}

TASK: Fill initial vehicle information and progress to next page

FILL THESE FIELDS:
- ZIP Code: {{zipcode}}
- Vehicle Year: {{year}}
- Vehicle Make: {{make}}
- Vehicle Model: {{model}}

STEPS:
1. Locate each field (may be dropdowns or text inputs)
2. Fill each field with the exact value provided
3. If Make/Model are dropdowns, select the closest match
4. Click "Next", "Continue", or similar button
5. Wait 3-5 seconds for next page to load
6. Verify you've progressed to a new page

Return JSON format:
{
  "current_page_url": "<URL after clicking next>",
  "fields_filled": ["zip", "year", "make", "model"],
  "next_page_loaded": true,
  "page_section": "<name of current section if visible>",
  "success": true,
  "error": null
}`,
        expectedOutput: {
          schema: {
            current_page_url: 'string',
            fields_filled: 'array',
            next_page_loaded: 'boolean',
            page_section: 'string',
            success: 'boolean',
            error: 'string | null'
          },
          required: ['current_page_url', 'next_page_loaded', 'success']
        }
      },
      {
        step: 3,
        name: 'Driver Information',
        description: 'Complete all driver details',
        timeout: 240000, // 4 minutes
        maxRetries: 3,
        promptTemplate: `You are continuing a GEICO auto insurance quote.
Current URL: {{current_url}}

TASK: Fill ALL driver information fields

DRIVER DETAILS:
- First Name: {{firstName}}
- Last Name: {{lastName}}
- Date of Birth: {{dateOfBirth}} (format: MM/DD/YYYY)
- Gender: {{gender}} (Male/Female)
- Marital Status: {{maritalStatus}} (Single/Married/Divorced/Widowed)
- Email: {{email}}
- Phone: {{phone}}
- Driver's License Number: {{licenseNumber}}
- License State: {{state}}

SPECIAL INSTRUCTIONS:
- For date fields: Handle date pickers carefully. Select month, day, year from dropdowns if present
- For dropdowns: Select the option that best matches the provided value
- For phone: Format as (XXX) XXX-XXXX if required
- If a field is required but not listed above, use a reasonable default (e.g., "No" for "SR-22 required?")

Click "Next" or "Continue" when all fields are filled
Wait for next page to load

Return JSON format:
{
  "current_page_url": "<URL after clicking next>",
  "driver_info_completed": true,
  "validation_errors": [],
  "next_section": "<name of next section>",
  "success": true,
  "error": null
}

If there are validation errors, return:
{
  "current_page_url": "<current URL>",
  "driver_info_completed": false,
  "validation_errors": ["Field X: error message"],
  "success": false,
  "error": "Validation failed on driver information"
}`,
        expectedOutput: {
          schema: {
            current_page_url: 'string',
            driver_info_completed: 'boolean',
            validation_errors: 'array',
            next_section: 'string',
            success: 'boolean',
            error: 'string | null'
          },
          required: ['current_page_url', 'driver_info_completed', 'success']
        }
      },
      {
        step: 4,
        name: 'Vehicle & Address Details',
        description: 'Complete vehicle VIN and address information',
        timeout: 240000, // 4 minutes
        maxRetries: 3,
        promptTemplate: `You are continuing a GEICO auto insurance quote.
Current URL: {{current_url}}

TASK: Fill vehicle VIN, address, and additional policy details

VEHICLE INFORMATION:
- VIN: {{vin}}

ADDRESS INFORMATION:
- Street Address: {{mailingAddress}}
- City: {{city}}
- State: {{state}}
- ZIP Code: {{zipcode}}

POLICY INFORMATION:
- Policy Start Date: {{policyStartDate}}
- Employment Status: {{employmentStatus}}
- Education Level: {{educationLevel}}

COMMON OPTIONAL FIELDS (use these defaults if asked):
- Annual Mileage: 12000
- Primary Use: Commute to work
- One-way commute distance: 15 miles
- Own or lease: Own

STEPS:
1. Fill all provided fields
2. Handle any additional required fields with reasonable defaults
3. Look for "Get Quote", "Calculate Quote", "See Rates", or similar button
4. Click to proceed to quote results
5. Wait up to 60 seconds for quote calculation page to load
6. Verify you've reached a page showing quote or pricing information

Return JSON format:
{
  "current_page_url": "<URL of quote results page>",
  "vehicle_address_completed": true,
  "quote_calculation_started": true,
  "quote_page_loaded": true,
  "success": true,
  "error": null
}

If quote page doesn't load:
{
  "current_page_url": "<current URL>",
  "vehicle_address_completed": true,
  "quote_calculation_started": false,
  "quote_page_loaded": false,
  "success": false,
  "error": "Quote page did not load or timed out"
}`,
        expectedOutput: {
          schema: {
            current_page_url: 'string',
            vehicle_address_completed: 'boolean',
            quote_calculation_started: 'boolean',
            quote_page_loaded: 'boolean',
            success: 'boolean',
            error: 'string | null'
          },
          required: ['current_page_url', 'quote_page_loaded', 'success']
        }
      },
      {
        step: 5,
        name: 'Quote Extraction',
        description: 'Wait for and extract final quote',
        timeout: 300000, // 5 minutes
        maxRetries: 2,
        promptTemplate: `You are on the GEICO quote results page.
Current URL: {{current_url}}

TASK: Extract the final insurance quote

STEPS:
1. WAIT up to 60 seconds for the quote to fully load and display
2. Look for premium amount - search for text containing:
   - "$XXX/month" or "$XXX per month"
   - "$XXX/mo" or "$XXX monthly"
   - "Total: $XXX"
   - If only 6-month premium shown, divide by 6 for monthly amount
3. Extract coverage details (liability limits, deductibles, etc.)
4. Look for any discount information
5. Find quote reference number if available

SEARCH LOCATIONS:
- Main quote display area
- Pricing summary section
- Coverage details panel
- Elements with class/id containing: "quote", "premium", "price", "monthly", "total"

SPECIAL CASES:
- If site says "Call agent for quote" or "Quote not available online": Return success:false with appropriate error
- If site shows "Unable to provide quote" or similar: Return success:false with error message
- If redirected to agent contact page: Return success:false with error "Requires agent contact"

Return JSON format:
{
  "quote": <monthly premium as number>,
  "estimatedMin": <number or null>,
  "estimatedMax": <number or null>,
  "details": "<coverage details string>",
  "quote_reference": "<reference number or null>",
  "currency": "USD",
  "period": "month",
  "discounts_applied": ["<discount 1>", "<discount 2>"],
  "success": true,
  "error": null
}

If agent contact required:
{
  "quote": null,
  "details": "Site requires contacting an agent for quote",
  "success": false,
  "error": "REQUIRES_AGENT_CONTACT"
}

If no quote found:
{
  "quote": null,
  "details": "Quote amount not found on page",
  "success": false,
  "error": "Quote not displayed after waiting"
}

CRITICAL: Only return success:true if you found an actual numeric quote amount.`,
        expectedOutput: {
          schema: {
            quote: 'number | null',
            estimatedMin: 'number | null',
            estimatedMax: 'number | null',
            details: 'string',
            quote_reference: 'string | null',
            currency: 'string',
            period: 'string',
            discounts_applied: 'array',
            success: 'boolean',
            error: 'string | null'
          },
          required: ['quote', 'details', 'success']
        }
      }
    ]
  },

  progressive: {
    providerId: 'progressive',
    providerName: 'Progressive',
    baseUrl: 'https://www.progressive.com/',
    steps: [
      // Similar 5-step structure as GEICO
      {
        step: 1,
        name: 'Form Discovery',
        description: 'Navigate to site and locate quote form',
        timeout: 120000,
        maxRetries: 2,
        promptTemplate: `Navigate to https://www.progressive.com/

TASK: Find and access the auto insurance quote form

STEPS:
1. Wait for page to fully load (3 seconds minimum)
2. Look for "Get a Quote", "Start Your Quote", or similar button
3. Click the button to access the quote form
4. Wait for the form page to load
5. Verify the form is accessible

Return JSON format:
{
  "form_url": "<current URL>",
  "form_accessible": true,
  "initial_fields_found": ["zip"],
  "success": true,
  "error": null
}`,
        expectedOutput: {
          schema: {
            form_url: 'string',
            form_accessible: 'boolean',
            success: 'boolean',
            error: 'string | null'
          },
          required: ['form_url', 'form_accessible', 'success']
        }
      },
      {
        step: 2,
        name: 'Initial Entry',
        description: 'Enter ZIP and basic info',
        timeout: 180000,
        maxRetries: 3,
        promptTemplate: `You are starting a Progressive auto insurance quote.
Current URL: {{current_url}}

Fill initial fields:
- ZIP Code: {{zipcode}}
- Vehicle Year: {{year}}
- Make: {{make}}
- Model: {{model}}

Click "Continue" or "Next"
Wait for next page

Return JSON format:
{
  "current_page_url": "<new URL>",
  "fields_filled": ["zip", "year", "make", "model"],
  "next_page_loaded": true,
  "success": true,
  "error": null
}`,
        expectedOutput: {
          schema: {
            current_page_url: 'string',
            next_page_loaded: 'boolean',
            success: 'boolean',
            error: 'string | null'
          },
          required: ['current_page_url', 'success']
        }
      },
      {
        step: 3,
        name: 'Driver Information',
        description: 'Complete driver details',
        timeout: 240000,
        maxRetries: 3,
        promptTemplate: `Progressive driver information step.
Current URL: {{current_url}}

Fill driver details:
- First Name: {{firstName}}
- Last Name: {{lastName}}
- DOB: {{dateOfBirth}}
- Gender: {{gender}}
- Marital Status: {{maritalStatus}}
- Email: {{email}}
- Phone: {{phone}}
- License Number: {{licenseNumber}}

Click "Continue"

Return JSON format:
{
  "current_page_url": "<new URL>",
  "driver_info_completed": true,
  "success": true,
  "error": null
}`,
        expectedOutput: {
          schema: {
            current_page_url: 'string',
            driver_info_completed: 'boolean',
            success: 'boolean',
            error: 'string | null'
          },
          required: ['current_page_url', 'success']
        }
      },
      {
        step: 4,
        name: 'Vehicle & Address',
        description: 'Complete vehicle and address',
        timeout: 240000,
        maxRetries: 3,
        promptTemplate: `Progressive vehicle and address step.
Current URL: {{current_url}}

Fill:
- VIN: {{vin}}
- Address: {{mailingAddress}}
- City: {{city}}
- State: {{state}}
- ZIP: {{zipcode}}
- Policy Start: {{policyStartDate}}

Click "Get Quote" or "See Rates"
Wait for quote results

Return JSON format:
{
  "current_page_url": "<quote URL>",
  "quote_page_loaded": true,
  "success": true,
  "error": null
}`,
        expectedOutput: {
          schema: {
            current_page_url: 'string',
            quote_page_loaded: 'boolean',
            success: 'boolean',
            error: 'string | null'
          },
          required: ['current_page_url', 'success']
        }
      },
      {
        step: 5,
        name: 'Quote Extraction',
        description: 'Extract final quote',
        timeout: 300000,
        maxRetries: 2,
        promptTemplate: `Progressive quote results page.
Current URL: {{current_url}}

Wait up to 60 seconds for quote to load.
Extract monthly premium amount and coverage details.

Return JSON format:
{
  "quote": <monthly number>,
  "estimatedMin": <number or null>,
  "estimatedMax": <number or null>,
  "details": "<coverage string>",
  "success": true,
  "error": null
}

If agent contact required:
{
  "quote": null,
  "success": false,
  "error": "REQUIRES_AGENT_CONTACT"
}`,
        expectedOutput: {
          schema: {
            quote: 'number | null',
            details: 'string',
            success: 'boolean',
            error: 'string | null'
          },
          required: ['quote', 'success']
        }
      }
    ]
  }

  // TODO: Add similar 5-step configurations for:
  // - statefarm
  // - allstate
  // - libertymutual
  // - nationwide
  // - farmers
  // - usaa
  // - travelers
  // - americanfamily
};

/**
 * Helper to fill template variables
 */
export function fillPromptTemplate(template: string, variables: Record<string, any>): string {
  let filled = template;
  for (const [key, value] of Object.entries(variables)) {
    const placeholder = `{{${key}}}`;
    filled = filled.replace(new RegExp(placeholder, 'g'), String(value));
  }
  return filled;
}
