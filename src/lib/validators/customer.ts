import { z } from 'zod';

export const CreateCustomerSchema = z.object({
  name: z.string().min(2, 'Customer name is required'),
  
  // Office Information
  officeName: z.string().optional(),
  officeAddress: z.string().optional(),
  officeCity: z.string().optional(),
  officeState: z.string().optional(),
  officeCountry: z.string().optional(),
  officeReceptionNumber: z.string().optional(),
  
  // Plant Information
  plantName: z.string().optional(),
  plantAddress: z.string().optional(),
  plantCity: z.string().optional(),
  plantState: z.string().optional(),
  plantCountry: z.string().optional(),
  plantReceptionNumber: z.string().optional(),
  
  // PO Received from Customer
  poRuptureDiscs: z.boolean().default(false),
  poThermowells: z.boolean().default(false),
  poHeatExchanger: z.boolean().default(false),
  poMiscellaneous: z.boolean().default(false),
  poWaterJetSteamJet: z.boolean().default(false),
  
  // Additional Information
  existingGraphiteSuppliers: z.string().optional(),
  problemsFaced: z.string().optional(),
  
  isNew: z.boolean(),
});
