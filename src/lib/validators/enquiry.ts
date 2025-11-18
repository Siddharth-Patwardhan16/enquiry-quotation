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
  source: z.preprocess(
    (val) => {
      // Convert empty strings, null, or undefined to undefined BEFORE validation
      if (val === '' || val === null || val === undefined) {
        return undefined;
      }
      if (typeof val === 'string' && val.trim() === '') {
        return undefined;
      }
      return val;
    },
    z.enum(['Website', 'Email', 'Phone', 'Referral', 'Trade Show', 'Social Media', 'Visit']).optional()
  ),
  notes: z.string().optional(),
  quotationNumber: z.string().optional(),
  quotationDate: z.string().optional(),
  region: z.string().optional(),
  oaNumber: z.string().optional(),
  oaDate: z.string().optional(),
  blockModel: z.string().optional(),
  numberOfBlocks: z.preprocess(
    (val) => (val === '' || val === null || val === undefined || (typeof val === 'number' && isNaN(val)) ? undefined : val),
    z.number().optional()
  ),
  designRequired: z.preprocess(
    (val) => {
      // Convert empty strings, null, or undefined to undefined BEFORE validation
      if (val === '' || val === null || val === undefined) {
        return undefined;
      }
      if (typeof val === 'string' && val.trim() === '') {
        return undefined;
      }
      return val;
    },
    z.enum(['Yes', 'No']).optional()
  ),
  attendedById: z.preprocess(
    (val) => {
      // Allow null to pass through (for clearing the field)
      if (val === null) {
        return null;
      }
      // Convert empty strings, undefined, or string "null"/"undefined" to undefined BEFORE validation
      if (val === '' || val === undefined) {
        return undefined;
      }
      if (typeof val === 'string') {
        const trimmed = val.trim();
        // Handle empty string, whitespace-only, or string representations of null/undefined
        if (trimmed === '' || trimmed === 'null' || trimmed === 'undefined' || trimmed.toLowerCase() === 'null' || trimmed.toLowerCase() === 'undefined') {
          return undefined;
        }
        return trimmed;
      }
      return val;
    },
    z.string().uuid().optional().nullable()
  ),
  customerType: z.preprocess(
    (val) => {
      // Convert empty strings, null, or undefined to undefined BEFORE validation
      if (val === '' || val === null || val === undefined) {
        return undefined;
      }
      if (typeof val === 'string' && val.trim() === '') {
        return undefined;
      }
      return val;
    },
    z.enum(['NEW', 'OLD']).optional()
  ),
  status: z.preprocess(
    (val) => {
      // Convert empty strings, null, or undefined to undefined BEFORE validation
      if (val === '' || val === null || val === undefined) {
        return undefined;
      }
      if (typeof val === 'string' && val.trim() === '') {
        return undefined;
      }
      return val;
    },
    z.enum(['LIVE', 'DEAD', 'RCD', 'LOST']).optional()
  ),
  entityType: z.enum(['customer', 'company']).optional(),
}).refine((data) => {
  // Only validate UUID format if the string is not empty
  if (data.customerId && typeof data.customerId === 'string' && data.customerId.trim() !== '') {
    const isValid = z.string().uuid().safeParse(data.customerId.trim()).success;
    if (!isValid) {
      return false;
    }
  }
  if (data.locationId && typeof data.locationId === 'string' && data.locationId.trim() !== '') {
    const isValid = z.string().uuid().safeParse(data.locationId.trim()).success;
    if (!isValid) {
      return false;
    }
  }
  if (data.attendedById && typeof data.attendedById === 'string' && data.attendedById.trim() !== '') {
    const isValid = z.string().uuid().safeParse(data.attendedById.trim()).success;
    if (!isValid) {
      return false;
    }
  }
  return true;
}, {
  message: 'Invalid UUID format. Please select valid customer, location, or employee.',
});

