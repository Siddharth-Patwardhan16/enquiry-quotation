import { z } from 'zod';
import { CompanyFormData } from '../_types/company.types';

// Contact Person validation
export const contactPersonSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  designation: z.string().min(1, 'Designation is required'),
  phoneNumber: z.string().min(10, 'Phone number must be at least 10 digits'),
  emailId: z.string().email('Invalid email address'),
  isPrimary: z.boolean()
});

// Address validation
export const addressSchema = z.object({
  address: z.string().min(1, 'Address is required'),
  area: z.string(),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  country: z.string().min(1, 'Country is required'),
  pincode: z.string()
});

// Office validation
export const officeSchema = z.object({
  name: z.string().min(1, 'Office name is required'),
  ...addressSchema.shape,
  contacts: z.array(contactPersonSchema)
});

// Plant validation
export const plantSchema = z.object({
  name: z.string().min(1, 'Plant name is required'),
  ...addressSchema.shape,
  contacts: z.array(contactPersonSchema)
});

// Company form validation
export const companyFormSchema = z.object({
  companyName: z.string().min(1, 'Company name is required'),
  website: z.string().optional(),
  industry: z.string().optional(),
  offices: z.array(officeSchema).min(1, 'At least one office is required'),
  plants: z.array(plantSchema),
  // Purchase Order fields
  poRuptureDiscs: z.boolean(),
  poThermowells: z.boolean(),
  poHeatExchanger: z.boolean(),
  poMiscellaneous: z.boolean(),
  poWaterJetSteamJet: z.boolean(),
  // Additional Information fields
  existingGraphiteSuppliers: z.string().optional(),
  problemsFaced: z.string().optional(),
});

// Export the type
export type { CompanyFormData };
