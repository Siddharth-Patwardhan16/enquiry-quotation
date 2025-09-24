'use client';

import { useState, useCallback, Suspense } from 'react';
import { api } from '@/trpc/client';
import { useToast } from '@/components/ui/toast';
import { useDebounce } from './_hooks/useDebounce';
import { useCustomerFilters } from './_hooks/useCustomerFilters';
import { useCustomerSelection } from './_hooks/useCustomerSelection';
import { CustomerFilters } from './_components/CustomerFilters';
import { CustomerTable } from './_components/CustomerTable';
import { CustomerActions } from './_components/CustomerActions';
import { Pagination } from './_components/Pagination';
import { ImportModal } from './_components/ImportModal';
import { exportCustomersToCSV } from './_utils/exportCustomers';
import { Customer, CustomerFilters as CustomerFiltersType } from './_types/customer.types';

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

  // Fetch customers with server-side filtering
  const { 
    data, 
    isLoading, 
    error, 
    isFetching,
    refetch 
  } = api.customer.getFilteredCustomers.useQuery({
    ...queryParams,
    searchTerm: debouncedSearchTerm,
  });

  // Also fetch companies to show in the same list
  const { data: companiesData } = api.company.getAll.useQuery();

  // Combine customers and companies data
  const customers = data?.customers ?? [];
  const companies = companiesData ?? [];
  
  // Create combined entities for display
  /* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return */
  const combinedEntities = [
    // Convert old customers to combined format
    ...customers.map((customer: any) => ({
      ...customer,
      type: 'customer' as const,
      contactPersons: customer.contacts || [],
    })),
    // Convert new companies to combined format
    ...companies.map((company: any) => ({
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
    }))
  ];
  /* eslint-enable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return */

  const totalCount = combinedEntities.length;
  const totalPages = Math.ceil(totalCount / (queryParams.pageSize || 20));

  // Customer selection management
  const {
    selectedIds,
    selectedCustomers,
    selectionCount,
    toggleSelection,
    selectAll,
    clearSelection,
  } = useCustomerSelection(combinedEntities);

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

  const handleSelectionChange = useCallback((customerId: string) => {
    toggleSelection(customerId);
  }, [toggleSelection]);

  const handleSelectAll = useCallback((selectedIds: string[]) => {
    // This will be handled by the selection hook
    if (selectedIds.length === 0) {
      clearSelection();
    } else {
      // Select all customers
      selectAll();
    }
  }, [clearSelection, selectAll]);


  const handleEdit = useCallback((customer: Customer) => {
    // TODO: Implement edit functionality
    console.log('Edit customer:', customer);
  }, []);

  const handleDelete = useCallback((customer: Customer) => {
    // TODO: Implement delete functionality
    console.log('Delete customer:', customer);
  }, []);

  const handleBulkDelete = useCallback(() => {
    // TODO: Implement bulk delete functionality
    console.log('Bulk delete customers:', selectedCustomers);
  }, [selectedCustomers]);

  const handleBulkEdit = useCallback(() => {
    // TODO: Implement bulk edit functionality
    console.log('Bulk edit customers:', selectedCustomers);
  }, [selectedCustomers]);

  const handleImport = useCallback(() => {
    setShowImportModal(true);
  }, []);

  const handleImportData = useCallback((data: unknown[]) => {
    // TODO: Implement actual import logic
    success('Import Successful', `Successfully imported ${data.length} customer records`);
    setShowImportModal(false);
    // Refetch data to show new customers
    refetch();
  }, [success, refetch]);

  const handleExport = useCallback(() => {
    if (customers.length === 0) {
      toastError('Export Error', 'No customers to export');
      return;
    }

    // For now, export all customers (can be modified to export only selected)
    const customersToExport = selectionCount > 0 ? selectedCustomers : customers;
    
    // Show export options (for now, default to CSV)
    exportCustomersToCSV(customersToExport);
    success('Export', `Exported ${customersToExport.length} customers to CSV`);
  }, [customers, selectedCustomers, selectionCount, success, toastError]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Customer Details</h1>
              <p className="mt-2 text-gray-600">Manage customer contact information and details</p>
            </div>
          </div>
        </div>

        {/* Actions Bar */}
        <CustomerActions
          selectedCount={selectionCount}
          onImport={handleImport}
          onExport={handleExport}
          onBulkDelete={handleBulkDelete}
          onBulkEdit={handleBulkEdit}
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
          customers={combinedEntities}
          isLoading={isLoading}
          isFetching={isFetching}
          error={error as Error | null}
          selectedIds={selectedIds}
          onSelectionChange={handleSelectionChange}
          onSelectAll={handleSelectAll}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />

        {/* Pagination */}
        {totalPages > 1 && (
          <Pagination
            currentPage={filterState.page}
            totalPages={totalPages}
            totalCount={totalCount}
            pageSize={filterState.pageSize}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
            hasNextPage={data?.hasNextPage ?? false}
            hasPreviousPage={data?.hasPreviousPage ?? false}
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
          <p className="mt-4 text-gray-600">Loading customer details...</p>
        </div>
      </div>
    }>
      <CustomerDetailsContent />
    </Suspense>
  );
}
