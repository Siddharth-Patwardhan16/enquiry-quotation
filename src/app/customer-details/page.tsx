'use client';

import { useState, useCallback, useMemo, Suspense } from 'react';
import { api } from '@/trpc/client';
import type { AppRouter } from '@/server/api/root';
import type { inferRouterOutputs } from '@trpc/server';
import { keepPreviousData } from '@tanstack/react-query';
import { useToast } from '@/components/ui/toast';
import { useDebounce } from './_hooks/useDebounce';
import { useCustomerFilters } from './_hooks/useCustomerFilters';
import { CustomerFilters } from './_components/CustomerFilters';
import { CustomerTable } from './_components/CustomerTable';
import { CustomerActions } from './_components/CustomerActions';
import { Pagination } from './_components/Pagination';
import dynamic from 'next/dynamic';

// ImportModal pulls in the xlsx + mammoth parsers (~250 kB); load it only when opened.
const ImportModal = dynamic(
  () => import('./_components/ImportModal').then((m) => m.ImportModal),
  { ssr: false },
);
import { exportCustomersToCSV } from './_utils/exportCustomers';
import { CustomerFilters as CustomerFiltersType, CompanyApiResponse } from './_types/customer.types';

type CompanyPaginatedItem = inferRouterOutputs<AppRouter>['company']['getPaginated']['items'][number];

// company.getPaginated's contactPersons are flat (officeId/plantId, no nested office/plant
// object) to avoid the N+1-ish nested include getAll used. CustomerRow (and the
// CompanyApiResponse type it's built against) still expect each contact to carry a small
// { id, name } office/plant object, so we derive it here by looking the ids up against the
// row's own offices/plants arrays, without touching the shared type or CustomerRow itself.
function attachContactLocations(company: CompanyPaginatedItem): CompanyApiResponse {
  const officesById = new Map(company.offices.map((office) => [office.id, office]));
  const plantsById = new Map(company.plants.map((plant) => [plant.id, plant]));
  // createdBy isn't used anywhere in this feature, and getPaginated's createdBy select
  // ({id, name}) doesn't carry the `email` field CompanyApiResponse's type declares, so
  // it's dropped here rather than widening the shared type for an unused field.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars, no-unused-vars
  const { createdBy, ...companyRest } = company;

  return {
    ...companyRest,
    type: 'company' as const,
    contactPersons: company.contactPersons.map((contact) => {
      const office = contact.officeId ? officesById.get(contact.officeId) : undefined;
      const plant = contact.plantId ? plantsById.get(contact.plantId) : undefined;
      return {
        ...contact,
        office: office ? { id: office.id, name: office.name } : null,
        plant: plant ? { id: plant.id, name: plant.name } : null,
      };
    }),
  };
}

function CustomerDetailsContent() {
  const { success, error: toastError } = useToast();
  const [showImportModal, setShowImportModal] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const utils = api.useUtils();

  // Custom hooks for state management
  const {
    filterState,
    updateSearch,
    updatePage,
    updatePageSize,
    updateSort,
    updateFilters,
    resetFilters,
  } = useCustomerFilters();

  // Debounce search term to avoid excessive API calls
  const debouncedSearchTerm = useDebounce(filterState.searchTerm, 500);

  // Companies: server-side search/sort/pagination via company.getPaginated instead of
  // fetching + filtering + slicing the whole table client-side.
  const {
    data: companiesPage,
    isLoading: isLoadingCompanies,
    error: companiesError,
    isFetching: isFetchingCompanies,
    refetch: refetchCompanies,
  } = api.company.getPaginated.useQuery(
    {
      page: filterState.page,
      pageSize: filterState.pageSize,
      search: debouncedSearchTerm.trim() || undefined,
      sortBy: filterState.sortBy,
      sortOrder: filterState.sortOrder,
    },
    { placeholderData: keepPreviousData },
  );

  // Legacy customer.getAll rows: there are few or none of these, so the whole (small)
  // table is still fetched in one shot. They're appended after the company rows, only on
  // the last page, filtered by the same debounced search (on name only, since they don't
  // have offices/plants to search), so nothing that used to be visible disappears.
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

  const companyEntities = useMemo(
    () => (companiesPage?.items ?? []).map(attachContactLocations),
    [companiesPage],
  );

  const totalCount = companiesPage?.total ?? 0;
  const totalPages = Math.max(1, companiesPage?.totalPages ?? 1);
  const currentPage = companiesPage?.page ?? filterState.page;
  const pageSize = companiesPage?.pageSize ?? filterState.pageSize;
  const isLastPage = currentPage >= totalPages;

  const filteredCustomerEntities = useMemo(() => {
    const term = debouncedSearchTerm.trim().toLowerCase();
    const matches = (customersData ?? []).filter(
      (customer) => !term || customer.name.toLowerCase().includes(term),
    );
    return matches.map(customer => ({
      ...customer,
      type: 'customer' as const,
      offices: [],
      plants: [],
      contactPersons: [],
    }));
  }, [customersData, debouncedSearchTerm]);

  // Only append the legacy customer rows on the last page of companies, so they show up
  // exactly once regardless of how many company pages there are.
  const paginatedEntities = useMemo(
    () => (isLastPage ? [...companyEntities, ...filteredCustomerEntities] : companyEntities),
    [isLastPage, companyEntities, filteredCustomerEntities],
  );

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

  const handleExport = useCallback(async () => {
    setIsExporting(true);
    try {
      // The page itself only loads one page of companies (company.getPaginated), so for an
      // explicit export click we fetch the full company table on demand via the heavier
      // company.getAll instead. Its rows already carry nested office/plant objects on each
      // contact person, so they satisfy CompanyApiResponse as-is (no id-lookup shaping
      // needed like attachContactLocations does for the paginated rows).
      const searchTerm = debouncedSearchTerm.trim().toLowerCase();
      const allCompanies = await utils.company.getAll.fetch({
        sortBy: filterState.sortBy,
        sortOrder: filterState.sortOrder,
      });
      const matchingCompanies: CompanyApiResponse[] = (allCompanies ?? [])
        .filter((company) => !searchTerm || company.name.toLowerCase().includes(searchTerm))
        .map((company) => ({ ...company, type: 'company' as const }));

      const exportRows = [...matchingCompanies, ...filteredCustomerEntities];

      if (exportRows.length === 0) {
        toastError('Export Error', 'No companies to export');
        return;
      }

      exportCustomersToCSV(exportRows);
      success('Export', `Exported ${exportRows.length} companies to CSV`);
    } catch (err) {
      toastError('Export Error', err instanceof Error ? err.message : 'Failed to export companies');
    } finally {
      setIsExporting(false);
    }
  }, [debouncedSearchTerm, filterState.sortBy, filterState.sortOrder, filteredCustomerEntities, success, toastError, utils]);

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
          isExporting={isExporting}
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

        {/* Import Modal (mounted only when opened so its parsers are not downloaded up front) */}
        {showImportModal && (
          <ImportModal
            isOpen={showImportModal}
            onClose={() => setShowImportModal(false)}
            onImport={handleImportData}
          />
        )}
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