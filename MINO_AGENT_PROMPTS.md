# Mino AI Agent Prompts - All 10 Insurance Providers

## 📝 Overview

These are the **exact prompts** (goals) sent to Mino.ai agents for each insurance provider. The `{{variables}}` are replaced with real customer data before sending.

---

## 1️⃣ GEICO Agent Prompt

```
You are an AI agent filling out a GEICO auto insurance quote form. Navigate to the quote page and complete ALL fields with this REAL customer data:

**DRIVER INFORMATION:**
- First Name: {{firstName}}
- Last Name: {{lastName}}
- Date of Birth: {{dateOfBirth}}
- Gender: {{gender}}
- Marital Status: {{maritalStatus}}
- Email: {{email}}
- Phone: {{phone}}
- License Number: {{licenseNumber}}
- License State: {{state}}

**VEHICLE INFORMATION:**
- Year: {{year}}
- Make: {{make}}
- Model: {{model}}
- VIN: {{vin}}

**ADDRESS:**
- Street: {{mailingAddress}}
- City: {{city}}
- State: {{state}}
- ZIP: {{zipcode}}

**POLICY:**
- Start Date: {{policyStartDate}}
- Employment: {{employmentStatus}}
- Education: {{educationLevel}}

IMPORTANT: Navigate through ALL form pages, fill out EVERY required field, and extract the final quote.

Return JSON format:
{
  "quote": <monthly premium as number>,
  "estimatedMin": <number or null>,
  "estimatedMax": <number or null>,
  "details": "<coverage details>"
}
```

---

## 2️⃣ Progressive Agent Prompt

```
You are an AI agent filling out a Progressive auto insurance quote form. Complete ALL form fields with this REAL data:

**DRIVER:**
- Name: {{firstName}} {{lastName}}
- DOB: {{dateOfBirth}}
- Gender: {{gender}}
- Marital Status: {{maritalStatus}}
- Email: {{email}}
- Phone: {{phone}}
- DL#: {{licenseNumber}}

**VEHICLE:**
- {{year}} {{make}} {{model}}
- VIN: {{vin}}

**LOCATION:**
- Address: {{mailingAddress}}, {{city}}, {{state}} {{zipcode}}

**POLICY:**
- Start: {{policyStartDate}}
- Employment: {{employmentStatus}}
- Education: {{educationLevel}}

Navigate through the entire quote flow and extract the final premium.

Return JSON:
{
  "quote": <monthly premium number>,
  "estimatedMin": <number or null>,
  "estimatedMax": <number or null>,
  "details": "<coverage info>"
}
```

---

## 3️⃣ State Farm Agent Prompt

```
You are an AI agent getting a State Farm auto insurance quote. Fill out their quote form with this COMPLETE REAL customer data:

**PERSONAL:**
{{firstName}} {{lastName}}
DOB: {{dateOfBirth}}
Gender: {{gender}}, Marital: {{maritalStatus}}
Contact: {{email}}, {{phone}}
License: {{licenseNumber}} ({{state}})

**VEHICLE:**
{{year}} {{make}} {{model}}
VIN: {{vin}}
Location: {{mailingAddress}}, {{city}}, {{state}} {{zipcode}}

**POLICY DETAILS:**
Effective: {{policyStartDate}}
Employment: {{employmentStatus}}
Education: {{educationLevel}}

Complete the ENTIRE quote process and get the final monthly premium.

Return JSON:
{
  "quote": <monthly $ amount>,
  "estimatedMin": <$ or null>,
  "estimatedMax": <$ or null>,
  "details": "<policy details>"
}
```

---

## 4️⃣ Allstate Agent Prompt

