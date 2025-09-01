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
  quotationNumber: z.string().min(1, 'Quotation number is required'),
  revisionNumber: z.coerce.number().default(0),
  quotationDate: z.string().optional(),
  validityPeriod: z.string().optional(),
  paymentTerms: z.string().optional(),
  deliverySchedule: z.string().optional(),
  specialInstructions: z.string().optional(),
  currency: z.string().default('INR'),
  // Commercial Terms - using proper decimal fields
  transportCosts: z.coerce.number().min(0, 'Transport costs cannot be negative').default(0),
  insuranceCosts: z.coerce.number().min(0, 'Insurance costs cannot be negative').default(0),
  gst: z.coerce.number().min(0, 'GST cannot be negative').default(0),
  // The quotation must have at least one line item
  items: z.array(QuotationItemSchema).min(1, 'You must add at least one item'),
});
