import { z } from 'zod';

export const CreateEnquirySchema = z.object({
  customerId: z.string().optional(),
  locationId: z.string().optional(),
  subject: z.string().optional(),
  description: z.string().optional(),
  requirements: z.string().optional(),
  timeline: z.string().optional(),
  enquiryDate: z.string().optional(),
  priority: z.enum(['Low', 'Medium', 'High', 'Urgent']).optional(),
  source: z.enum(['Website', 'Email', 'Phone', 'Referral', 'Trade Show', 'Social Media', 'Visit']).optional(),
  notes: z.string().optional(),
  quotationNumber: z.string().optional(),
  region: z.string().optional(),
  oaNumber: z.string().optional(),
  dateOfReceipt: z.string().optional(),
  blockModel: z.string().optional(),
  numberOfBlocks: z.number().optional(),
  designRequired: z.enum(['Standard', 'Custom', 'Modified', 'None']).optional(),
  attendedById: z.string().optional(),
  customerType: z.enum(['NEW', 'OLD']).optional(),
  status: z.enum(['LIVE', 'DEAD', 'RCD', 'LOST']).optional(),
  entityType: z.enum(['customer', 'company']).optional(),
}).refine((data) => {
  // Only validate UUID format if the string is not empty
  if (data.customerId && data.customerId.trim() !== '') {
    return z.string().uuid().safeParse(data.customerId).success;
  }
  if (data.locationId && data.locationId.trim() !== '') {
    return z.string().uuid().safeParse(data.locationId).success;
  }
  if (data.attendedById && data.attendedById.trim() !== '') {
    return z.string().uuid().safeParse(data.attendedById).success;
  }
  return true;
}, {
  message: 'Invalid UUID format',
});

export const UpdateEnquirySchema = z.object({
  id: z.number(),
  status: z.enum(['LIVE', 'DEAD', 'RCD', 'LOST']),
});

export const UpdateEnquiryFullSchema = z.object({
  id: z.number(),
  subject: z.string().optional(),
  description: z.string().optional(),
  requirements: z.string().optional(),
  timeline: z.string().optional(),
  enquiryDate: z.string().optional(),
  priority: z.enum(['Low', 'Medium', 'High', 'Urgent']).optional(),
  source: z.enum(['Website', 'Email', 'Phone', 'Referral', 'Trade Show', 'Social Media', 'Visit']).optional(),
  notes: z.string().optional(),
  quotationNumber: z.string().optional(),
  region: z.string().optional(),
  oaNumber: z.string().optional(),
  dateOfReceipt: z.string().optional(),
  blockModel: z.string().optional(),
  numberOfBlocks: z.number().optional(),
  designRequired: z.enum(['Standard', 'Custom', 'Modified', 'None']).optional(),
  attendedById: z.string().optional(),
  customerType: z.enum(['NEW', 'OLD']).optional(),
  status: z.enum(['LIVE', 'DEAD', 'RCD', 'LOST']).optional(),
}).refine((data) => {
  // Only validate UUID format if the string is not empty
  if (data.attendedById && data.attendedById.trim() !== '') {
    return z.string().uuid().safeParse(data.attendedById).success;
  }
  return true;
}, {
  message: 'Invalid UUID format for attendedById',
});
