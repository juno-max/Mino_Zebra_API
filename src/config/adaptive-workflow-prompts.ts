/**
 * ADAPTIVE Multi-Step Workflow Prompts for All Insurance Providers
 * These prompts are designed to handle form variations intelligently
 */

import { ProviderWorkflowConfig } from '../types/workflow.js';

/**
 * Universal adaptive prompt that works across all insurance provider forms
 * The agent adapts to whatever form structure it encounters
 */
const UNIVERSAL_ADAPTIVE_STEPS = {
  step1_form_discovery: (providerName: string, baseUrl: string) => `
Navigate to ${baseUrl}

TASK: Find and access the auto insurance quote form

ADAPTIVE SEARCH STRATEGY:
Look for ANY of these elements (in order of priority):
1. Buttons with text: "Get a Quote", "Get Quote", "Start Quote", "Free Quote", "Quote Now", "Get Started", "Start"
2. Links with text: "Auto Insurance", "Car Insurance", "Get a Quote"
3. Forms with fields for ZIP code or vehicle information
4. Any prominent call-to-action buttons in the hero section

ACTIONS:
1. Wait for page to fully load (minimum 3-5 seconds)
2. Click the most prominent quote/start button
3. If redirected, follow the redirect
4. Wait for form page to load (3-5 seconds)
5. Verify you see form fields (ZIP, vehicle, or driver information)

HANDLE VARIATIONS:
- Some sites start with ZIP code only
- Some sites start with vehicle year/make/model
- Some sites show full form immediately
- Some sites have multi-page progressive forms

Return JSON format:
{
  "form_url": "<current URL where form is accessible>",
  "form_accessible": true,
  "form_type": "<zip_first|vehicle_first|full_form|multi_step>",
  "initial_fields_visible": ["zip", "vehicle_year", ...],
  "success": true,
  "error": null
}

CRITICAL: Only return success:true if you can see actual form fields to fill.
`,

  step2_initial_entry: (providerName: string) => `
You are continuing a ${providerName} auto insurance quote.
Current URL: {{current_url}}

TASK: Fill initial form fields to begin the quote process

AVAILABLE DATA:
- ZIP Code: {{zipcode}}
- Vehicle Year: {{year}}
- Vehicle Make: {{make}}
- Vehicle Model: {{model}}
- VIN: {{vin}}

ADAPTIVE FILLING STRATEGY:
Scan the current page and identify which fields are present. Fill only the fields you find:

IF YOU SEE:
- ZIP code field → Fill with {{zipcode}}
- Vehicle year field/dropdown → Select {{year}}
- Vehicle make field/dropdown → Select {{make}} (or type if autocomplete)
- Vehicle model field/dropdown → Select {{model}} (or type if autocomplete)
- VIN field → Fill with {{vin}}
- "Do you know your VIN?" → Select "Yes" and enter VIN
- Any required checkbox (terms, conditions) → Check it

SMART FIELD DETECTION:
- Look for labels containing: "zip", "postal", "year", "make", "model", "vin"
- Look for input fields, dropdowns, autocomplete fields
- Handle both select dropdowns and type-ahead search fields
- If make/model use autocomplete, type the value and select from dropdown

HANDLE DROPDOWNS:
- For year: Click dropdown, scroll if needed, select exact year
- For make: Click dropdown, find {{make}}, click it
- For model: Click dropdown, find {{model}}, click it

PROGRESS TO NEXT PAGE:
- Look for buttons: "Next", "Continue", "Get Quote", "Start Quote", "Submit"
- Click the button
- Wait 3-5 seconds for next page to load
- Verify new URL or new form section appears

Return JSON format:
{
  "current_page_url": "<URL after progressing>",
  "fields_filled": ["zip", "year", "make", "model"],
  "next_page_loaded": true,
  "next_section_name": "<driver_info|vehicle_details|address|coverage>",
  "success": true,
  "error": null
}

ERROR HANDLING:
If any field is missing or you get validation error:
{
  "current_page_url": "<current URL>",
  "fields_filled": ["fields", "that", "worked"],
  "success": false,
  "error": "Specific error: field X not found or validation failed"
}
`,

  step3_driver_info: (providerName: string) => `
You are continuing a ${providerName} auto insurance quote.
Current URL: {{current_url}}

TASK: Fill ALL driver information fields

AVAILABLE DRIVER DATA:
- First Name: {{firstName}}
- Last Name: {{lastName}}
- Date of Birth: {{dateOfBirth}} (format: MM/DD/YYYY)
- Gender: {{gender}}
- Marital Status: {{maritalStatus}}
- Email: {{email}}
- Phone: {{phone}}
- Driver's License Number: {{licenseNumber}}
- License State: {{state}}

ADAPTIVE DRIVER INFO FILLING:
Scan the page for ANY of these fields and fill what you find:

NAMES:
- "First name", "First", "Given name" → {{firstName}}
- "Last name", "Last", "Surname", "Family name" → {{lastName}}
- "Full name" → {{firstName}} {{lastName}}

DATE OF BIRTH:
- Separate month/day/year dropdowns → Select each
- Single date field (MM/DD/YYYY) → Enter {{dateOfBirth}}
- Date picker → Click and select date
- Age field instead → Calculate age from DOB

CONTACT:
- "Email", "Email address" → {{email}}
- "Phone", "Phone number", "Mobile" → {{phone}} (format as needed: (XXX) XXX-XXXX or XXX-XXX-XXXX)

LICENSE:
- "License number", "DL number", "Driver's license" → {{licenseNumber}}
- "License state", "State issued" → {{state}}

DEMOGRAPHICS:
- "Gender", "Sex" → Map {{gender}} to Male/Female/M/F as needed
- "Marital status" → Map {{maritalStatus}} to options: Single/Married/Divorced/Widowed/Separated

COMMON ADDITIONAL QUESTIONS:
- "Do you own or rent your home?" → Select "Own" if {{residence_ownership}} or default to "Own"
- "Highest education level" → Select "Bachelor's degree" or {{educationLevel}}
- "Employment status" → Select "Employed" or {{employmentStatus}}
- "Occupation" → Enter "Professional" or {{occupation}} if available
- "SR-22 required?" → Select "No"
- "DUI/DWI in last 5 years?" → Select "No"
- "Accidents in last 3 years?" → Select "None" or "0"
- "Tickets in last 3 years?" → Select "None" or "0"

SMART HANDLING:
- If field not in our data, use reasonable defaults (No for violations, employed for employment, etc.)
- If date picker is difficult, try typing the date instead
- If phone format is rejected, try different formats
- Handle multi-page driver info sections

PROGRESS TO NEXT:
- Click "Next", "Continue", "Save and Continue"
- Wait for next page (3-5 seconds)

Return JSON format:
{
  "current_page_url": "<new URL>",
  "driver_info_completed": true,
  "fields_filled": ["firstName", "lastName", "dateOfBirth", "email", "phone", "licenseNumber"],
  "validation_errors": [],
  "next_section": "<vehicle_details|address|coverage>",
  "success": true,
  "error": null
}
`,

  step4_vehicle_address: (providerName: string) => `
You are continuing a ${providerName} auto insurance quote.
Current URL: {{current_url}}

TASK: Complete vehicle VIN, address, and policy details

AVAILABLE DATA:
VEHICLE:
- VIN: {{vin}}
- Year: {{year}}
- Make: {{make}}
- Model: {{model}}

ADDRESS:
- Street: {{mailingAddress}}
- City: {{city}}
- State: {{state}}
- ZIP: {{zipcode}}

POLICY:
- Start Date: {{policyStartDate}}
- Employment: {{employmentStatus}}
- Education: {{educationLevel}}

ADAPTIVE FILLING:
Scan for fields and fill what you find:

VEHICLE FIELDS:
- "VIN", "Vehicle Identification Number" → {{vin}}
- If VIN not already entered, enter it now
- "Annual mileage", "Miles per year" → Enter "12000" as default
- "Primary use", "Vehicle use" → Select "Commute" or "Commute to work/school"
- "One-way commute distance" → Enter "15" miles
- "Own or lease" → Select "Own"
- "Purchase date" → Use current year if asked
- "Parking location" → Select "Garage" or "Driveway"

ADDRESS FIELDS:
- "Street address", "Address line 1" → {{mailingAddress}}
- "Address line 2", "Apt/Unit" → Leave blank
- "City" → {{city}}
- "State" → {{state}}
- "ZIP", "ZIP code", "Postal code" → {{zipcode}}
- "Is this your garaging address?" → Select "Yes"
- "Mailing address same as garaging?" → Select "Yes"

POLICY DETAILS:
- "Policy start date", "Effective date", "Coverage start" → {{policyStartDate}}
- If date picker, select the date
- "Employment status" → Map {{employmentStatus}} to "Employed"/"Self-employed"/"Unemployed"
- "Occupation" → Enter "Professional" or specific occupation if available
- "Education level" → Map {{educationLevel}} to dropdown options
- "Industry" → Select "Technology" or "Professional Services" as reasonable default

COVERAGE QUESTIONS:
- "Current insurance company" → Select "No current insurance" or "Currently uninsured"
- "How long insured?" → Select "No current insurance"
- "Reason for shopping" → Select "New policy" or "Shopping for better rate"
- "Homeowner?" → Select "Yes" if ownership data suggests, else "No"

SMART DEFAULTS FOR MISSING INFO:
- Annual mileage: 12000
- Primary use: Commute to work
- Commute distance: 15 miles
- Own/lease: Own
- Parking: Garage
- Currently insured: No

FIND AND CLICK QUOTE BUTTON:
Look for: "Get Quote", "Calculate", "See Rates", "View Quotes", "Get My Quote", "See Prices"
Click it and wait for quote results page to load (may take 30-90 seconds)

Return JSON format:
{
  "current_page_url": "<quote results page URL>",
  "vehicle_address_completed": true,
  "quote_calculation_started": true,
  "quote_page_loaded": true,
  "estimated_wait": "Calculating quote...",
  "success": true,
  "error": null
}

If calculation takes too long or page doesn't load:
{
  "current_page_url": "<current URL>",
  "vehicle_address_completed": true,
  "quote_calculation_started": true,
  "quote_page_loaded": false,
  "success": false,
  "error": "Quote page loading timeout or calculation in progress"
}
`,

  step5_quote_extraction: (providerName: string) => `
You are on the ${providerName} quote results page.
Current URL: {{current_url}}

TASK: Wait for quote calculation and extract the final premium

WAIT STRATEGY:
- Wait up to 90 seconds for quote to fully load and display
- Watch for loading spinners to disappear
- Watch for "Calculating..." messages to complete
- Premium amount may load progressively

ADAPTIVE QUOTE DETECTION:
Search the ENTIRE page for pricing information. Look for:

MONTHLY PREMIUM:
- "$XXX/month", "$XXX per month", "$XXX/mo", "$XXX monthly"
- "Monthly premium: $XXX"
- "Pay $XXX per month"
- "As low as $XXX/month"

6-MONTH PREMIUM (convert to monthly):
- "$XXX for 6 months" → divide by 6
- "$XXX 6-month policy" → divide by 6
- "Total: $XXX" (if context shows 6-month) → divide by 6

ANNUAL PREMIUM (convert to monthly):
- "$XXX per year" → divide by 12
- "$XXX annual" → divide by 12

RANGES:
- "From $XXX to $YYY per month" → set estimatedMin and estimatedMax
- "$XXX - $YYY/month" → set estimatedMin and estimatedMax
- "Starting at $XXX" → set quote to XXX, estimatedMin to XXX

SEARCH LOCATIONS:
- Hero/header section with large price display
- Pricing table or card
- Coverage summary section
- Quote details panel
- Elements with class/id: "price", "premium", "quote", "rate", "monthly", "total"
- Sidebar with quote summary

EXTRACT COVERAGE DETAILS:
Look for:
- Bodily injury limits (e.g., "$25,000/$50,000")
- Property damage limit (e.g., "$15,000")
- Collision deductible (e.g., "$500")
- Comprehensive deductible (e.g., "$500")
- Coverage tier name (e.g., "Minimum", "Standard", "Premium")
- Any discount information

FIND QUOTE REFERENCE:
- "Quote number", "Quote ID", "Reference number"
- "Confirmation number", "Quote #"

SPECIAL CASES TO DETECT:

REQUIRES AGENT CONTACT:
If you see ANY of these messages:
- "Call us for a quote"
- "Contact an agent"
- "Speak with a representative"
- "Unable to provide online quote"
- "Quote not available online"
- Phone number displayed instead of quote
→ Return success:false with error: "REQUIRES_AGENT_CONTACT"

NO COVERAGE AVAILABLE:
- "We're unable to offer coverage"
- "Not available in your area"
- "Does not meet underwriting guidelines"
→ Return success:false with error: "NO_COVERAGE_AVAILABLE"

ADDITIONAL INFO NEEDED:
- "Additional information required"
- "Please call to complete"
→ Return success:false with error: "ADDITIONAL_INFO_REQUIRED"

Return JSON format:
{
  "quote": <monthly premium as number>,
  "estimatedMin": <number or null>,
  "estimatedMax": <number or null>,
  "details": "Bodily Injury: $XX/$YY, Property: $ZZ, Collision: $AAA deductible",
  "quote_reference": "<reference number or null>",
  "currency": "USD",
  "period": "month",
  "discounts_applied": ["multi-policy", "good-driver", ...],
  "coverage_tier": "Standard",
  "success": true,
  "error": null
}

If agent contact required:
{
  "quote": null,
  "estimatedMin": null,
  "estimatedMax": null,
  "details": "This provider requires contacting an agent for a quote. Online quotes not available for this profile.",
  "success": false,
  "error": "REQUIRES_AGENT_CONTACT"
}

If quote not found after waiting:
{
  "quote": null,
  "details": "Quote amount not displayed on page after 90 second wait. Page may still be loading or quote may be on a different page.",
  "success": false,
  "error": "QUOTE_NOT_FOUND_TIMEOUT"
}

CRITICAL RULES:
1. Only return success:true if you found a NUMERIC quote amount
2. If you see "$XXX" but it's not clear if monthly, specify the period you found
3. If redirected to agent contact page, return REQUIRES_AGENT_CONTACT
4. Wait the full time - quotes can take 60-90 seconds to calculate
`
};

