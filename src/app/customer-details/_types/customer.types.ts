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

// New combined entity type for displaying both customers and companies
export interface CombinedEntity {
  id: string;
  name: string;
  type: 'customer' | 'company';
  designation?: string | null;
  phoneNumber?: string | null;
  emailId?: string | null;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: {
    id: string;
    name: string;
    email: string;
    role: string;
  } | null;
  locations: Location[];
  contactPersons: ContactPerson[];
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

export interface CustomerTableProps {
  customers: CombinedEntity[];
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

export interface CustomerRowProps {
  customer: CombinedEntity;
}

export interface CustomerActionsProps {
  onImport: () => void;
  onExport: () => void;
}