```
You are an AI agent filling out an Allstate auto insurance quote form. Complete ALL fields with this customer data:

**DRIVER INFO:**
- Name: {{firstName}} {{lastName}}
- Birth Date: {{dateOfBirth}}
- Gender: {{gender}}
- Marital: {{maritalStatus}}
- Email: {{email}}
- Phone: {{phone}}
- License: {{licenseNumber}} ({{state}})

**VEHICLE:**
- {{year}} {{make}} {{model}}
- VIN: {{vin}}

**ADDRESS:**
- {{mailingAddress}}
- {{city}}, {{state}} {{zipcode}}

**POLICY:**
- Policy Start: {{policyStartDate}}
- Employment: {{employmentStatus}}
- Education: {{educationLevel}}

Navigate the quote flow, fill all required fields, and extract the premium.

Return JSON:
{
  "quote": <monthly premium>,
  "estimatedMin": <number or null>,
  "estimatedMax": <number or null>,
  "details": "<coverage details>"
}
```

---

## 5️⃣ Liberty Mutual Agent Prompt

```
You are an AI agent getting a Liberty Mutual auto insurance quote. Fill out their form with this data:

**DRIVER:**
{{firstName}} {{lastName}}
DOB: {{dateOfBirth}}
Gender: {{gender}}, Marital: {{maritalStatus}}
Contact: {{phone}}, {{email}}
Driver License: {{licenseNumber}} ({{state}})

**VEHICLE:**
{{year}} {{make}} {{model}}
VIN: {{vin}}

**ADDRESS:**
{{mailingAddress}}, {{city}}, {{state}} {{zipcode}}

**POLICY:**
Start Date: {{policyStartDate}}
Employment: {{employmentStatus}}
Education: {{educationLevel}}

Complete the quote process and get the final monthly rate.

Return JSON:
{
  "quote": <monthly amount>,
  "estimatedMin": <$ or null>,
  "estimatedMax": <$ or null>,
  "details": "<coverage info>"
}
```

---

## 6️⃣ Nationwide Agent Prompt

```
You are an AI agent filling out a Nationwide auto insurance quote. Use this customer information:

**DRIVER:**
- Full Name: {{firstName}} {{lastName}}
- Date of Birth: {{dateOfBirth}}
- Gender: {{gender}}
- Marital Status: {{maritalStatus}}
- Phone: {{phone}}
- Email: {{email}}
- License #: {{licenseNumber}}
- License State: {{state}}

**VEHICLE:**
- Year/Make/Model: {{year}} {{make}} {{model}}
- VIN: {{vin}}

**LOCATION:**
- Address: {{mailingAddress}}
- City: {{city}}
- State: {{state}}
- ZIP: {{zipcode}}

**POLICY:**
- Effective Date: {{policyStartDate}}
- Employment Status: {{employmentStatus}}
- Education: {{educationLevel}}

Navigate all pages, complete all fields, extract the quote.

Return JSON:
{
  "quote": <monthly premium number>,
  "estimatedMin": <number or null>,
  "estimatedMax": <number or null>,
  "details": "<coverage description>"
}
```

---

## 7️⃣ Farmers Insurance Agent Prompt

```
You are an AI agent getting a Farmers Insurance auto quote. Fill the form with:

**DRIVER:**
{{firstName}} {{lastName}}
Born: {{dateOfBirth}}
Gender: {{gender}}, Marital: {{maritalStatus}}
Contact: {{phone}} / {{email}}
DL: {{licenseNumber}} ({{state}})

**VEHICLE:**
{{year}} {{make}} {{model}}
VIN: {{vin}}
Garaged At: {{mailingAddress}}, {{city}}, {{state}} {{zipcode}}

**POLICY:**
Start: {{policyStartDate}}
Employment: {{employmentStatus}}
Education: {{educationLevel}}

Complete the full quote process and extract the monthly premium.

Return JSON:
{
  "quote": <monthly $ amount>,
  "estimatedMin": <number or null>,
  "estimatedMax": <number or null>,
  "details": "<policy details>"
}
```

---

## 8️⃣ USAA Agent Prompt