/**
 * All 10 Insurance Provider Workflow Configurations
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
        description: 'Navigate and locate quote form',
        timeout: 120000,
        maxRetries: 2,
        promptTemplate: UNIVERSAL_ADAPTIVE_STEPS.step1_form_discovery('GEICO', 'https://www.geico.com/'),
        expectedOutput: { schema: { form_url: 'string', form_accessible: 'boolean', success: 'boolean' }, required: ['form_url', 'success'] }
      },
      {
        step: 2,
        name: 'Initial Entry',
        description: 'Enter ZIP and vehicle basics',
        timeout: 180000,
        maxRetries: 3,
        promptTemplate: UNIVERSAL_ADAPTIVE_STEPS.step2_initial_entry('GEICO'),
        expectedOutput: { schema: { current_page_url: 'string', next_page_loaded: 'boolean', success: 'boolean' }, required: ['current_page_url', 'success'] }
      },
      {
        step: 3,
        name: 'Driver Information',
        description: 'Complete driver details',
        timeout: 240000,
        maxRetries: 3,
        promptTemplate: UNIVERSAL_ADAPTIVE_STEPS.step3_driver_info('GEICO'),
        expectedOutput: { schema: { current_page_url: 'string', driver_info_completed: 'boolean', success: 'boolean' }, required: ['current_page_url', 'success'] }
      },
      {
        step: 4,
        name: 'Vehicle & Address',
        description: 'Complete VIN and address',
        timeout: 240000,
        maxRetries: 3,
        promptTemplate: UNIVERSAL_ADAPTIVE_STEPS.step4_vehicle_address('GEICO'),
        expectedOutput: { schema: { current_page_url: 'string', quote_page_loaded: 'boolean', success: 'boolean' }, required: ['current_page_url', 'success'] }
      },
      {
        step: 5,
        name: 'Quote Extraction',
        description: 'Extract final quote',
        timeout: 300000,
        maxRetries: 2,
        promptTemplate: UNIVERSAL_ADAPTIVE_STEPS.step5_quote_extraction('GEICO'),
        expectedOutput: { schema: { quote: 'number | null', details: 'string', success: 'boolean' }, required: ['quote', 'success'] }
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
        description: 'Navigate and locate quote form',
        timeout: 120000,
        maxRetries: 2,
        promptTemplate: UNIVERSAL_ADAPTIVE_STEPS.step1_form_discovery('Progressive', 'https://www.progressive.com/'),
        expectedOutput: { schema: { form_url: 'string', form_accessible: 'boolean', success: 'boolean' }, required: ['form_url', 'success'] }
      },
      {
        step: 2,
        name: 'Initial Entry',
        description: 'Enter ZIP and vehicle basics',
        timeout: 180000,
        maxRetries: 3,
        promptTemplate: UNIVERSAL_ADAPTIVE_STEPS.step2_initial_entry('Progressive'),
        expectedOutput: { schema: { current_page_url: 'string', next_page_loaded: 'boolean', success: 'boolean' }, required: ['current_page_url', 'success'] }
      },
      {
        step: 3,
        name: 'Driver Information',
        description: 'Complete driver details',
        timeout: 240000,
        maxRetries: 3,
        promptTemplate: UNIVERSAL_ADAPTIVE_STEPS.step3_driver_info('Progressive'),
        expectedOutput: { schema: { current_page_url: 'string', driver_info_completed: 'boolean', success: 'boolean' }, required: ['current_page_url', 'success'] }
      },
      {
        step: 4,
        name: 'Vehicle & Address',
        description: 'Complete VIN and address',
        timeout: 240000,
        maxRetries: 3,
        promptTemplate: UNIVERSAL_ADAPTIVE_STEPS.step4_vehicle_address('Progressive'),
        expectedOutput: { schema: { current_page_url: 'string', quote_page_loaded: 'boolean', success: 'boolean' }, required: ['current_page_url', 'success'] }
      },
      {
        step: 5,
        name: 'Quote Extraction',
        description: 'Extract final quote',
        timeout: 300000,
        maxRetries: 2,
        promptTemplate: UNIVERSAL_ADAPTIVE_STEPS.step5_quote_extraction('Progressive'),
        expectedOutput: { schema: { quote: 'number | null', details: 'string', success: 'boolean' }, required: ['quote', 'success'] }
      }
    ]
  },

  statefarm: {
    providerId: 'statefarm',
    providerName: 'State Farm',
    baseUrl: 'https://www.statefarm.com/',
    requiresAgentContact: true,
    specialHandling: 'State Farm often requires agent contact for final quotes',
    steps: [
      {
        step: 1,
        name: 'Form Discovery',
        description: 'Navigate and locate quote form',
        timeout: 120000,
        maxRetries: 2,
        promptTemplate: UNIVERSAL_ADAPTIVE_STEPS.step1_form_discovery('State Farm', 'https://www.statefarm.com/'),
        expectedOutput: { schema: { form_url: 'string', form_accessible: 'boolean', success: 'boolean' }, required: ['form_url', 'success'] }
      },
      {
        step: 2,
        name: 'Initial Entry',
        description: 'Enter ZIP and vehicle basics',
        timeout: 180000,
        maxRetries: 3,
        promptTemplate: UNIVERSAL_ADAPTIVE_STEPS.step2_initial_entry('State Farm'),
        expectedOutput: { schema: { current_page_url: 'string', next_page_loaded: 'boolean', success: 'boolean' }, required: ['current_page_url', 'success'] }
      },
      {
        step: 3,
        name: 'Driver Information',
        description: 'Complete driver details',
        timeout: 240000,
        maxRetries: 3,
        promptTemplate: UNIVERSAL_ADAPTIVE_STEPS.step3_driver_info('State Farm'),
        expectedOutput: { schema: { current_page_url: 'string', driver_info_completed: 'boolean', success: 'boolean' }, required: ['current_page_url', 'success'] }
      },
      {
        step: 4,
        name: 'Vehicle & Address',
        description: 'Complete VIN and address',
        timeout: 240000,
        maxRetries: 3,
        promptTemplate: UNIVERSAL_ADAPTIVE_STEPS.step4_vehicle_address('State Farm'),
        expectedOutput: { schema: { current_page_url: 'string', quote_page_loaded: 'boolean', success: 'boolean' }, required: ['current_page_url', 'success'] }
      },
      {
        step: 5,
        name: 'Quote Extraction',
        description: 'Extract final quote or agent info',
        timeout: 300000,
        maxRetries: 2,
        promptTemplate: UNIVERSAL_ADAPTIVE_STEPS.step5_quote_extraction('State Farm'),
        expectedOutput: { schema: { quote: 'number | null', details: 'string', success: 'boolean' }, required: ['quote', 'success'] }
      }
    ]
  },

  allstate: {
    providerId: 'allstate',
    providerName: 'Allstate',
    baseUrl: 'https://www.allstate.com/',
    steps: [
      {
        step: 1,
        name: 'Form Discovery',
        description: 'Navigate and locate quote form',
        timeout: 120000,
        maxRetries: 2,
        promptTemplate: UNIVERSAL_ADAPTIVE_STEPS.step1_form_discovery('Allstate', 'https://www.allstate.com/'),
        expectedOutput: { schema: { form_url: 'string', form_accessible: 'boolean', success: 'boolean' }, required: ['form_url', 'success'] }
      },
      {
        step: 2,
        name: 'Initial Entry',
        description: 'Enter ZIP and vehicle basics',
        timeout: 180000,
        maxRetries: 3,
        promptTemplate: UNIVERSAL_ADAPTIVE_STEPS.step2_initial_entry('Allstate'),
        expectedOutput: { schema: { current_page_url: 'string', next_page_loaded: 'boolean', success: 'boolean' }, required: ['current_page_url', 'success'] }
      },
      {
        step: 3,
        name: 'Driver Information',
        description: 'Complete driver details',
        timeout: 240000,
        maxRetries: 3,
        promptTemplate: UNIVERSAL_ADAPTIVE_STEPS.step3_driver_info('Allstate'),
        expectedOutput: { schema: { current_page_url: 'string', driver_info_completed: 'boolean', success: 'boolean' }, required: ['current_page_url', 'success'] }
      },
      {
        step: 4,
        name: 'Vehicle & Address',
        description: 'Complete VIN and address',
        timeout: 240000,
        maxRetries: 3,
        promptTemplate: UNIVERSAL_ADAPTIVE_STEPS.step4_vehicle_address('Allstate'),
        expectedOutput: { schema: { current_page_url: 'string', quote_page_loaded: 'boolean', success: 'boolean' }, required: ['current_page_url', 'success'] }
      },
      {
        step: 5,
        name: 'Quote Extraction',
        description: 'Extract final quote',
        timeout: 300000,
        maxRetries: 2,
        promptTemplate: UNIVERSAL_ADAPTIVE_STEPS.step5_quote_extraction('Allstate'),
        expectedOutput: { schema: { quote: 'number | null', details: 'string', success: 'boolean' }, required: ['quote', 'success'] }
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
        description: 'Navigate and locate quote form',
        timeout: 120000,
        maxRetries: 2,
        promptTemplate: UNIVERSAL_ADAPTIVE_STEPS.step1_form_discovery('Liberty Mutual', 'https://www.libertymutual.com/'),
        expectedOutput: { schema: { form_url: 'string', form_accessible: 'boolean', success: 'boolean' }, required: ['form_url', 'success'] }
      },
      {
        step: 2,
        name: 'Initial Entry',
        description: 'Enter ZIP and vehicle basics',
        timeout: 180000,
        maxRetries: 3,
        promptTemplate: UNIVERSAL_ADAPTIVE_STEPS.step2_initial_entry('Liberty Mutual'),
        expectedOutput: { schema: { current_page_url: 'string', next_page_loaded: 'boolean', success: 'boolean' }, required: ['current_page_url', 'success'] }
      },
      {
        step: 3,
        name: 'Driver Information',
        description: 'Complete driver details',
        timeout: 240000,
        maxRetries: 3,
        promptTemplate: UNIVERSAL_ADAPTIVE_STEPS.step3_driver_info('Liberty Mutual'),
        expectedOutput: { schema: { current_page_url: 'string', driver_info_completed: 'boolean', success: 'boolean' }, required: ['current_page_url', 'success'] }
      },
      {
        step: 4,
        name: 'Vehicle & Address',
        description: 'Complete VIN and address',
        timeout: 240000,
        maxRetries: 3,
        promptTemplate: UNIVERSAL_ADAPTIVE_STEPS.step4_vehicle_address('Liberty Mutual'),
        expectedOutput: { schema: { current_page_url: 'string', quote_page_loaded: 'boolean', success: 'boolean' }, required: ['current_page_url', 'success'] }
      },
      {
        step: 5,
        name: 'Quote Extraction',
        description: 'Extract final quote',
        timeout: 300000,
        maxRetries: 2,
        promptTemplate: UNIVERSAL_ADAPTIVE_STEPS.step5_quote_extraction('Liberty Mutual'),
        expectedOutput: { schema: { quote: 'number | null', details: 'string', success: 'boolean' }, required: ['quote', 'success'] }
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
        description: 'Navigate and locate quote form',
        timeout: 120000,
        maxRetries: 2,
        promptTemplate: UNIVERSAL_ADAPTIVE_STEPS.step1_form_discovery('Nationwide', 'https://www.nationwide.com/'),
        expectedOutput: { schema: { form_url: 'string', form_accessible: 'boolean', success: 'boolean' }, required: ['form_url', 'success'] }
      },
      {
        step: 2,
        name: 'Initial Entry',
        description: 'Enter ZIP and vehicle basics',
        timeout: 180000,
        maxRetries: 3,
        promptTemplate: UNIVERSAL_ADAPTIVE_STEPS.step2_initial_entry('Nationwide'),
        expectedOutput: { schema: { current_page_url: 'string', next_page_loaded: 'boolean', success: 'boolean' }, required: ['current_page_url', 'success'] }
      },
      {
        step: 3,
        name: 'Driver Information',
        description: 'Complete driver details',
        timeout: 240000,
        maxRetries: 3,
        promptTemplate: UNIVERSAL_ADAPTIVE_STEPS.step3_driver_info('Nationwide'),
        expectedOutput: { schema: { current_page_url: 'string', driver_info_completed: 'boolean', success: 'boolean' }, required: ['current_page_url', 'success'] }
      },
      {
        step: 4,
        name: 'Vehicle & Address',
        description: 'Complete VIN and address',
        timeout: 240000,
        maxRetries: 3,
        promptTemplate: UNIVERSAL_ADAPTIVE_STEPS.step4_vehicle_address('Nationwide'),
        expectedOutput: { schema: { current_page_url: 'string', quote_page_loaded: 'boolean', success: 'boolean' }, required: ['current_page_url', 'success'] }
      },
      {
        step: 5,
        name: 'Quote Extraction',
        description: 'Extract final quote',
        timeout: 300000,
        maxRetries: 2,
        promptTemplate: UNIVERSAL_ADAPTIVE_STEPS.step5_quote_extraction('Nationwide'),
        expectedOutput: { schema: { quote: 'number | null', details: 'string', success: 'boolean' }, required: ['quote', 'success'] }
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
        description: 'Navigate and locate quote form',
        timeout: 120000,
        maxRetries: 2,
        promptTemplate: UNIVERSAL_ADAPTIVE_STEPS.step1_form_discovery('Farmers Insurance', 'https://www.farmers.com/'),
        expectedOutput: { schema: { form_url: 'string', form_accessible: 'boolean', success: 'boolean' }, required: ['form_url', 'success'] }
      },
      {
        step: 2,
        name: 'Initial Entry',
        description: 'Enter ZIP and vehicle basics',
        timeout: 180000,
        maxRetries: 3,
        promptTemplate: UNIVERSAL_ADAPTIVE_STEPS.step2_initial_entry('Farmers Insurance'),
        expectedOutput: { schema: { current_page_url: 'string', next_page_loaded: 'boolean', success: 'boolean' }, required: ['current_page_url', 'success'] }
      },
      {
        step: 3,
        name: 'Driver Information',
        description: 'Complete driver details',
        timeout: 240000,
        maxRetries: 3,
        promptTemplate: UNIVERSAL_ADAPTIVE_STEPS.step3_driver_info('Farmers Insurance'),
        expectedOutput: { schema: { current_page_url: 'string', driver_info_completed: 'boolean', success: 'boolean' }, required: ['current_page_url', 'success'] }
      },
      {
        step: 4,
        name: 'Vehicle & Address',
        description: 'Complete VIN and address',
        timeout: 240000,
        maxRetries: 3,
        promptTemplate: UNIVERSAL_ADAPTIVE_STEPS.step4_vehicle_address('Farmers Insurance'),
        expectedOutput: { schema: { current_page_url: 'string', quote_page_loaded: 'boolean', success: 'boolean' }, required: ['current_page_url', 'success'] }
      },
      {
        step: 5,
        name: 'Quote Extraction',
        description: 'Extract final quote',
        timeout: 300000,
        maxRetries: 2,
        promptTemplate: UNIVERSAL_ADAPTIVE_STEPS.step5_quote_extraction('Farmers Insurance'),
        expectedOutput: { schema: { quote: 'number | null', details: 'string', success: 'boolean' }, required: ['quote', 'success'] }
      }
    ]
  },

  usaa: {
    providerId: 'usaa',
    providerName: 'USAA',
    baseUrl: 'https://www.usaa.com/',
    requiresAgentContact: true,
    specialHandling: 'USAA requires military affiliation and often requires member login',
    steps: [
      {
        step: 1,
        name: 'Form Discovery',
        description: 'Navigate and locate quote form',
        timeout: 120000,
        maxRetries: 2,
        promptTemplate: UNIVERSAL_ADAPTIVE_STEPS.step1_form_discovery('USAA', 'https://www.usaa.com/'),
        expectedOutput: { schema: { form_url: 'string', form_accessible: 'boolean', success: 'boolean' }, required: ['form_url', 'success'] }
      },
      {
        step: 2,
        name: 'Initial Entry',
        description: 'Enter ZIP and vehicle basics',
        timeout: 180000,
        maxRetries: 3,
        promptTemplate: UNIVERSAL_ADAPTIVE_STEPS.step2_initial_entry('USAA'),
        expectedOutput: { schema: { current_page_url: 'string', next_page_loaded: 'boolean', success: 'boolean' }, required: ['current_page_url', 'success'] }
      },
      {
        step: 3,
        name: 'Driver Information',
        description: 'Complete driver details',
        timeout: 240000,
        maxRetries: 3,
        promptTemplate: UNIVERSAL_ADAPTIVE_STEPS.step3_driver_info('USAA'),
        expectedOutput: { schema: { current_page_url: 'string', driver_info_completed: 'boolean', success: 'boolean' }, required: ['current_page_url', 'success'] }
      },
      {
        step: 4,
        name: 'Vehicle & Address',
        description: 'Complete VIN and address',
        timeout: 240000,
        maxRetries: 3,
        promptTemplate: UNIVERSAL_ADAPTIVE_STEPS.step4_vehicle_address('USAA'),
        expectedOutput: { schema: { current_page_url: 'string', quote_page_loaded: 'boolean', success: 'boolean' }, required: ['current_page_url', 'success'] }
      },
      {
        step: 5,
        name: 'Quote Extraction',
        description: 'Extract final quote or military eligibility message',
        timeout: 300000,
        maxRetries: 2,
        promptTemplate: UNIVERSAL_ADAPTIVE_STEPS.step5_quote_extraction('USAA'),
        expectedOutput: { schema: { quote: 'number | null', details: 'string', success: 'boolean' }, required: ['quote', 'success'] }
      }
    ]
  },

  travelers: {
    providerId: 'travelers',
    providerName: 'Travelers',
    baseUrl: 'https://www.travelers.com/',
    steps: [
      {
        step: 1,
        name: 'Form Discovery',
        description: 'Navigate and locate quote form',
        timeout: 120000,
        maxRetries: 2,
        promptTemplate: UNIVERSAL_ADAPTIVE_STEPS.step1_form_discovery('Travelers', 'https://www.travelers.com/'),
        expectedOutput: { schema: { form_url: 'string', form_accessible: 'boolean', success: 'boolean' }, required: ['form_url', 'success'] }
      },
      {
        step: 2,
        name: 'Initial Entry',
        description: 'Enter ZIP and vehicle basics',
        timeout: 180000,
        maxRetries: 3,
        promptTemplate: UNIVERSAL_ADAPTIVE_STEPS.step2_initial_entry('Travelers'),
        expectedOutput: { schema: { current_page_url: 'string', next_page_loaded: 'boolean', success: 'boolean' }, required: ['current_page_url', 'success'] }
      },
      {
        step: 3,
        name: 'Driver Information',
        description: 'Complete driver details',
        timeout: 240000,
        maxRetries: 3,
        promptTemplate: UNIVERSAL_ADAPTIVE_STEPS.step3_driver_info('Travelers'),
        expectedOutput: { schema: { current_page_url: 'string', driver_info_completed: 'boolean', success: 'boolean' }, required: ['current_page_url', 'success'] }
      },
      {
        step: 4,
        name: 'Vehicle & Address',
        description: 'Complete VIN and address',
        timeout: 240000,
        maxRetries: 3,
        promptTemplate: UNIVERSAL_ADAPTIVE_STEPS.step4_vehicle_address('Travelers'),
        expectedOutput: { schema: { current_page_url: 'string', quote_page_loaded: 'boolean', success: 'boolean' }, required: ['current_page_url', 'success'] }
      },
      {
        step: 5,
        name: 'Quote Extraction',
        description: 'Extract final quote',
        timeout: 300000,
        maxRetries: 2,
        promptTemplate: UNIVERSAL_ADAPTIVE_STEPS.step5_quote_extraction('Travelers'),
        expectedOutput: { schema: { quote: 'number | null', details: 'string', success: 'boolean' }, required: ['quote', 'success'] }
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
        description: 'Navigate and locate quote form',
        timeout: 120000,
        maxRetries: 2,
        promptTemplate: UNIVERSAL_ADAPTIVE_STEPS.step1_form_discovery('American Family', 'https://www.amfam.com/'),
        expectedOutput: { schema: { form_url: 'string', form_accessible: 'boolean', success: 'boolean' }, required: ['form_url', 'success'] }
      },
      {
        step: 2,
        name: 'Initial Entry',
        description: 'Enter ZIP and vehicle basics',
        timeout: 180000,
        maxRetries: 3,
        promptTemplate: UNIVERSAL_ADAPTIVE_STEPS.step2_initial_entry('American Family'),
        expectedOutput: { schema: { current_page_url: 'string', next_page_loaded: 'boolean', success: 'boolean' }, required: ['current_page_url', 'success'] }
      },
      {
        step: 3,
        name: 'Driver Information',
        description: 'Complete driver details',
        timeout: 240000,
        maxRetries: 3,
        promptTemplate: UNIVERSAL_ADAPTIVE_STEPS.step3_driver_info('American Family'),
        expectedOutput: { schema: { current_page_url: 'string', driver_info_completed: 'boolean', success: 'boolean' }, required: ['current_page_url', 'success'] }
      },
      {
        step: 4,
        name: 'Vehicle & Address',
        description: 'Complete VIN and address',
        timeout: 240000,
        maxRetries: 3,
        promptTemplate: UNIVERSAL_ADAPTIVE_STEPS.step4_vehicle_address('American Family'),
        expectedOutput: { schema: { current_page_url: 'string', quote_page_loaded: 'boolean', success: 'boolean' }, required: ['current_page_url', 'success'] }
      },
      {
        step: 5,
        name: 'Quote Extraction',
        description: 'Extract final quote',
        timeout: 300000,
        maxRetries: 2,
        promptTemplate: UNIVERSAL_ADAPTIVE_STEPS.step5_quote_extraction('American Family'),
        expectedOutput: { schema: { quote: 'number | null', details: 'string', success: 'boolean' }, required: ['quote', 'success'] }
      }
    ]
  }
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

/**
 * Get list of all available providers
 */
export function getAllProviders(): string[] {
  return Object.keys(WORKFLOW_CONFIGS);
}

/**
 * Get provider configuration
 */
export function getProviderConfig(providerId: string): ProviderWorkflowConfig | undefined {
  return WORKFLOW_CONFIGS[providerId];
}
