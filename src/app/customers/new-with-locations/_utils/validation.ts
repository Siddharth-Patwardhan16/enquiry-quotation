import { z } from 'zod';
import { CompanyFormData } from '../_types/company.types';

// Contact Person validation
export const contactPersonSchema = z.object({
  name: z.string().optional(),
  designation: z.string().optional(),
  phoneNumber: z.string().optional(),
  emailId: z.string().optional(),
  isPrimary: z.boolean()
});

// Address validation
export const addressSchema = z.object({
  address: z.string().optional(),
  area: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  pincode: z.string().optional()
});

// Office validation
export const officeSchema = z.object({
  name: z.string().optional(),
  ...addressSchema.shape,
  contacts: z.array(contactPersonSchema)
});

// Plant validation
export const plantSchema = z.object({
  name: z.string().optional(),
  ...addressSchema.shape,
  contacts: z.array(contactPersonSchema)
});

// Company form validation
export const companyFormSchema = z.object({
  companyName: z.string().optional(),
  offices: z.array(officeSchema).optional(),
  plants: z.array(plantSchema).optional(),
  // Purchase Order fields
  poRuptureDiscs: z.boolean(),
  poThermowells: z.boolean(),
  poHeatExchanger: z.boolean(),
  poMiscellaneous: z.boolean(),
  poWaterJetSteamJet: z.boolean(),
});

// Export the type
export type { CompanyFormData };
