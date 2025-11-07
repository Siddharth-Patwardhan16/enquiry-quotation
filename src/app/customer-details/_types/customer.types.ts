export interface Customer {
  id: string;
  name: string;
  designation?: string | null;
  phoneNumber?: string | null;
  emailId?: string | null;
  createdAt: Date;
  updatedAt: Date;
  isNew: boolean;
  createdById?: string | null;
  poRuptureDiscs: boolean;
  poThermowells: boolean;
  poHeatExchanger: boolean;
  poMiscellaneous: boolean;
  poWaterJetSteamJet: boolean;
  existingGraphiteSuppliers?: string | null;
  problemsFaced?: string | null;
  createdBy?: {
    id: string;
    name: string;
    email: string;
    role: string;
  } | null;
  locations: Location[];
  contacts: Contact[];
}

// Company type from the API
export interface Company {
  id: string;
  name: string;
  type: 'customer' | 'company';
  isNew: boolean;
  website?: string | null;
  industry?: string | null;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: {
    id: string;
    name: string;
    email: string;
  } | null;
  poRuptureDiscs: boolean;
  poThermowells: boolean;
  poHeatExchanger: boolean;
  poMiscellaneous: boolean;
  poWaterJetSteamJet: boolean;
  existingGraphiteSuppliers?: string | null;
  problemsFaced?: string | null;
  offices: Array<{
    id: string;
    name: string;
    address: string | null;
    area?: string | null;
    city: string | null;
    state: string | null;
    country: string | null;
    pincode?: string | null;
    isHeadOffice: boolean;
    contactPersons: Array<{
      id: string;
      name: string;
      designation: string | null;
      phoneNumber: string | null;
      emailId: string | null;
      isPrimary: boolean;
    }>;
  }>;
  plants: Array<{
    id: string;
    name: string;
    address: string | null;
    area?: string | null;
    city: string | null;
    state: string | null;
    country: string | null;
    pincode?: string | null;
    plantType?: string | null;
    contactPersons: Array<{
      id: string;
      name: string;
      designation: string | null;
      phoneNumber: string | null;
      emailId: string | null;
      isPrimary: boolean;
    }>;
  }>;
  contactPersons: Array<{
    id: string;
    name: string;
    designation: string | null;
    phoneNumber: string | null;
    emailId: string | null;
    isPrimary: boolean;
    location?: {
      id: string;
      name: string;
      type: 'OFFICE' | 'PLANT';
    };
    office?: {
      id: string;
      name: string;
    } | null;
    plant?: {
      id: string;
      name: string;
    } | null;
  }>;
}

export interface ContactPerson {
  id: string;
  name: string;
  designation?: string | null;
  phoneNumber?: string | null;
  emailId?: string | null;
  isPrimary: boolean;
  createdAt: Date;
  updatedAt: Date;
  location?: {
    id: string;
    name: string;
    type: 'OFFICE' | 'PLANT';
  };
}

export interface Location {
  id: string;
  name: string;
  type: 'OFFICE' | 'PLANT';
  address?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  receptionNumber?: string | null;
  customerId: string;
}

export interface Contact {
  id: string;
  name: string;
  designation?: string | null;
  officialCellNumber?: string | null;
  personalCellNumber?: string | null;
  createdAt: Date;
  updatedAt: Date;
  locationId: string;
  customerId: string;
  location: Location;
}

export interface CustomerFilters {
  searchTerm: string;
  designation?: string;
  hasPhone?: boolean;
  hasEmail?: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export type SortField = 'name' | 'designation' | 'emailId' | 'createdAt';
export type SortOrder = 'asc' | 'desc';

export interface FilterState {
  searchTerm: string;
  page: number;
  pageSize: number;
  sortBy: SortField;
  sortOrder: SortOrder;
  filters: CustomerFilters;
}

// Type for the raw API response
export type CompanyApiResponse = {
  id: string;
  name: string;
  type?: 'customer' | 'company';
  website?: string | null;
  industry?: string | null;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: {
    id: string;
    name: string;
    email: string;
  } | null;
  poRuptureDiscs: boolean;
  poThermowells: boolean;
  poHeatExchanger: boolean;
  poMiscellaneous: boolean;
  poWaterJetSteamJet: boolean;
  existingGraphiteSuppliers?: string | null;
  problemsFaced?: string | null;
  offices: Array<{
    id: string;
    name: string;
    address: string | null;
    area?: string | null;
    city: string | null;
    state: string | null;
    country: string | null;
    pincode?: string | null;
    isHeadOffice: boolean;
    contactPersons: Array<{
      id: string;
      name: string;
      designation: string | null;
      phoneNumber: string | null;
      emailId: string | null;
      isPrimary: boolean;
    }>;
  }>;
  plants: Array<{
    id: string;
    name: string;
    address: string | null;
    area?: string | null;
    city: string | null;
    state: string | null;
    country: string | null;
    pincode?: string | null;
    plantType?: string | null;
    contactPersons: Array<{
      id: string;
      name: string;
      designation: string | null;
      phoneNumber: string | null;
      emailId: string | null;
      isPrimary: boolean;
    }>;
  }>;
  contactPersons: Array<{
    id: string;
    name: string;
    designation: string | null;
    phoneNumber: string | null;
    emailId: string | null;
    isPrimary: boolean;
    location?: {
      id: string;
      name: string;
      type: 'OFFICE' | 'PLANT';
    };
    office?: {
      id: string;
      name: string;
    } | null;
    plant?: {
      id: string;
      name: string;
    } | null;
  }>;
};

export interface CustomerTableProps {
  customers: EntityApiResponse[];
  isLoading: boolean;
  isFetching: boolean;
  error: Error | null;
}

export interface CustomerFiltersProps {
  searchTerm: string;
  onSearchChange: (_value: string) => void;
  filters: CustomerFilters;
  onFiltersChange: (_filters: CustomerFilters) => void;
  onClearFilters: () => void;
  isLoading: boolean;
}

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  pageSize: number;
  onPageChange: (_page: number) => void;
  onPageSizeChange: (_pageSize: number) => void;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  isLoading: boolean;
}

// Union type for both Company and Customer entities
export type EntityApiResponse = CompanyApiResponse | (Customer & { type?: 'customer' });

export interface CustomerRowProps {
  customer: EntityApiResponse;
}

export interface CustomerActionsProps {
  onImport: () => void;
  onExport: () => void;
}
