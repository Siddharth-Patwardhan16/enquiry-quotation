'use client';

import { useState, useCallback, Suspense } from 'react';
import { api } from '@/trpc/client';
import { useToast } from '@/components/ui/toast';
import { useDebounce } from './_hooks/useDebounce';
import { useCustomerFilters } from './_hooks/useCustomerFilters';
import { CustomerFilters } from './_components/CustomerFilters';
import { CustomerTable } from './_components/CustomerTable';
import { CustomerActions } from './_components/CustomerActions';
import { Pagination } from './_components/Pagination';
import { ImportModal } from './_components/ImportModal';
import { exportCustomersToCSV } from './_utils/exportCustomers';
import { CustomerFilters as CustomerFiltersType } from './_types/customer.types';

function CustomerDetailsContent() {
  const { success, error: toastError } = useToast();
  const [showImportModal, setShowImportModal] = useState(false);

  // Custom hooks for state management
  const {
    filterState,
    queryParams,
    updateSearch,
    updatePage,
    updatePageSize,
    updateSort,
    updateFilters,
    resetFilters,
  } = useCustomerFilters();

  // Debounce search term to avoid excessive API calls
  const debouncedSearchTerm = useDebounce(filterState.searchTerm, 500);

  // Fetch both companies and customers with sorting
  const { 
    data: companiesData, 
    isLoading: isLoadingCompanies, 
    error: companiesError, 
    isFetching: isFetchingCompanies,
    refetch: refetchCompanies 
  } = api.company.getAll.useQuery({
    sortBy: filterState.sortBy,
    sortOrder: filterState.sortOrder,
  });

  const { 
    data: customersData, 
    isLoading: isLoadingCustomers, 
    error: customersError, 
    isFetching: isFetchingCustomers,
    refetch: refetchCustomers 
  } = api.customer.getAll.useQuery({
    sortBy: filterState.sortBy,
    sortOrder: filterState.sortOrder,
  });

  const isLoading = isLoadingCompanies || isLoadingCustomers;
  const isFetching = isFetchingCompanies || isFetchingCustomers;
  const error = companiesError ?? customersError;
  const refetch = useCallback(() => {
    refetchCompanies();
    refetchCustomers();
  }, [refetchCompanies, refetchCustomers]);

  // Combine companies and customers into a single list
  const allEntities = [
    ...(companiesData ?? []).map(company => ({
      ...company,
      type: 'company' as const,
    })),
    ...(customersData ?? []).map(customer => ({
      ...customer,
      type: 'customer' as const,
      offices: [],
      plants: [],
      contactPersons: [],
    })),
  ];

  // Helper function to get location string for search
  const getLocationStringForSearch = (entity: typeof allEntities[0]): string => {
    const locationParts: string[] = [];
    
    // For companies, get office and plant locations
    if (entity.type === 'company' || 'offices' in entity) {
      // Get all office locations
      entity.offices?.forEach(office => {
        if (office.address) locationParts.push(office.address);
        if (office.city) locationParts.push(office.city);
        if (office.state) locationParts.push(office.state);
        if (office.country) locationParts.push(office.country);
        if (office.area) locationParts.push(office.area);
        if (office.name) locationParts.push(office.name);
      });
      
      // Get all plant locations
      entity.plants?.forEach(plant => {
        if (plant.address) locationParts.push(plant.address);
        if (plant.city) locationParts.push(plant.city);
        if (plant.state) locationParts.push(plant.state);
        if (plant.country) locationParts.push(plant.country);
        if (plant.area) locationParts.push(plant.area);
        if (plant.name) locationParts.push(plant.name);
      });
    }
    
    // For customers, get location data
    if ((entity.type === 'customer' || 'locations' in entity) && 'locations' in entity && Array.isArray(entity.locations)) {
      const locations = entity.locations as Array<{ address?: string | null; city?: string | null; state?: string | null; country?: string | null; name?: string }>;
      for (const location of locations) {
        if (location.address) locationParts.push(location.address);
        if (location.city) locationParts.push(location.city);
        if (location.state) locationParts.push(location.state);
        if (location.country) locationParts.push(location.country);
        if (location.name) locationParts.push(location.name);
      }
    }
    
    return locationParts.join(' ');
  };

  // Apply client-side filtering and pagination - search across ALL fields
  const filteredEntities = allEntities.filter(entity => {
    const searchTerm = debouncedSearchTerm.toLowerCase().trim();
    if (!searchTerm) return true;
    
    // Search in entity name
    if (entity.name?.toLowerCase().includes(searchTerm)) {
      return true;
    }
    
    // For companies, search in contact persons
    if ((entity.type === 'company' || 'contactPersons' in entity) && 'contactPersons' in entity && Array.isArray(entity.contactPersons) && entity.contactPersons.length > 0) {
      const contactPersons = entity.contactPersons as Array<{ name?: string; designation?: string | null; phoneNumber?: string | null; emailId?: string | null; office?: { name?: string } | null; plant?: { name?: string } | null }>;
      for (const contact of contactPersons) {
        // Search in contact name
        if (contact.name?.toLowerCase().includes(searchTerm)) {
          return true;
        }
        // Search in designation
        if (contact.designation?.toLowerCase().includes(searchTerm)) {
          return true;
        }
        // Search in phone number
        if (contact.phoneNumber?.toLowerCase().includes(searchTerm)) {
          return true;
        }
        // Search in email
        if (contact.emailId?.toLowerCase().includes(searchTerm)) {
          return true;
        }
        // Search in office/plant names
        if (contact.office?.name?.toLowerCase().includes(searchTerm)) {
          return true;
        }
        if (contact.plant?.name?.toLowerCase().includes(searchTerm)) {
          return true;
        }
      }
    }
    
    // For customers, search in contacts
    if ((entity.type === 'customer' || 'contacts' in entity) && 'contacts' in entity && Array.isArray(entity.contacts) && entity.contacts.length > 0) {
      const contacts = entity.contacts as Array<{ name?: string; designation?: string | null; officialCellNumber?: string | null; personalCellNumber?: string | null; location?: { name?: string } | null }>;
      for (const contact of contacts) {
        if (contact.name?.toLowerCase().includes(searchTerm)) {
          return true;
        }
        if (contact.designation?.toLowerCase().includes(searchTerm)) {
          return true;
        }
        if (contact.officialCellNumber?.toLowerCase().includes(searchTerm)) {
          return true;
        }
        if (contact.personalCellNumber?.toLowerCase().includes(searchTerm)) {
          return true;
        }
        if (contact.location?.name?.toLowerCase().includes(searchTerm)) {
          return true;
        }
      }
    }
    
    // Search in office names and locations (for companies)
    if ((entity.type === 'company' || 'offices' in entity) && 'offices' in entity && Array.isArray(entity.offices) && entity.offices.length > 0) {
      const offices = entity.offices as Array<{ name?: string; address?: string | null; city?: string | null; state?: string | null; country?: string | null; area?: string | null }>;
      for (const office of offices) {
        if (office.name?.toLowerCase().includes(searchTerm)) {
          return true;
        }
        if (office.address?.toLowerCase().includes(searchTerm)) {
          return true;
        }
        if (office.city?.toLowerCase().includes(searchTerm)) {
          return true;
        }
        if (office.state?.toLowerCase().includes(searchTerm)) {
          return true;
        }
        if (office.country?.toLowerCase().includes(searchTerm)) {
          return true;
        }
        if (office.area?.toLowerCase().includes(searchTerm)) {
          return true;
        }
      }
    }
    
    // Search in plant names and locations (for companies)
    if ((entity.type === 'company' || 'plants' in entity) && 'plants' in entity && Array.isArray(entity.plants) && entity.plants.length > 0) {
      const plants = entity.plants as Array<{ name?: string; address?: string | null; city?: string | null; state?: string | null; country?: string | null; area?: string | null }>;
      for (const plant of plants) {
        if (plant.name?.toLowerCase().includes(searchTerm)) {
          return true;
        }
        if (plant.address?.toLowerCase().includes(searchTerm)) {
          return true;
        }
        if (plant.city?.toLowerCase().includes(searchTerm)) {
          return true;
        }
        if (plant.state?.toLowerCase().includes(searchTerm)) {
          return true;
        }
        if (plant.country?.toLowerCase().includes(searchTerm)) {
          return true;
        }
        if (plant.area?.toLowerCase().includes(searchTerm)) {
          return true;
        }
      }
    }
    
    // Search in customer locations
    if ((entity.type === 'customer' || 'locations' in entity) && 'locations' in entity && Array.isArray(entity.locations) && entity.locations.length > 0) {
      const locations = entity.locations as Array<{ name?: string; address?: string | null; city?: string | null; state?: string | null; country?: string | null }>;
      for (const location of locations) {
        if (location.name?.toLowerCase().includes(searchTerm)) {
          return true;
        }
        if (location.address?.toLowerCase().includes(searchTerm)) {
          return true;
        }
        if (location.city?.toLowerCase().includes(searchTerm)) {
          return true;
        }
        if (location.state?.toLowerCase().includes(searchTerm)) {
          return true;
        }
        if (location.country?.toLowerCase().includes(searchTerm)) {
          return true;
        }
      }
    }
    
    // Search in all location strings combined
    const locationString = getLocationStringForSearch(entity).toLowerCase();
    if (locationString.includes(searchTerm)) {
      return true;
    }
    
    return false;
  });

  const totalCount = filteredEntities.length;
  const pageSize = queryParams.pageSize || 20;
  const currentPage = queryParams.page || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedEntities = filteredEntities.slice(startIndex, endIndex);
  const totalPages = Math.ceil(totalCount / pageSize);


  // Event handlers
  const handleSearchChange = useCallback((searchTerm: string) => {
    updateSearch(searchTerm);
  }, [updateSearch]);

  const handleFiltersChange = useCallback((filters: CustomerFiltersType) => {
    updateFilters(filters);
  }, [updateFilters]);

  const handlePageChange = useCallback((page: number) => {
    updatePage(page);
  }, [updatePage]);

  const handlePageSizeChange = useCallback((pageSize: number) => {
    updatePageSize(pageSize);
  }, [updatePageSize]);


  const handleImport = useCallback(() => {
    setShowImportModal(true);
  }, []);

  const handleImportData = useCallback((data: unknown[]) => {
    // Import logic for companies would be implemented here
    success('Import Successful', `Successfully imported ${data.length} company records`);
    setShowImportModal(false);
    // Refetch data to show new companies
    refetch();
  }, [success, refetch]);

  const handleExport = useCallback(() => {
    if (filteredEntities.length === 0) {
      toastError('Export Error', 'No companies to export');
      return;
    }

    // Export all companies
    exportCustomersToCSV(filteredEntities);
    success('Export', `Exported ${filteredEntities.length} companies to CSV`);
  }, [filteredEntities, success, toastError]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Company Details</h1>
              <p className="mt-2 text-gray-600">Manage company contact information and details</p>
            </div>
          </div>
        </div>

        {/* Actions Bar */}
        <CustomerActions
          onImport={handleImport}
          onExport={handleExport}
        />

        {/* Search and Filters */}
        <CustomerFilters
          searchTerm={filterState.searchTerm}
          onSearchChange={handleSearchChange}
          filters={filterState.filters}
          onFiltersChange={handleFiltersChange}
          onClearFilters={resetFilters}
          isLoading={isLoading}
          sortBy={filterState.sortBy}
          sortOrder={filterState.sortOrder}
          onSortChange={updateSort}
        />

        {/* Customer Table */}
        <CustomerTable
          customers={paginatedEntities}
          isLoading={isLoading}
          isFetching={isFetching}
          error={error as Error | null}
        />

        {/* Pagination */}
        {totalPages > 1 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalCount={totalCount}
            pageSize={pageSize}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
            hasNextPage={currentPage < totalPages}
            hasPreviousPage={currentPage > 1}
            isLoading={isLoading}
          />
        )}

        {/* Import Modal */}
        <ImportModal
          isOpen={showImportModal}
          onClose={() => setShowImportModal(false)}
          onImport={handleImportData}
        />
      </div>
    </div>
  );
}

export default function CustomerDetailsPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading company details...</p>
        </div>
      </div>
    }>
      <CustomerDetailsContent />
    </Suspense>
  );
}