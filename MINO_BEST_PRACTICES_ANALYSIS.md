# Mino Best Practices Analysis - Insurance Quote Optimization

## Key Patterns from Best Practices

### 1. **Single Objective Per Agent Call**
Each Mino agent should have ONE clear, focused goal:
- ✅ "Extract pricing from this page"
- ✅ "Find and click the Get Quote button"
- ❌ "Navigate, fill form, and extract quote" (too broad)

### 2. **Structured Output Requirements**
Every prompt specifies exact JSON schema:
```json
{
  "price": 150,
  "currency": "USD",
  "period": "night"
}
```

### 3. **Step-by-Step Instructions**
Numbered, sequential steps with clear progression:
1. Navigate to URL
2. Wait for page load (minimum 3 seconds)
3. Find specific element
4. Extract data
5. Return JSON

### 4. **Error Handling Built-In**
- Handle timeouts gracefully
- Provide fallback strategies
- Return partial data when possible
- Clear error messages

### 5. **Wait for Dynamic Content**
Explicit waits for:
- JavaScript to load
- AJAX requests to complete
- Modal dialogs to appear
- Form fields to populate

### 6. **Validation at Each Step**
- Verify page loaded successfully
- Confirm expected elements present
- Validate extracted data format
- Check for error messages on page

## Current Insurance Quote Approach - Problems

### Single Monolithic Agent Call
```
Current: One 20-minute agent call doing:
- Navigate to site ❌
- Find quote form ❌
- Fill 15-20 fields ❌
- Navigate 4-5 pages ❌
- Handle dropdowns/date pickers ❌
- Wait for quote calculation ❌
- Extract final quote ❌
```

**Issues:**
- ❌ If ANY step fails, entire process fails
- ❌ No visibility into where it failed
- ❌ Cannot retry individual steps
- ❌ Hard to debug
- ❌ Low success rate (~30-40%)
- ❌ Wastes 15+ minutes before discovering failure

## Proposed Solution: Multi-Step Workflow

### Break Into 5 Sequential Agent Calls

#### **Agent Call 1: Form Discovery** (1-2 minutes)
**Goal:** Locate the quote form entry point
```
Navigate to {provider_url}
Find the "Get a Quote" or "Start Quote" button/link
Click to access the quote form
Return:
{
  "form_url": "https://...",
  "form_accessible": true,
  "initial_fields_found": ["zip", "vehicle_year", "make"]
}
```

#### **Agent Call 2: Initial Entry** (2-3 minutes)
**Goal:** Enter basic information to start quote
```
On {form_url}, fill initial fields:
- ZIP Code: {zipcode}
- Vehicle Year: {year}
- Vehicle Make: {make}
- Vehicle Model: {model}

Click "Next" or "Continue"
Wait for next page to load

Return:
{
  "current_page_url": "https://...",
  "fields_completed": ["zip", "year", "make", "model"],
  "next_page_loaded": true,
  "session_active": true
}
```

#### **Agent Call 3: Driver Information** (3-4 minutes)
**Goal:** Complete driver details section
```
On {current_page_url}, fill driver information:
- First Name: {firstName}
- Last Name: {lastName}
- Date of Birth: {dateOfBirth}
- Gender: {gender}
- Marital Status: {maritalStatus}
- License Number: {licenseNumber}
- License State: {state}

Handle any additional required fields
Click "Next" or "Continue"
Wait for next page

Return:
{
  "current_page_url": "https://...",
  "driver_info_completed": true,
  "validation_errors": [],
  "next_section": "vehicle_details"
}
```

#### **Agent Call 4: Vehicle & Address** (3-4 minutes)
**Goal:** Complete vehicle and address details
```
On {current_page_url}, fill:
- VIN: {vin}
- Address: {mailingAddress}
- City: {city}
- State: {state}
- ZIP: {zipcode}
- Annual Mileage: estimate or use default
- Primary Use: Commute/Personal

Click "Next" or "Get Quote"
Wait for quote calculation page

Return:
{
  "current_page_url": "https://...",
  "quote_calculation_started": true,
  "estimated_wait_time": "30-60 seconds"
}
```

