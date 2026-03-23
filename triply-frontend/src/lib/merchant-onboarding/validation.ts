import { z } from 'zod';

const phoneRegex = /^\+?[\d\s-]{10,20}$/;
// IBAN: standard (2 letters + 2 digits + rest) or digits-only (15–34 digits)
const ibanRegex = /^([A-Z]{2}\d{2}[\sA-Z0-9]{12,34}|\d{15,34})$/i;

export const businessInfoSchema = z.object({
  businessName: z.string().min(1, 'Business name is required').max(200),
  contactPerson: z.string().min(1, 'Contact person is required').max(100),
  designation: z.string().min(1, 'Designation is required').max(100),
  email: z.string().email('Valid email is required'),
  phone: z.string().min(1, 'Phone is required').regex(phoneRegex, 'Valid phone number required (e.g. +971 50 123 4567)'),
  emirate: z.string().min(1, 'Emirate / City is required'),
  website: z.string().max(500).optional().or(z.literal('')),
  bankName: z.string().min(1, 'Bank name is required').max(100),
  accountHolderName: z.string().min(1, 'Account holder name is required').max(200),
  iban: z.string().min(1, 'IBAN is required').regex(ibanRegex, 'Valid IBAN required (e.g. AE07 0331 2345 6789 0123 456 or 15–34 digits)'),
  vatTrn: z.string().optional(),
  currency: z.string().min(1, 'Currency is required'),
});

export const serviceItemSchema = z.object({
  title: z.string().min(1, 'Service title is required').max(200),
  price: z.string().min(1, 'Price is required').refine((v) => !isNaN(parseFloat(v)) && parseFloat(v) >= 0, 'Valid price required'),
  duration: z.string().max(100),
  groupSize: z.string().optional(),
  languages: z.string().max(200),
  description: z.string().min(1, 'Description is required').max(5000),
  pointsHeading: z.string().max(200).optional(),
  pointGroups: z
    .array(
      z.object({
        text: z.string().max(500),
        subPoints: z.array(z.string().max(500)).optional(),
      })
    )
    .optional(),
  includes: z.array(z.string().max(200)).max(100).optional(),
  excludes: z.array(z.string().max(200)).max(100).optional(),
});

export type BusinessInfoFormData = z.infer<typeof businessInfoSchema>;
export type ServiceItemFormData = z.infer<typeof serviceItemSchema>;

export function validateBusinessInfo(data: unknown): { success: boolean; errors?: Record<string, string> } {
  const result = businessInfoSchema.safeParse(data);
  if (result.success) return { success: true };
  const errors: Record<string, string> = {};
  result.error.errors.forEach((e) => {
    const path = e.path[0] as string;
    if (path && !errors[path]) errors[path] = e.message;
  });
  return { success: false, errors };
}

export function validateServiceItem(data: unknown): { success: boolean; errors?: Record<string, string> } {
  const result = serviceItemSchema.safeParse(data);
  if (result.success) return { success: true };
  const errors: Record<string, string> = {};
  result.error.errors.forEach((e) => {
    const path = e.path[0] as string;
    if (path && !errors[path]) errors[path] = e.message;
  });
  return { success: false, errors };
}
