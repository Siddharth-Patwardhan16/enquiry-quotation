'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Search, Building2, ChevronDown, Check, X, Loader2, AlertCircle } from 'lucide-react';

// Customer interface - adjust according to your data structure
interface Customer {
  id: string;
  name: string;
  type?: string;
  website?: string;
  industry?: string;
  location?: string;
}

interface CustomerSelectorProps {
  customers: Customer[];
  selectedCustomer?: Customer | null;
  onCustomerSelect: (_customer: Customer | null) => void;
  placeholder?: string;
  required?: boolean;
  error?: string;
  loading?: boolean;
  onSearch?: (_searchTerm: string) => void;
  searchDelay?: number;
  emptyMessage?: string;
  loadingMessage?: string;
  className?: string;
}

const CustomerSelector: React.FC<CustomerSelectorProps> = ({
  customers,
  selectedCustomer = null,
  onCustomerSelect,
  placeholder = "Select a customer",
  required = false,
  error,
  loading = false,
  onSearch,
  searchDelay = 300,
  emptyMessage = "No customers found",
  loadingMessage = "Loading customers...",
  className = ""
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [isSearching, setIsSearching] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Filter customers locally if no onSearch function provided
  const filteredCustomers = onSearch 
    ? customers 
    : customers.filter(customer =>
        customer.name.toLowerCase().includes(searchTerm.toLowerCase())
      );

  // Handle search with debouncing for external search
  useEffect(() => {
    if (onSearch && searchTerm) {
      setIsSearching(true);
      
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }

      searchTimeoutRef.current = setTimeout(() => {
        onSearch(searchTerm);
        setIsSearching(false);
      }, searchDelay);

      return () => {
        if (searchTimeoutRef.current) {
          clearTimeout(searchTimeoutRef.current);
        }
      };
    } else if (onSearch && !searchTerm) {
      onSearch('');
    }
  }, [searchTerm, onSearch, searchDelay]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
        setFocusedIndex(-1);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setFocusedIndex(prev => 
          prev < filteredCustomers.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFocusedIndex(prev => prev > 0 ? prev - 1 : prev);
        break;
      case 'Enter':
        e.preventDefault();
        if (focusedIndex >= 0 && focusedIndex < filteredCustomers.length) {
          handleSelectCustomer(filteredCustomers[focusedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSearchTerm('');
        setFocusedIndex(-1);
        break;
    }
  };

  const handleSelectCustomer = (customer: Customer) => {
    onCustomerSelect(customer);
    setIsOpen(false);
    setSearchTerm('');
    setFocusedIndex(-1);
  };

  const handleClearSelection = (e: React.MouseEvent) => {
    e.stopPropagation();
    onCustomerSelect(null);
  };

  return (
    <div className={`space-y-1 ${className}`}>
      <label className="block text-sm font-medium text-gray-700">
        Customer {required && <span className="text-red-500">*</span>}
      </label>
      
      <div className="relative" ref={dropdownRef}>
        {/* Main Selector Button */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          onKeyDown={handleKeyDown}
          className={`
            relative w-full bg-white border rounded-lg px-4 py-3 text-left cursor-pointer
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
            transition-colors duration-200
            ${error ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'}
            ${isOpen ? 'border-blue-500 ring-2 ring-blue-500' : ''}
            hover:border-gray-400
          `}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              <Building2 className="w-5 h-5 text-gray-400 flex-shrink-0" />
              {selectedCustomer ? (
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 truncate">
                    {selectedCustomer.name}
                  </div>
                  <div className="text-sm text-gray-500 flex items-center space-x-2">
                    {selectedCustomer.type && <span>{selectedCustomer.type}</span>}
                    {selectedCustomer.location && (
                      <>
                        {selectedCustomer.type && <span>•</span>}
                        <span>{selectedCustomer.location}</span>
                      </>
                    )}
                  </div>
                </div>
              ) : (
                <span className="text-gray-500 font-normal">
                  {placeholder}
                </span>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              {selectedCustomer && (
                <div
                  onClick={handleClearSelection}
                  className="p-1 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
                  title="Clear selection"
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleClearSelection(e as any);
                    }
                  }}
                >
                  <X className="w-4 h-4 text-gray-400" />
                </div>
              )}
              <ChevronDown 
                className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${
                  isOpen ? 'transform rotate-180' : ''
                }`} 
              />
            </div>
          </div>
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
            {/* Search Input */}
            <div className="p-3 border-b border-gray-100">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search customers..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setFocusedIndex(-1);
                  }}
                  onKeyDown={handleKeyDown}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Customer List - Scrollable */}
            <div className="max-h-60 overflow-y-auto">
              {loading || isSearching ? (
                <div className="px-4 py-8 text-center">
                  <Loader2 className="w-8 h-8 text-gray-400 mx-auto mb-2 animate-spin" />
                  <div className="text-sm text-gray-500">{loadingMessage}</div>
                </div>
              ) : filteredCustomers.length > 0 ? (
                <div className="py-1">
                  {filteredCustomers.map((customer, index) => (
                    <button
                      key={customer.id}
                      type="button"
                      onClick={() => handleSelectCustomer(customer)}
                      className={`
                        w-full px-4 py-3 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none
                        transition-colors duration-150
                        ${index === focusedIndex ? 'bg-gray-50' : ''}
                        ${selectedCustomer?.id === customer.id ? 'bg-blue-50' : ''}
                      `}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3 flex-1 min-w-0">
                          <Building2 className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-gray-900 truncate">
                              {customer.name}
                            </div>
                            <div className="text-sm text-gray-500 flex items-center space-x-2">
                              {customer.type && <span>{customer.type}</span>}
                              {customer.location && (
                                <>
                                  {customer.type && <span>•</span>}
                                  <span>{customer.location}</span>
                                </>
                              )}
                              {customer.industry && (
                                <>
                                  {(customer.type || customer.location) && <span>•</span>}
                                  <span>{customer.industry}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        {selectedCustomer?.id === customer.id && (
                          <Check className="w-5 h-5 text-blue-600 flex-shrink-0" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="px-4 py-8 text-center">
                  <Building2 className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <div className="text-sm text-gray-500">{emptyMessage}</div>
                  {searchTerm && (
                    <div className="text-xs text-gray-400 mt-1">
                      Try adjusting your search term
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer with count */}
            {!loading && !isSearching && filteredCustomers.length > 0 && (
              <div className="px-4 py-2 border-t border-gray-100 bg-gray-50 text-xs text-gray-500">
                {filteredCustomers.length} customer{filteredCustomers.length !== 1 ? 's' : ''} found
                {searchTerm && ` for "${searchTerm}"`}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <p className="text-sm text-red-600 mt-1 flex items-center">
          <AlertCircle className="w-4 h-4 mr-1" />
          {error}
        </p>
      )}

      {/* Help Text */}
      {!error && (
        <p className="text-xs text-gray-500 mt-1">
          Search and select the customer for this enquiry
        </p>
      )}
    </div>
  );
};

export default CustomerSelector;
export type { Customer, CustomerSelectorProps };
