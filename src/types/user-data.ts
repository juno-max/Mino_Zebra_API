import { z } from 'zod';

/**
 * User data schema for REAL insurance quote request
 * Complete data structure matching actual insurance forms
 */
export const UserDataSchema = z.object({
  // Driver personal information
  firstName: z.string().min(1, 'First name is required').optional(),
  lastName: z.string().min(1, 'Last name is required').optional(),
  dateOfBirth: z.string().optional(), // MM/DD/YYYY or YYYY-MM-DD
  gender: z.string().optional(), // 'Male', 'Female', or numeric codes
  maritalStatus: z.string().optional(), // 'Single', 'Married', or numeric codes
  email: z.string().email().optional(),
  phone: z.string().min(10, 'Phone must be at least 10 digits'),

  // License information
  licenseNumber: z.string().optional(),
  licenseState: z.string().optional(),

  // Vehicle information
  vin: z.string().min(17, 'VIN must be 17 characters').max(17),
  year: z.number().optional(),
  make: z.string().optional(),
  model: z.string().optional(),

  // Employment & Education
  employmentStatus: z.enum(['EMPLOYED', 'UNEMPLOYED', 'SELF_EMPLOYED', 'RETIRED', 'STUDENT']),
  educationLevel: z.enum(['HIGH_SCHOOL', 'SOME_COLLEGE', 'BACHELORS', 'MASTERS', 'DOCTORATE']),

  // Policy information
  policyStartDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in format: YYYY-MM-DD'),

  // Address information
  mailingAddress: z.string().min(1, 'Mailing address is required'),
  city: z.string().optional(),
  state: z.string().optional(),
  zipcode: z.string().optional(),
  isMailingSameAsGaraging: z.boolean(),
  garagingAddress: z.string().optional(),
});

export type UserData = z.infer<typeof UserDataSchema>;

/**
 * Validate and parse user data
 */
export function validateUserData(data: unknown): { success: true; data: UserData } | { success: false; errors: string[] } {
  const result = UserDataSchema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  return {
    success: false,
    errors: result.error.errors.map(err => `${err.path.join('.')}: ${err.message}`)
  };
}
