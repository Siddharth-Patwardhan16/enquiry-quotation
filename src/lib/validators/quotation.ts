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
  gst: z.coerce.number().min(0, 'GST percentage cannot be negative').max(100, 'GST percentage cannot exceed 100%').default(0),
  packingForwardingPercentage: z.coerce.number().min(0, 'Packing and Forwarding percentage cannot be negative').max(5, 'Packing and Forwarding percentage cannot exceed 5%').default(3),
  incoterms: z.string().optional(),
  // The quotation must have at least one line item
  items: z.array(QuotationItemSchema).min(1, 'You must add at least one item'),
});