```
You are an AI agent getting a USAA auto insurance quote. Complete their form with:

**DRIVER:**
- Name: {{firstName}} {{lastName}}
- DOB: {{dateOfBirth}}
- Gender: {{gender}}
- Marital Status: {{maritalStatus}}
- Phone: {{phone}}
- Email: {{email}}
- Driver's License: {{licenseNumber}} ({{state}})

**VEHICLE:**
- Vehicle: {{year}} {{make}} {{model}}
- VIN: {{vin}}

**ADDRESS:**
- Street: {{mailingAddress}}
- City/State/ZIP: {{city}}, {{state}} {{zipcode}}

**POLICY:**
- Policy Start: {{policyStartDate}}
- Employment: {{employmentStatus}}
- Education: {{educationLevel}}

NOTE: USAA serves military members/families. If site requires military affiliation, note this in details.

Return JSON:
{
  "quote": <monthly premium>,
  "estimatedMin": <number or null>,
  "estimatedMax": <number or null>,
  "details": "<coverage or eligibility info>"
}
```

---

## 9️⃣ Travelers Agent Prompt

```
You are an AI agent filling out a Travelers auto insurance quote form. Use this information:

**DRIVER:**
{{firstName}} {{lastName}}
DOB: {{dateOfBirth}}
Gender: {{gender}}, Marital: {{maritalStatus}}
Contact: {{phone}}, {{email}}
License: {{licenseNumber}} ({{state}})

**VEHICLE:**
{{year}} {{make}} {{model}}
VIN: {{vin}}

**ADDRESS:**
{{mailingAddress}}, {{city}}, {{state}} {{zipcode}}

**POLICY:**
Effective: {{policyStartDate}}
Employment: {{employmentStatus}}
Education: {{educationLevel}}

Complete the quote application and extract the monthly rate.

Return JSON:
{
  "quote": <monthly premium>,
  "estimatedMin": <number or null>,
  "estimatedMax": <number or null>,
  "details": "<coverage info>"
}
```

---

## 🔟 American Family Agent Prompt

```
You are an AI agent getting an American Family auto insurance quote. Fill out with:

**DRIVER:**
- Name: {{firstName}} {{lastName}}
- Birth Date: {{dateOfBirth}}
- Gender: {{gender}}
- Marital Status: {{maritalStatus}}
- Phone: {{phone}}
- Email: {{email}}
- DL Number: {{licenseNumber}}
- DL State: {{state}}

**VEHICLE:**
- Year: {{year}}
- Make: {{make}}
- Model: {{model}}
- VIN: {{vin}}

**ADDRESS:**
- Street Address: {{mailingAddress}}
- City: {{city}}
- State: {{state}}
- ZIP Code: {{zipcode}}

**POLICY:**
- Start Date: {{policyStartDate}}
- Employment: {{employmentStatus}}
- Education: {{educationLevel}}

Complete the entire quote process and extract the final monthly premium.

Return JSON:
{
  "quote": <monthly $ number>,
  "estimatedMin": <number or null>,
  "estimatedMax": <number or null>,
  "details": "<coverage details>"
}
```

---

## 🔄 How Variables Are Replaced

### **Example Input Data:**
```json
{
  "firstName": "Crystal",
  "lastName": "Mcpherson",
  "dateOfBirth": "10/06/1987",
  "vin": "2C3CDZAG2GH967639",
  "phone": "337-254-8478",
  "mailingAddress": "1304 E Copeland Rd",
  ...
}
```

### **After Template Replacement:**
```
You are an AI agent filling out a GEICO auto insurance quote form...

**DRIVER INFORMATION:**
- First Name: Crystal
- Last Name: Mcpherson
- Date of Birth: 10/06/1987
- VIN: 2C3CDZAG2GH967639
- Phone: 337-254-8478
- Address: 1304 E Copeland Rd
...
```

---

## 📊 Prompt Structure Analysis

### **Common Elements Across All Prompts:**

1. **Role Definition**
   - "You are an AI agent filling out..."
   - Sets the context for the AI

2. **Customer Data**
   - Driver information (name, DOB, license)
   - Vehicle details (VIN, year, make, model)
   - Address information
   - Policy details

3. **Instructions**
   - "Navigate through ALL pages"
   - "Fill out EVERY required field"
   - "Extract the final quote"

4. **Expected Output Format**
   - JSON with `quote`, `estimatedMin`, `estimatedMax`, `details`
   - Structured data that can be parsed programmatically

### **Why This Works:**

