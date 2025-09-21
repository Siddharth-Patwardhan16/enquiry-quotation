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
  customerId: string;
  contactId: string | null;
  employeeId: string | null;
  
  // Related data from API includes
  customer: {
    id: string;
    name: string;
    isNew: boolean;
    createdAt: Date;
    updatedAt: Date;
  };
  contact: {
    id: string;
    name: string;
    designation: string | null;
    officialCellNumber: string | null;
    personalCellNumber: string | null;
  } | null;
  employee: {
    id: string;
    name: string;
    role: string;
  } | null;
  enquiry: {
    id: number;
    quotationNumber: string | null;
    subject: string;
  } | null;
};

// Form data type for creating/editing communications
export type CommunicationFormData = {
  date: string;
  customerId: string;
  subject: string;
  enquiryRelated?: string;
  generalDescription?: string;
  briefDescription: string;
  communicationType: 'TELEPHONIC' | 'VIRTUAL_MEETING' | 'EMAIL' | 'PLANT_VISIT' | 'OFFICE_VISIT';
  nextCommunicationDate?: string;
  proposedNextAction?: string;
  contactId?: string;
};

// API response type (what the server actually returns)
export type CommunicationApiResponse = Communication;

// Type for display purposes (what components need)
export type CommunicationDisplay = Communication;