export const UpdateEnquirySchema = z.object({
  id: z.number(),
  status: z.enum(['LIVE', 'DEAD', 'RCD', 'LOST', 'WON']),
  purchaseOrderNumber: z.string().optional(),
  poValue: z.number().optional(),
  poDate: z.string().optional(),
});

export const UpdateEnquiryFullSchema = z.object({
  id: z.number(),
  subject: z.string().optional(),
  description: z.string().optional(),
  requirements: z.string().optional(),
  timeline: z.string().optional(),
  enquiryDate: z.string().optional(),
  priority: z.enum(['Low', 'Medium', 'High', 'Urgent']).optional(),
  source: z.preprocess(
    (val) => {
      // Convert empty strings, null, or undefined to undefined BEFORE validation
      if (val === '' || val === null || val === undefined) {
        return undefined;
      }
      if (typeof val === 'string' && val.trim() === '') {
        return undefined;
      }
      return val;
    },
    z.enum(['Website', 'Email', 'Phone', 'Referral', 'Trade Show', 'Social Media', 'Visit']).optional()
  ),
  notes: z.string().optional(),
  quotationNumber: z.string().optional(),
  quotationDate: z.string().optional(),
  region: z.string().optional(),
  oaNumber: z.string().optional(),
  oaDate: z.string().optional(),
  dateOfReceipt: z.string().optional(),
  blockModel: z.string().optional(),
  numberOfBlocks: z.preprocess(
    (val) => (val === '' || val === null || val === undefined || (typeof val === 'number' && isNaN(val)) ? undefined : val),
    z.number().optional()
  ),
  designRequired: z.preprocess(
    (val) => {
      // Convert empty strings, null, or undefined to undefined BEFORE validation
      if (val === '' || val === null || val === undefined) {
        return undefined;
      }
      if (typeof val === 'string' && val.trim() === '') {
        return undefined;
      }
      return val;
    },
    z.enum(['Yes', 'No']).optional()
  ),
  attendedById: z.preprocess(
    (val) => {
      // Allow null to pass through (for clearing the field)
      if (val === null) {
        return null;
      }
      // Convert empty strings, undefined, or string "null"/"undefined" to undefined BEFORE validation
      if (val === '' || val === undefined) {
        return undefined;
      }
      if (typeof val === 'string') {
        const trimmed = val.trim();
        // Handle empty string, whitespace-only, or string representations of null/undefined
        if (trimmed === '' || trimmed === 'null' || trimmed === 'undefined' || trimmed.toLowerCase() === 'null' || trimmed.toLowerCase() === 'undefined') {
          return undefined;
        }
        return trimmed;
      }
      return val;
    },
    z.string().uuid().optional().nullable()
  ),
  customerType: z.preprocess(
    (val) => {
      // Convert empty strings, null, or undefined to undefined BEFORE validation
      if (val === '' || val === null || val === undefined) {
        return undefined;
      }
      if (typeof val === 'string' && val.trim() === '') {
        return undefined;
      }
      return val;
    },
    z.enum(['NEW', 'OLD']).optional()
  ),
  status: z.preprocess(
    (val) => {
      // Convert empty strings, null, or undefined to undefined BEFORE validation
      if (val === '' || val === null || val === undefined) {
        return undefined;
      }
      if (typeof val === 'string' && val.trim() === '') {
        return undefined;
      }
      return val;
    },
    z.enum(['LIVE', 'DEAD', 'RCD', 'LOST']).optional()
  ),
}).refine((data) => {
  // Only validate UUID format if attendedById is provided and not empty
  const attendedById = data.attendedById;
  
  // Allow undefined, null, or empty string (optional field)
  if (attendedById === undefined || attendedById === null || attendedById === '') {
    return true;
  }
  
  // If it's a string, check if it's just whitespace
  if (typeof attendedById === 'string' && attendedById.trim() === '') {
    return true;
  }
  
  // If we have a non-empty value, it must be a valid UUID
  if (typeof attendedById === 'string') {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(attendedById.trim());
  }
  
  return true;
}, {
  message: 'Invalid UUID format for attendedById',
  path: ['attendedById']
});