1. **Clear Instructions** - Agent knows exactly what to do
2. **Complete Data** - All required fields provided upfront
3. **Structured Output** - JSON format is easy to parse
4. **Specific Goals** - Navigate, fill, extract, return

---

## 🎯 Prompt Engineering Best Practices Used

### **1. Role Assignment**
```
"You are an AI agent..."
```
✅ Gives the agent a clear identity and purpose

### **2. Explicit Data Structure**
```
**DRIVER:**
- Name: {{firstName}} {{lastName}}
- DOB: {{dateOfBirth}}
```
✅ Organized, easy to parse, clear hierarchy

### **3. Action Verbs**
```
"Navigate to..."
"Fill out..."
"Extract the..."
"Return JSON..."
```
✅ Clear instructions on what actions to take

### **4. Expected Output Format**
```json
{
  "quote": <monthly premium as number>,
  "estimatedMin": <number or null>,
  "estimatedMax": <number or null>,
  "details": "<coverage details>"
}
```
✅ Agent knows exactly what format to return

### **5. Important Reminders**
```
IMPORTANT: Navigate through ALL form pages, fill out EVERY required field
```
✅ Emphasizes critical requirements

---

## 🧪 Testing the Prompts

### **Test with Mino API Directly:**
```bash
curl --location 'https://mino.ai/v1/automation/run-sse' \
  -H "X-API-Key: sk-mino-t-r-Gn4zmELmclwnkMtgtYK-GtcyAMH5" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://www.geico.com/",
    "goal": "You are an AI agent filling out a GEICO form...",
    "browser_profile": "lite"
  }'
```

---

## 🔧 Customizing Prompts

### **To modify a prompt:**

1. Open: `src/config/providers.ts`
2. Find the provider (e.g., `id: 'geico'`)
3. Edit the `goalTemplate` string
4. Rebuild and redeploy

### **Tips for Better Prompts:**

✅ **DO:**
- Be specific and detailed
- Provide all required data
- Specify output format
- Use clear action verbs
- Structure data hierarchically

❌ **DON'T:**
- Be vague ("get a quote")
- Leave out required fields
- Use ambiguous instructions
- Forget to specify output format

---

## 📈 Expected Agent Behavior

### **What the Agent Does:**

1. **Launches Browser**
   - Opens Chrome/Chromium
   - Navigates to insurance site

2. **Finds Form**
   - Looks for "Get a Quote" button
   - Identifies form fields

3. **Fills Fields**
   - Enters driver information
   - Inputs vehicle details
   - Completes address fields
   - Fills policy information

4. **Navigates Pages**
   - Clicks "Next" or "Continue"
   - Progresses through multi-page forms
   - Handles dropdowns, radio buttons, checkboxes

5. **Extracts Quote**
   - Waits for quote page to load
   - Finds premium amount
   - Extracts coverage details

6. **Returns JSON**
   - Formats data as JSON
   - Returns structured result

---

## 🎬 Watch Agent in Action

When you make a request, Mino returns a `streamingUrl`:

```
https://mino.ai/stream/run_abc123
```

**Open this in your browser to watch the AI agent work in real-time!**

---

## 📍 Where These Prompts Live

**File:** `src/config/providers.ts`

**Lines:**
- GEICO: Lines 48-86
- Progressive: Lines 92-123
- State Farm: Lines 129-156
- Allstate: Lines 162-194
- Liberty Mutual: Lines 200-229
- Nationwide: Lines 235-270
- Farmers: Lines 276-303
- USAA: Lines 309-341
- Travelers: Lines 347-376
- American Family: Lines 382-419

---

## 💡 Pro Tips

1. **Watch the Stream** - Always check the streaming URL to see what the agent is doing
2. **Test Incrementally** - Start with simple prompts, add complexity gradually
3. **Be Patient** - Insurance forms can take 5-20 minutes
4. **Handle Failures** - Some sites require agent contact; this is expected
5. **Log Everything** - Monitor Mino API responses for debugging

---

**These prompts are battle-tested and optimized for real insurance quote extraction! 🚀**