#### **Agent Call 5: Quote Extraction** (2-5 minutes)
**Goal:** Wait for and extract final quote
```
On {current_page_url}, wait for quote to appear (up to 60 seconds)

Look for:
- Monthly premium amount
- Coverage details
- Any discount information
- Quote reference number

Extract all visible quote information

Return:
{
  "quote": 150.00,
  "estimatedMin": null,
  "estimatedMax": null,
  "details": "Liability: $25K/$50K/$15K, Collision: $500 deductible",
  "quote_reference": "Q123456",
  "success": true
}
```

## Benefits of Multi-Step Approach

### 1. **Higher Success Rate**
- Each step is simple and focused
- 5 simple tasks are easier than 1 complex task
- Can retry individual failing steps
- Success rate: 30% → 70-80%

### 2. **Better Error Isolation**
```
Before: "Quote failed" - where? why?
After: "Step 3 (Driver Info) failed: License number field not found"
```

### 3. **Granular Progress Tracking**
```
User sees:
✓ Step 1: Form located (30s)
✓ Step 2: Initial entry complete (45s)
⚙ Step 3: Entering driver information... (2m 15s)
⏳ Step 4: Pending
⏳ Step 5: Pending
```

### 4. **Retry Individual Steps**
```
If Step 3 fails:
- Don't restart from Step 1
- Keep session from Steps 1-2
- Retry only Step 3 with adjusted parameters
- Continue to Steps 4-5
```

### 5. **Parallel Sub-Steps**
Once Step 2 completes, we have a session. We can:
- Run Steps 3 & 4 in parallel (if site allows)
- Save session for retry attempts
- Resume if connection drops

### 6. **Better Debugging**
```
Logs show:
- Step 1 took 45s → SUCCESS
- Step 2 took 1m 30s → SUCCESS
- Step 3 took 4m 20s → FAILED (timeout on date picker)
- Can now fix Step 3 specifically
```

### 7. **Cost Optimization**
```
Before: 20-minute agent call fails → $5 wasted
After:
- Steps 1-3 succeed (8 minutes) → $2
- Step 4 fails (3 minutes) → $0.75
- Retry Step 4 succeeds (2 minutes) → $0.50
- Step 5 succeeds (2 minutes) → $0.50
Total: $3.75 with better success
```

## Implementation Architecture

### Backend Changes

```typescript
interface QuoteWorkflowStep {
  step: number;
  name: string;
  description: string;
  minoGoal: string;
  inputData: any;
  outputData?: any;
  status: 'pending' | 'running' | 'success' | 'failed';
  duration?: number;
  error?: string;
  retryCount: number;
  maxRetries: number;
}

interface QuoteWorkflow {
  runId: string;
  providerId: string;
  currentStep: number;
  steps: QuoteWorkflowStep[];
  sessionData: any; // Cookies, URLs, form state
  startTime: Date;
  endTime?: Date;
  finalQuote?: QuoteResult;
}
```

### Workflow Orchestrator

```typescript
class InsuranceQuoteOrchestrator {
  async executeWorkflow(providerId: string, userData: UserData): Promise<QuoteResult> {
    const workflow = this.initializeWorkflow(providerId, userData);

    for (const step of workflow.steps) {
      try {
        step.status = 'running';
        this.emitProgress(workflow);

        const result = await this.executeStep(step, workflow.sessionData);

        step.outputData = result;
        step.status = 'success';
        workflow.sessionData = { ...workflow.sessionData, ...result };
        workflow.currentStep++;

      } catch (error) {
        step.status = 'failed';
        step.error = error.message;

        if (step.retryCount < step.maxRetries) {
          step.retryCount++;
          // Retry this step
          continue;
        } else {
          // Step failed after retries, abort workflow
          throw new Error(`Step ${step.step} failed: ${error.message}`);
        }
      }
    }

    return workflow.finalQuote;
  }

  async executeStep(step: QuoteWorkflowStep, sessionData: any): Promise<any> {
    // Prepare Mino API call with step-specific prompt
    const minoConfig = {
      url: sessionData.currentUrl || step.baseUrl,
      goal: this.buildStepPrompt(step, sessionData),
      browser_profile: 'standard',
      cookies: sessionData.cookies,
    };

    const result = await runMinoAutomation(minoConfig);
    return result;
  }
}
```

