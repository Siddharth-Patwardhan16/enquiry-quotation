import { z } from 'zod';

export const CreateEnquirySchema = z.object({
  customerId: z.string().uuid('You must select a customer'),
  subject: z.string().min(5, 'Subject must be at least 5 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  requirements: z.string().optional(),
  expectedBudget: z.string().optional(),
  timeline: z.string().optional(),
  enquiryDate: z.string(),
  priority: z.enum(['Low', 'Medium', 'High', 'Urgent']),
  source: z.enum(['Website', 'Email', 'Phone', 'Referral', 'Trade Show', 'Social Media']),
  notes: z.string().optional(),
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
  expectedBudget: z.string().optional(),
  timeline: z.string().optional(),
  priority: z.enum(['Low', 'Medium', 'High', 'Urgent']).optional(),
  source: z.enum(['Website', 'Email', 'Phone', 'Referral', 'Trade Show', 'Social Media']).optional(),
  notes: z.string().optional(),
});
