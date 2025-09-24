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
    updateFilters,
    resetFilters,
  } = useCustomerFilters();

  // Debounce search term to avoid excessive API calls
  const debouncedSearchTerm = useDebounce(filterState.searchTerm, 500);

  // Fetch companies only (new company-based structure)
  const { 
    data: companiesData, 
    isLoading, 
    error, 
    isFetching,
    refetch 
  } = api.company.getAll.useQuery();

  // Convert companies to display format
  /* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return */
  const combinedEntities = (companiesData ?? []).map((company: any) => ({
    id: company.id,
    name: company.name,
    type: 'company' as const,
    designation: null,
    phoneNumber: null,
    emailId: null,
    createdAt: company.createdAt,
    updatedAt: company.updatedAt,
    locations: company.offices?.map((office: any) => ({
      id: office.id,
      name: office.name,
      type: 'OFFICE' as const,
      address: office.address,
      city: office.city,
      state: office.state,
      country: office.country,
      receptionNumber: office.receptionNumber,
    })) || [],
    contactPersons: [
      ...(company.offices?.flatMap((office: any) => 
        office.contactPersons?.map((contact: any) => ({
          ...contact,
          location: { id: office.id, name: office.name, type: 'OFFICE' as const }
        })) || []
      ) || []),
      ...(company.plants?.flatMap((plant: any) => 
        plant.contactPersons?.map((contact: any) => ({
          ...contact,
          location: { id: plant.id, name: plant.name, type: 'PLANT' as const }
        })) || []
      ) || [])
    ],
  }));
  /* eslint-enable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return */

  // Apply client-side filtering and pagination since we're only using companies
  const filteredEntities = combinedEntities.filter((entity) => {
    const searchTerm = debouncedSearchTerm.toLowerCase();
    if (!searchTerm) return true;
    
    return entity.name.toLowerCase().includes(searchTerm);
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
    // TODO: Implement actual import logic for companies
    success('Import Successful', `Successfully imported ${data.length} company records`);
    setShowImportModal(false);
    // Refetch data to show new companies
    refetch();
  }, [success, refetch]);

  const handleExport = useCallback(() => {
    if (combinedEntities.length === 0) {
      toastError('Export Error', 'No companies to export');
      return;
    }

    // Export all companies
    exportCustomersToCSV(combinedEntities);
    success('Export', `Exported ${combinedEntities.length} companies to CSV`);
  }, [combinedEntities, success, toastError]);

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