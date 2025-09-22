'use client';

import { memo } from 'react';
import { Upload, Download, Trash2, Edit } from 'lucide-react';
import { CustomerActionsProps } from '../_types/customer.types';

export const CustomerActions = memo(function CustomerActions({
  selectedCount,
  onImport,
  onExport,
  onBulkDelete,
  onBulkEdit,
}: CustomerActionsProps) {
  return (
    <div className="flex items-center justify-between mb-6">
      {/* Left side - Selection info */}
      <div className="flex items-center space-x-4">
        {selectedCount > 0 && (
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-700">
              {selectedCount} customer{selectedCount !== 1 ? 's' : ''} selected
            </span>
            {onBulkDelete && (
              <button
                onClick={onBulkDelete}
                className="inline-flex items-center px-3 py-1.5 border border-red-300 rounded-md text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors"
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Delete Selected
              </button>
            )}
            {onBulkEdit && (
              <button
                onClick={onBulkEdit}
                className="inline-flex items-center px-3 py-1.5 border border-blue-300 rounded-md text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
              >
                <Edit className="w-4 h-4 mr-1" />
                Edit Selected
              </button>
            )}
          </div>
        )}
      </div>

      {/* Right side - Action buttons */}
      <div className="flex space-x-3">
        <button
          onClick={onImport}
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
        >
          <Upload className="w-4 h-4 mr-2" />
          Import
        </button>
        <button
          onClick={onExport}
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
        >
          <Download className="w-4 h-4 mr-2" />
          Export
        </button>
      </div>
    </div>
  );
});

