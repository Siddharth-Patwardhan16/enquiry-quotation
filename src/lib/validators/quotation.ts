import { z } from 'zod';

// Schema for a single line item in the quotation
export const QuotationItemSchema = z.object({
  materialDescription: z.string().min(1, 'Description is required'),
  specifications: z.string().optional(),
  quantity: z.coerce.number().min(1, 'Quantity must be at least 1'),
  pricePerUnit: z.coerce.number().min(0, 'Price cannot be negative'),
});

// Main schema for creating a quotation
export const CreateQuotationSchema = z.object({
  enquiryId: z.coerce.number().min(1, 'You must select an enquiry'),
  revisionNumber: z.coerce.number().default(0),
  quotationDate: z.string().optional(),
  deliverySchedule: z.string().optional(),
  currency: z.string().default('INR'),
  // The quotation must have at least one line item
  items: z.array(QuotationItemSchema).min(1, 'You must add at least one item'),
});
