import { z } from 'zod';

export const CreateEnquirySchema = z.object({
  customerId: z.string().uuid('You must select a customer'), // Still needed for the form
  locationId: z.string().uuid('You must select a location'),
  subject: z.string().min(5, 'Subject must be at least 5 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  requirements: z.string().optional(),
  timeline: z.string().optional(),
  enquiryDate: z.string(),
  priority: z.enum(['Low', 'Medium', 'High', 'Urgent']),
  source: z.enum(['Website', 'Email', 'Phone', 'Referral', 'Trade Show', 'Social Media', 'Visit']),
  notes: z.string().optional(),
  quotationNumber: z.string().min(1, 'Quotation number is required'),
  entityType: z.enum(['customer', 'company']).optional(), // Track whether it's a customer or company
});

export const UpdateEnquirySchema = z.object({
  id: z.number(),
  status: z.enum(['NEW', 'IN_PROGRESS', 'QUOTED', 'CLOSED']),
});

export const UpdateEnquiryFullSchema = z.object({
  id: z.number(),
  subject: z.string().min(5, 'Subject must be at least 5 characters').optional(),
  description: z.string().min(10, 'Description must be at least 10 characters').optional(),
  requirements: z.string().optional(),
  timeline: z.string().optional(),
  priority: z.enum(['Low', 'Medium', 'High', 'Urgent']).optional(),
  source: z.enum(['Website', 'Email', 'Phone', 'Referral', 'Trade Show', 'Social Media', 'Visit']).optional(),
  notes: z.string().optional(),
});
