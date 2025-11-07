// Unified Communication type based on actual API response structure
export type Communication = {
  // Base fields from Prisma schema
  id: string;
  subject: string;
  description: string; // Matches Prisma schema
  type: 'TELEPHONIC' | 'VIRTUAL_MEETING' | 'EMAIL' | 'PLANT_VISIT' | 'OFFICE_VISIT'; // Matches Prisma enum
  enquiryRelated: string | null; // Link to enquiry for tracking
  nextCommunicationDate: Date | null;
  proposedNextAction: string | null;
  createdAt: Date;
  updatedAt: Date;
  companyId: string | null;
  contactPersonId: string | null;
  employeeId: string | null;
  
  // Related data from API includes
  company: {
    id: string;
    name: string;
    createdAt: Date;
    updatedAt: Date;
  } | null;
  contactPerson: {
    id: string;
    name: string;
    designation: string | null;
    phoneNumber: string | null;
    emailId: string | null;
  } | null;
  employee: {
    id: string;
    name: string;
    role: string;
  } | null;
  enquiry: {
    id: number;
    quotationNumber: string | null;
    quotationStatus: string | null;
    quotationTotalValue: number | null;
    subject: string;
    office: {
      id: string;
      name: string;
      contactPersons: {
        id: string;
        name: string;
        designation: string | null;
        phoneNumber: string | null;
        emailId: string | null;
        isPrimary: boolean;
      }[];
    } | null;
    plant: {
      id: string;
      name: string;
      contactPersons: {
        id: string;
        name: string;
        designation: string | null;
        phoneNumber: string | null;
        emailId: string | null;
        isPrimary: boolean;
      }[];
    } | null;
  } | null;
};

// Form data type for creating/editing communications
export type CommunicationFormData = {
  date: string;
  companyId: string;
  subject: string;
  enquiryRelated?: string;
  generalDescription?: string;
  briefDescription: string;
  communicationType: 'TELEPHONIC' | 'VIRTUAL_MEETING' | 'EMAIL' | 'PLANT_VISIT' | 'OFFICE_VISIT';
  nextCommunicationDate?: string;
  proposedNextAction?: string;
  contactPersonId?: string;
};

// API response type (what the server actually returns)
export type CommunicationApiResponse = Communication;

// Type for display purposes (what components need)
export type CommunicationDisplay = Communication;
