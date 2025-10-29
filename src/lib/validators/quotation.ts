import { z } from 'zod';

// Schema for a single line item in the quotation
export const QuotationItemSchema = z.object({
  materialDescription: z.string().optional(),
  specifications: z.string().optional(),
  quantity: z.coerce.number().optional().default(0),
  pricePerUnit: z.coerce.number().optional().default(0),
});

// Main schema for creating a quotation
export const CreateQuotationSchema = z.object({
  enquiryId: z.coerce.number().optional(),
  revisionNumber: z.coerce.number().default(0),
  quotationDate: z.string().optional(),
  deliverySchedule: z.string().optional(),
  currency: z.string().default('INR'),
  items: z.array(QuotationItemSchema).optional().default([]),
});