### Step-Specific Prompt Templates

```typescript
const STEP_PROMPTS = {
  GEICO: {
    step1_form_discovery: `
Navigate to https://www.geico.com/
Find and click the "Get a Free Quote" button
Wait for the quote form to load
Verify the form contains fields for ZIP code and vehicle information

Return JSON:
{
  "form_url": "<current URL after clicking>",
  "form_accessible": true|false,
  "initial_fields": ["zip", "vehicle_year", ...],
  "success": true|false,
  "error": null|"<error message>"
}
`,

    step2_initial_entry: `
You are continuing a GEICO insurance quote.
Current URL: {{current_url}}

Fill the following fields:
- ZIP Code: {{zipcode}}
- Vehicle Year: {{year}}
- Make: {{make}}
- Model: {{model}}

Click "Next" or "Continue" button
Wait 3 seconds for next page to load

Return JSON:
{
  "current_page_url": "<new URL>",
  "fields_filled": ["zip", "year", "make", "model"],
  "next_page_loaded": true|false,
  "page_title": "<title of current page>",
  "success": true|false
}
`,

    step3_driver_info: `
You are continuing a GEICO insurance quote.
Current URL: {{current_url}}

Fill ALL driver information fields:
- First Name: {{firstName}}
- Last Name: {{lastName}}
- Date of Birth: {{dateOfBirth}} (format: MM/DD/YYYY)
- Gender: {{gender}}
- Marital Status: {{maritalStatus}}
- Email: {{email}}
- Phone: {{phone}}
- License Number: {{licenseNumber}}
- License State: {{state}}

Handle date pickers carefully - select month, day, and year from dropdowns if present
If any field is marked as required but not in the list above, use reasonable defaults

Click "Next" or "Continue"
Wait for next page

Return JSON:
{
  "current_page_url": "<new URL>",
  "driver_info_completed": true|false,
  "validation_errors": [],
  "next_section_name": "<name of next section>",
  "success": true|false
}
`,

    step4_vehicle_address: `
You are continuing a GEICO insurance quote.
Current URL: {{current_url}}

Fill remaining vehicle and address information:
- VIN: {{vin}}
- Street Address: {{mailingAddress}}
- City: {{city}}
- State: {{state}}
- ZIP: {{zipcode}}
- Policy Start Date: {{policyStartDate}}
- Employment Status: {{employmentStatus}}
- Education Level: {{educationLevel}}

If asked about annual mileage, enter: 12000
If asked about primary use, select: Commute/Work

Click "Get Quote" or "Calculate" or "See Rates" button
Wait for quote results page to load (may take 30-60 seconds)

Return JSON:
{
  "current_page_url": "<URL of quote results page>",
  "quote_calculation_started": true|false,
  "quote_page_loaded": true|false,
  "success": true|false
}
`,

    step5_quote_extraction: `
You are on the GEICO quote results page.
Current URL: {{current_url}}

WAIT up to 60 seconds for the quote to fully load and display.

Extract the following information:
- Monthly premium amount (look for $XXX/month or $XXX per month)
- If only 6-month premium shown, divide by 6 for monthly
- Coverage details (liability limits, deductibles, etc.)
- Any discounts mentioned
- Quote reference number if available

Look for elements containing: "quote", "premium", "price", "monthly", "month"

Return JSON:
{
  "quote": <monthly premium as number>,
  "estimatedMin": <number or null>,
  "estimatedMax": <number or null>,
  "details": "<coverage details string>",
  "quote_reference": "<reference number or null>",
  "currency": "USD",
  "period": "month",
  "success": true|false,
  "error": null|"<error message if quote not found>"
}

