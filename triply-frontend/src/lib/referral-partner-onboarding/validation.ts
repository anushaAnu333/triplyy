import { z } from 'zod';
import { businessInfoSchema } from '@/lib/merchant-onboarding/validation';

/** Same fields as merchant onboarding; friendlier copy for the name field. */
export const referralPartnerBusinessInfoSchema = businessInfoSchema.extend({
  businessName: z.string().min(1, 'Name is required').max(200),
});
