import { z } from 'zod';

// Re-using the enums from your Prisma schema is a best practice
export const UpdateQuotationStatusSchema = z.object({
  quotationId: z.string().uuid(),
  status: z.enum([
    'LIVE',
    'WON',
    'LOST',
    'BUDGETARY',
    'DEAD',
  ]),
  // Optional fields that are only required for specific statuses
  lostReason: z.enum([
    'PRICE',
    'DELIVERY_SCHEDULE',
    'LACK_OF_CONFIDENCE',
    'OTHER'
  ]).optional(),
  purchaseOrderNumber: z.string().optional(),
  poValue: z.number().optional(),
  poDate: z.string().optional(),
  // Add other fields like 'OA No' and 'Total Basic Price' if needed
});
