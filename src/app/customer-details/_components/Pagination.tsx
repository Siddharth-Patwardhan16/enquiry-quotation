'use client';

import { memo } from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { PaginationProps } from '../_types/customer.types';
import { getPaginationInfo } from '../_utils/customerHelpers';

export const Pagination = memo(function Pagination({
  currentPage,
  totalPages,
  totalCount,
  pageSize,
  onPageChange,
  onPageSizeChange,
  hasNextPage,
  hasPreviousPage,
  isLoading,
}: PaginationProps) {
  const paginationInfo = getPaginationInfo(currentPage, pageSize, totalCount);

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      // Show all pages if total is small
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);
      
      if (currentPage > 3) {
        pages.push('...');
      }
      
      // Show pages around current page
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      
      for (let i = start; i <= end; i++) {
        if (i !== 1 && i !== totalPages) {
          pages.push(i);
        }
      }
      
      if (currentPage < totalPages - 2) {
        pages.push('...');
      }
      
      // Always show last page
      if (totalPages > 1) {
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  const pageNumbers = getPageNumbers();

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages && page !== currentPage && !isLoading) {
      onPageChange(page);
    }
  };

  const handlePageSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newPageSize = parseInt(e.target.value, 10);
    onPageSizeChange(newPageSize);
  };

  if (totalPages <= 1) {
    return (
      <div className="flex items-center justify-between px-6 py-3 bg-white border-t border-gray-200">
        <div className="text-sm text-gray-700">
          {paginationInfo}
        </div>
        <div className="flex items-center space-x-2">
          <label htmlFor="page-size" className="text-sm text-gray-700">
            Show:
          </label>
          <select
            id="page-size"
            value={pageSize}
            onChange={handlePageSizeChange}
            disabled={isLoading}
            className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
          <span className="text-sm text-gray-700">per page</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between px-6 py-3 bg-white border-t border-gray-200">
      {/* Pagination Info */}
      <div className="text-sm text-gray-700">
        {paginationInfo}
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center space-x-2">
        {/* Page Size Selector */}
        <div className="flex items-center space-x-2 mr-4">
          <label htmlFor="page-size" className="text-sm text-gray-700">
            Show:
          </label>
          <select
            id="page-size"
            value={pageSize}
            onChange={handlePageSizeChange}
            disabled={isLoading}
            className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
          <span className="text-sm text-gray-700">per page</span>
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center space-x-1">
          {/* First Page */}
          <button
            onClick={() => handlePageChange(1)}
            disabled={!hasPreviousPage || isLoading}
            className="p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
            title="First page"
          >
            <ChevronsLeft className="w-4 h-4" />
          </button>

          {/* Previous Page */}
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={!hasPreviousPage || isLoading}
            className="p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
            title="Previous page"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Page Numbers */}
          <div className="flex items-center space-x-1">
            {pageNumbers.map((page, index) => (
              <button
                key={index}
                onClick={() => typeof page === 'number' ? handlePageChange(page) : undefined}
                disabled={page === '...' || isLoading}
                className={`px-3 py-2 text-sm rounded-md transition-colors ${
                  page === currentPage
                    ? 'bg-blue-600 text-white'
                    : page === '...'
                    ? 'text-gray-400 cursor-default'
                    : 'text-gray-700 hover:bg-gray-100'
                } disabled:cursor-not-allowed disabled:hover:bg-transparent`}
              >
                {page}
              </button>
            ))}
          </div>

          {/* Next Page */}
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={!hasNextPage || isLoading}
            className="p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
            title="Next page"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* Last Page */}
          <button
            onClick={() => handlePageChange(totalPages)}
            disabled={!hasNextPage || isLoading}
            className="p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
            title="Last page"
          >
            <ChevronsRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
});

