import { useState, useCallback, useMemo } from 'react';
import { CombinedEntity } from '../_types/customer.types';

/**
 * Custom hook for managing customer selection state
 */
export function useCustomerSelection(customers: CombinedEntity[]) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const toggleSelection = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelectedIds(new Set(customers.map(c => c.id)));
  }, [customers]);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const selectMultiple = useCallback((ids: string[]) => {
    setSelectedIds(new Set(ids));
  }, []);

  const isSelected = useCallback((id: string) => {
    return selectedIds.has(id);
  }, [selectedIds]);

  const selectedCustomers = useMemo(() => {
    return customers.filter(customer => selectedIds.has(customer.id));
  }, [customers, selectedIds]);

  const isAllSelected = useMemo(() => {
    return customers.length > 0 && selectedIds.size === customers.length;
  }, [customers.length, selectedIds.size]);

  const isPartiallySelected = useMemo(() => {
    return selectedIds.size > 0 && selectedIds.size < customers.length;
  }, [selectedIds.size, customers.length]);

  return {
    selectedIds: Array.from(selectedIds),
    selectedCustomers,
    selectionCount: selectedIds.size,
    isSelected,
    toggleSelection,
    selectAll,
    clearSelection,
    selectMultiple,
    isAllSelected,
    isPartiallySelected,
  };
}

