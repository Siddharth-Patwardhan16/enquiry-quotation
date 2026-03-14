import { z } from 'zod';

function normalizeOptionalStringInput(value: unknown): unknown {
  if (value === null || value === undefined) {
    return undefined;
  }

  if (typeof value !== 'string') {
    return value;
  }

  const trimmedValue = value.trim();
  return trimmedValue === '' ? undefined : trimmedValue;
}

function normalizeOptionalUuidInput(
  value: unknown,
  options: { allowNull?: boolean } = {},
): unknown {
  const { allowNull = false } = options;

  if (allowNull && value === null) {
    return null;
  }

  const normalizedValue = normalizeOptionalStringInput(value);
  if (typeof normalizedValue !== 'string') {
    return normalizedValue;
  }

  const lowerCasedValue = normalizedValue.toLowerCase();
  if (lowerCasedValue === 'null' || lowerCasedValue === 'undefined') {
    return undefined;
  }

  return normalizedValue;
}

export function normalizeOptionalUuidValue(
  value: unknown,
  options: { allowNull?: boolean } = {},
): string | null | undefined {
  const normalizedValue = normalizeOptionalUuidInput(value, options);

  if (normalizedValue === null) {
    return null;
  }

  return typeof normalizedValue === 'string' ? normalizedValue : undefined;
}

const optionalStringField = () =>
  z.preprocess(normalizeOptionalStringInput, z.string().optional());

const optionalEnumField = <const TValues extends readonly [string, ...string[]]>(
  values: TValues,
) => z.preprocess(normalizeOptionalStringInput, z.enum(values).optional());

const optionalUuidField = (message: string) =>
  z.preprocess(
    (value) => normalizeOptionalUuidInput(value),
    z.string().uuid(message).optional(),
  );

const optionalNullableUuidField = (message: string) =>
  z.preprocess(
    (value) => normalizeOptionalUuidInput(value, { allowNull: true }),
    z.string().uuid(message).nullable().optional(),
  );

export const CreateEnquirySchema = z.object({
  customerId: optionalUuidField('Please select a valid customer.'),
  locationId: optionalUuidField('Please select a valid location.'),
  subject: optionalStringField(),
  description: optionalStringField(),
  requirements: optionalStringField(),
  timeline: optionalStringField(),
  enquiryDate: optionalStringField(),
  priority: optionalEnumField(['Low', 'Medium', 'High', 'Urgent']),
  source: optionalEnumField([
    'Website',
    'Email',
    'Phone',
    'Referral',
    'Trade Show',
    'Social Media',
    'Visit',
  ]),
  notes: optionalStringField(),
  quotationNumber: optionalStringField(),
  quotationDate: optionalStringField(),
  region: optionalStringField(),
  oaNumber: optionalStringField(),
  oaDate: optionalStringField(),
  blockModel: optionalStringField(),
  numberOfBlocks: optionalStringField(),
  designRequired: optionalEnumField(['Yes', 'No']),
  attendedById: optionalNullableUuidField(
    'Please select a valid employee for Attended By.',
  ),
  customerType: optionalEnumField(['NEW', 'OLD']),
  status: optionalEnumField(['LIVE', 'DEAD', 'RCD', 'LOST', 'BUDGETARY']),
  entityType: optionalEnumField(['customer', 'company']),
});

export const UpdateEnquirySchema = z.object({
  id: z.number(),
  status: z.enum(['LIVE', 'DEAD', 'RCD', 'LOST', 'WON', 'BUDGETARY']),
  purchaseOrderNumber: z.string().optional(),
  poValue: z.number().optional(),
  poDate: z.string().optional(),
});

export const UpdateEnquiryFullSchema = z.object({
  id: z.number(),
  subject: optionalStringField(),
  description: optionalStringField(),
  requirements: optionalStringField(),
  timeline: optionalStringField(),
  enquiryDate: optionalStringField(),
  priority: optionalEnumField(['Low', 'Medium', 'High', 'Urgent']),
  source: optionalEnumField([
    'Website',
    'Email',
    'Phone',
    'Referral',
    'Trade Show',
    'Social Media',
    'Visit',
  ]),
  notes: optionalStringField(),
  quotationNumber: optionalStringField(),
  quotationDate: optionalStringField(),
  region: optionalStringField(),
  oaNumber: optionalStringField(),
  oaDate: optionalStringField(),
  dateOfReceipt: optionalStringField(),
  blockModel: optionalStringField(),
  numberOfBlocks: optionalStringField(),
  designRequired: optionalEnumField(['Yes', 'No']),
  attendedById: optionalNullableUuidField(
    'Please select a valid employee for Attended By.',
  ),
  customerType: optionalEnumField(['NEW', 'OLD']),
  status: optionalEnumField(['LIVE', 'DEAD', 'RCD', 'LOST', 'BUDGETARY']),
});