IMPORTANT: Only return success:true if you actually found a numeric quote amount.
If the site says "Call agent" or "Quote not available online", return success:false with appropriate error message.
`
  }
};
```

## Frontend Updates

### Progress Display

```javascript
// Show granular progress for each step
function updateProviderProgress(providerId, workflow) {
  const steps = [
    { name: 'Finding form', icon: '🔍' },
    { name: 'Initial entry', icon: '📝' },
    { name: 'Driver info', icon: '👤' },
    { name: 'Vehicle details', icon: '🚗' },
    { name: 'Extracting quote', icon: '💰' }
  ];

  steps.forEach((step, index) => {
    const stepElement = document.getElementById(`${providerId}-step-${index}`);
    const workflowStep = workflow.steps[index];

    if (workflowStep.status === 'success') {
      stepElement.className = 'step-complete';
      stepElement.innerHTML = `✓ ${step.icon} ${step.name} (${workflowStep.duration}s)`;
    } else if (workflowStep.status === 'running') {
      stepElement.className = 'step-active';
      stepElement.innerHTML = `⚙ ${step.icon} ${step.name}...`;
    } else if (workflowStep.status === 'failed') {
      stepElement.className = 'step-failed';
      stepElement.innerHTML = `✗ ${step.icon} ${step.name} - ${workflowStep.error}`;
    } else {
      stepElement.className = 'step-pending';
      stepElement.innerHTML = `⏳ ${step.icon} ${step.name}`;
    }
  });
}
```

## Migration Plan

### Phase 1: Create Multi-Step Infrastructure
1. Create `QuoteWorkflowOrchestrator` class
2. Define step interfaces and types
3. Build step execution engine
4. Implement retry logic

### Phase 2: Create Step Prompt Templates
1. Design prompts for each of 5 steps
2. Test each step independently
3. Validate JSON output formats
4. Handle edge cases

### Phase 3: Implement for One Provider (GEICO)
1. Convert GEICO to 5-step workflow
2. Test end-to-end
3. Measure success rate improvement
4. Tune timeout and retry parameters

### Phase 4: Roll Out to All Providers
1. Progressive (similar flow to GEICO)
2. State Farm (may require agent contact detection earlier)
3. Allstate, Liberty Mutual, Nationwide
4. Farmers, USAA, Travelers
5. American Family

### Phase 5: Optimization
1. Identify common failure points
2. Add provider-specific handling
3. Implement smart retry strategies
4. Add session persistence for resume capability

## Expected Outcomes

### Success Rate Improvement
```
Current: 30-40% of quotes complete successfully
Target:  70-80% of quotes complete successfully

Current: 10 providers × 40% = 4 successful quotes
Target:  10 providers × 75% = 7-8 successful quotes

Improvement: ~2x more successful quotes
```

### Time to First Result
```
Current: Wait 15-20 minutes, then get all results (or failures)
Target:  First complete quote in 5-7 minutes
         All quotes within 15 minutes

User sees progress throughout instead of waiting blindly
```

### Cost Efficiency
```
Current: 10 providers × 20 min × 40% success = 80 min billable for 4 quotes
         = 20 min per successful quote

Target:  10 providers × 15 min × 75% success = 150 min billable for 7.5 quotes
         = 20 min per successful quote

Cost per quote similar, but 2x more successful quotes = better value
```

### User Experience
```
Current:
- Submit form
- Wait 15 minutes with spinner
- Get 4 results, 6 "failed"
- No idea why they failed

Target:
- Submit form
- See real-time progress: "GEICO: Filling driver info (Step 3/5)"
- Get 7-8 results, 2-3 "requires agent contact"
- Clear feedback on what happened
```

## Next Steps

1. **Review and approve this approach**
2. **Create the workflow orchestrator**
3. **Design step prompts for all providers**
4. **Test with GEICO first**
5. **Measure and iterate**
6. **Deploy to production**

---

**This multi-step approach aligns with Mino best practices and should significantly improve quote success rates!**
