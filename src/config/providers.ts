import { UserData } from '../types/user-data.js';

/**
 * Insurance provider configuration
 */
export interface ProviderConfig {
  id: string;
  name: string;
  url: string;
  goalTemplate: string;
}

/**
 * Replace template variables with actual user data
 */
function fillTemplate(template: string, data: UserData): string {
  return template
    .replace(/\{\{vin\}\}/g, data.vin)
    .replace(/\{\{year\}\}/g, data.year?.toString() || '')
    .replace(/\{\{make\}\}/g, data.make || '')
    .replace(/\{\{model\}\}/g, data.model || '')
    .replace(/\{\{firstName\}\}/g, data.firstName || '')
    .replace(/\{\{lastName\}\}/g, data.lastName || '')
    .replace(/\{\{dateOfBirth\}\}/g, data.dateOfBirth || '')
    .replace(/\{\{gender\}\}/g, data.gender || '')
    .replace(/\{\{maritalStatus\}\}/g, data.maritalStatus || '')
    .replace(/\{\{employmentStatus\}\}/g, data.employmentStatus)
    .replace(/\{\{policyStartDate\}\}/g, data.policyStartDate)
    .replace(/\{\{educationLevel\}\}/g, data.educationLevel)
    .replace(/\{\{phone\}\}/g, data.phone)
    .replace(/\{\{email\}\}/g, data.email || '')
    .replace(/\{\{mailingAddress\}\}/g, data.mailingAddress)
    .replace(/\{\{city\}\}/g, data.city || '')
    .replace(/\{\{state\}\}/g, data.state || '')
    .replace(/\{\{zipcode\}\}/g, data.zipcode || '')
    .replace(/\{\{licenseNumber\}\}/g, data.licenseNumber || '')
    .replace(/\{\{garagingAddress\}\}/g, data.isMailingSameAsGaraging ? data.mailingAddress : (data.garagingAddress || data.mailingAddress));
}

/**
 * REAL insurance providers - actual insurance company websites
 */
export const PROVIDERS: ProviderConfig[] = [
  {
    id: 'geico',
    name: 'GEICO',
    url: 'https://www.geico.com/',
    goalTemplate: `You are an AI agent filling out a GEICO auto insurance quote form. Navigate to the quote page and complete ALL fields with this REAL customer data:

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
}`
  },
  {
    id: 'progressive',
    name: 'Progressive',
    url: 'https://www.progressive.com/',
    goalTemplate: `You are an AI agent filling out a Progressive auto insurance quote form. Complete ALL form fields with this REAL data:

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
}`
  },
  {
    id: 'statefarm',
    name: 'State Farm',
    url: 'https://www.statefarm.com/',
    goalTemplate: `You are an AI agent getting a State Farm auto insurance quote. Fill out their quote form with this COMPLETE REAL customer data:

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
}`
  }
];

/**
 * Get all provider configurations with user data filled in
 */
export function getProviderGoals(userData: UserData): Array<{ config: ProviderConfig; goal: string }> {
  return PROVIDERS.map(provider => ({
    config: provider,
    goal: fillTemplate(provider.goalTemplate, userData)
  }));
}
