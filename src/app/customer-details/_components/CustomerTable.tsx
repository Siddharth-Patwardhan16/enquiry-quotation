'use client';

import { memo } from 'react';
import { Users, Loader2 } from 'lucide-react';
import { CustomerTableProps } from '../_types/customer.types';
import { CustomerRow } from './CustomerRow';

// Skeleton loader component
const CustomerTableSkeleton = memo(function CustomerTableSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="h-16 bg-gray-100 animate-pulse rounded" />
      ))}
    </div>
  );
});

// Error component
const ErrorState = memo(function ErrorState({ 
  error, 
  onRetry 
}: { 
  error: Error | null; 
  onRetry?: () => void; 
}) {
  return (
    <div className="text-center py-12">
      <div className="text-red-600 text-xl mb-4">Error loading customers</div>
      <p className="text-gray-600 mb-4">{error?.message ?? 'An unexpected error occurred'}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Try Again
        </button>
      )}
    </div>
  );
});

// Empty state component
const EmptyState = memo(function EmptyState({ 
  searchTerm 
}: { 
  searchTerm: string; 
}) {
  return (
    <div className="text-center py-12">
      <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">No customers found</h3>
      <p className="text-gray-600">
        {searchTerm ? 'Try adjusting your search terms' : 'No customers have been added yet'}
      </p>
    </div>
  );
});

export const CustomerTable = memo(function CustomerTable({
  customers,
  isLoading,
  isFetching,
  error,
  selectedIds,
  onSelectionChange,
  onSelectAll,
  onEdit,
  onDelete,
}: CustomerTableProps) {
  const selectedSet = new Set(selectedIds);
  const isAllSelected = customers.length > 0 && selectedIds.length === customers.length;
  const isPartiallySelected = selectedIds.length > 0 && selectedIds.length < customers.length;

  const handleSelectAll = () => {
    if (isAllSelected) {
      // Clear selection by calling with empty array
      onSelectAll([]);
    } else {
      // Select all by calling with all customer IDs
      onSelectAll(customers.map(c => c.id));
    }
  };

  const handleSelectionChange = (customerId: string) => {
    onSelectionChange(customerId);
  };

  // Show loading state
  if (isLoading && customers.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="p-6">
          <CustomerTableSkeleton />
        </div>
      </div>
    );
  }

  // Show error state
  if (error && customers.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="p-6">
          <ErrorState error={error} />
        </div>
      </div>
    );
  }

  // Show empty state
  if (customers.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="p-6">
          <EmptyState searchTerm="" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
      {/* Table Header */}
      <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">
            Customers ({customers.length})
          </h3>
          {isFetching && (
            <div className="flex items-center text-sm text-gray-500">
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Updating...
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  ref={(input) => {
                    if (input) input.indeterminate = isPartiallySelected;
                  }}
                  onChange={handleSelectAll}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  aria-label="Select all customers"
                />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Designation
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Phone Number
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {customers.map((customer) => (
              <CustomerRow
                key={customer.id}
                customer={customer}
                isSelected={selectedSet.has(customer.id)}
                onSelectionChange={handleSelectionChange}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
});
