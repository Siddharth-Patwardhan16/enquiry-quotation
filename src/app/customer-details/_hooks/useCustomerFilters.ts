import { useState, useCallback, useMemo } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { FilterState, CustomerFilters, SortField, SortOrder } from '../_types/customer.types';

const DEFAULT_FILTER_STATE: FilterState = {
  searchTerm: '',
  page: 1,
  pageSize: 20,
  sortBy: 'name',
  sortOrder: 'asc',
  filters: {
    searchTerm: '',
    designation: undefined,
    hasPhone: undefined,
    hasEmail: undefined,
  },
};

/**
 * Custom hook for managing customer filter state with URL synchronization
 */
export function useCustomerFilters() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // Initialize state from URL params
  const [filterState, setFilterState] = useState<FilterState>(() => {
    const searchTerm = searchParams.get('search') ?? DEFAULT_FILTER_STATE.searchTerm;
    const page = parseInt(searchParams.get('page') ?? '1', 10) || DEFAULT_FILTER_STATE.page;
    const pageSize = parseInt(searchParams.get('pageSize') ?? '20', 10) || DEFAULT_FILTER_STATE.pageSize;
    const sortBy = (searchParams.get('sortBy') as SortField) ?? DEFAULT_FILTER_STATE.sortBy;
    const sortOrder = (searchParams.get('sortOrder') as SortOrder) ?? DEFAULT_FILTER_STATE.sortOrder;
    const designation = searchParams.get('designation') ?? undefined;
    const hasPhone = searchParams.get('hasPhone') === 'true' ? true : searchParams.get('hasPhone') === 'false' ? false : undefined;
    const hasEmail = searchParams.get('hasEmail') === 'true' ? true : searchParams.get('hasEmail') === 'false' ? false : undefined;

    return {
      searchTerm,
      page,
      pageSize,
      sortBy,
      sortOrder,
      filters: {
        searchTerm,
        designation,
        hasPhone,
        hasEmail,
      },
    };
  });

  // Update URL when filter state changes
  const updateURL = useCallback((newState: Partial<FilterState>) => {
    const current = new URLSearchParams(searchParams);
    
    // Update search params
    if (newState.searchTerm !== undefined) {
      if (newState.searchTerm) {
        current.set('search', newState.searchTerm);
      } else {
        current.delete('search');
      }
    }
    
    if (newState.page !== undefined) {
      if (newState.page > 1) {
        current.set('page', newState.page.toString());
      } else {
        current.delete('page');
      }
    }
    
    if (newState.pageSize !== undefined && newState.pageSize !== 20) {
      current.set('pageSize', newState.pageSize.toString());
    } else {
      current.delete('pageSize');
    }
    
    if (newState.sortBy !== undefined && newState.sortBy !== 'name') {
      current.set('sortBy', newState.sortBy);
    } else {
      current.delete('sortBy');
    }
    
    if (newState.sortOrder !== undefined && newState.sortOrder !== 'asc') {
      current.set('sortOrder', newState.sortOrder);
    } else {
      current.delete('sortOrder');
    }
    
    if (newState.filters) {
      if (newState.filters.designation) {
        current.set('designation', newState.filters.designation);
      } else {
        current.delete('designation');
      }
      
      if (newState.filters.hasPhone !== undefined) {
        current.set('hasPhone', newState.filters.hasPhone.toString());
      } else {
        current.delete('hasPhone');
      }
      
      if (newState.filters.hasEmail !== undefined) {
        current.set('hasEmail', newState.filters.hasEmail.toString());
      } else {
        current.delete('hasEmail');
      }
    }
    
    const newURL = `${pathname}?${current.toString()}`;
    router.push(newURL, { scroll: false });
  }, [searchParams, router, pathname]);

  // Update search term
  const updateSearch = useCallback((searchTerm: string) => {
    const newState = { 
      ...filterState, 
      searchTerm,
      page: 1, // Reset to first page when searching
      filters: {
        ...filterState.filters,
        searchTerm,
      },
    };
    setFilterState(newState);
    updateURL(newState);
  }, [filterState, updateURL]);

  // Update page
  const updatePage = useCallback((page: number) => {
    const newState = { ...filterState, page };
    setFilterState(newState);
    updateURL(newState);
  }, [filterState, updateURL]);

  // Update page size
  const updatePageSize = useCallback((pageSize: number) => {
    const newState = { ...filterState, pageSize, page: 1 }; // Reset to first page when changing page size
    setFilterState(newState);
    updateURL(newState);
  }, [filterState, updateURL]);

  // Update sorting
  const updateSort = useCallback((sortBy: SortField, sortOrder: SortOrder) => {
    const newState = { ...filterState, sortBy, sortOrder, page: 1 }; // Reset to first page when sorting
    setFilterState(newState);
    updateURL(newState);
  }, [filterState, updateURL]);

  // Update filters
  const updateFilters = useCallback((filters: Partial<CustomerFilters>) => {
    const newFilters = { ...filterState.filters, ...filters };
    const newState = { 
      ...filterState, 
      filters: newFilters,
      page: 1, // Reset to first page when filtering
    };
    setFilterState(newState);
    updateURL(newState);
  }, [filterState, updateURL]);

  // Reset all filters
  const resetFilters = useCallback(() => {
    setFilterState(DEFAULT_FILTER_STATE);
    updateURL(DEFAULT_FILTER_STATE);
  }, [updateURL]);

  // Get query parameters for tRPC
  const queryParams = useMemo(() => ({
    searchTerm: filterState.searchTerm,
    page: filterState.page,
    pageSize: filterState.pageSize,
    sortBy: filterState.sortBy,
    sortOrder: filterState.sortOrder,
    filters: {
      designation: filterState.filters.designation,
      hasPhone: filterState.filters.hasPhone,
      hasEmail: filterState.filters.hasEmail,
    },
  }), [filterState]);

  // Check if any filters are active
  const hasActiveFilters = useMemo(() => {
    return (
      filterState.searchTerm !== '' ||
      filterState.filters.designation !== undefined ||
      filterState.filters.hasPhone !== undefined ||
      filterState.filters.hasEmail !== undefined ||
      filterState.sortBy !== 'name' ||
      filterState.sortOrder !== 'asc'
    );
  }, [filterState]);

  return {
    filterState,
    queryParams,
    updateSearch,
    updatePage,
    updatePageSize,
    updateSort,
    updateFilters,
    resetFilters,
    hasActiveFilters,
  };
}
