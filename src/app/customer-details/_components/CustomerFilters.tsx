'use client';

import { memo, useState } from 'react';
import { Search, Filter, X } from 'lucide-react';
import { CustomerFiltersProps } from '../_types/customer.types';

export const CustomerFilters = memo(function CustomerFilters({
  searchTerm,
  onSearchChange,
  filters,
  onFiltersChange,
  onClearFilters,
  isLoading,
}: CustomerFiltersProps) {
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSearchChange(e.target.value);
  };

  const handleDesignationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFiltersChange({
      ...filters,
      designation: e.target.value ?? undefined,
    });
  };

  const handleHasPhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFiltersChange({
      ...filters,
      hasPhone: e.target.checked ? true : undefined,
    });
  };

  const handleHasEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFiltersChange({
      ...filters,
      hasEmail: e.target.checked ? true : undefined,
    });
  };

  const handleClearFilters = () => {
    onClearFilters();
    setShowAdvancedFilters(false);
  };

  const hasActiveFilters = 
    searchTerm !== '' ||
    filters.designation !== undefined ||
    filters.hasPhone !== undefined ||
    filters.hasEmail !== undefined;

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
      {/* Search Bar */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by name, designation, phone, or email..."
              value={searchTerm}
              onChange={handleSearchChange}
              disabled={isLoading}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
          </div>
        </div>

        {/* Filter Controls */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className={`inline-flex items-center px-4 py-2 border rounded-md text-sm font-medium transition-colors ${
                  showAdvancedFilters || hasActiveFilters
                    ? 'bg-blue-50 border-blue-300 text-blue-700'
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
                disabled={isLoading}
              >
                <Filter className="w-4 h-4 mr-2" />
                Filters
                {hasActiveFilters && (
                  <span className="ml-2 bg-blue-600 text-white text-xs rounded-full px-2 py-0.5">
                    {[
                      searchTerm && 'search',
                      filters.designation && 'designation',
                      filters.hasPhone && 'phone',
                      filters.hasEmail && 'email',
                    ].filter(Boolean).length}
                  </span>
                )}
              </button>

          {hasActiveFilters && (
            <button
              onClick={handleClearFilters}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              disabled={isLoading}
            >
              <X className="w-4 h-4 mr-2" />
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Advanced Filters */}
      {showAdvancedFilters && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Designation Filter */}
            <div>
              <label htmlFor="designation-filter" className="block text-sm font-medium text-gray-700 mb-1">
                Designation
              </label>
              <input
                id="designation-filter"
                type="text"
                placeholder="Filter by designation..."
                value={filters.designation || ''}
                onChange={handleDesignationChange}
                disabled={isLoading}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            </div>

            {/* Contact Info Filters */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                Contact Information
              </label>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.hasPhone === true}
                  onChange={handleHasPhoneChange}
                  disabled={isLoading}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">Has Phone Number</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.hasEmail === true}
                  onChange={handleHasEmailChange}
                  disabled={isLoading}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">Has Email Address</span>
              </label>
            </div>

            {/* Filter Summary */}
            <div className="flex items-end">
              <div className="text-sm text-gray-500">
                {hasActiveFilters ? (
                  <div>
                    <div className="font-medium text-gray-700">Active Filters:</div>
                    <ul className="mt-1 space-y-1">
                      {searchTerm && (
                        <li>• Search: &quot;{searchTerm}&quot;</li>
                      )}
                      {filters.designation && (
                        <li>• Designation: &quot;{filters.designation}&quot;</li>
                      )}
                      {filters.hasPhone && (
                        <li>• Has Phone Number</li>
                      )}
                      {filters.hasEmail && (
                        <li>• Has Email Address</li>
                      )}
                    </ul>
                  </div>
                ) : (
                  <div>No filters applied</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});
