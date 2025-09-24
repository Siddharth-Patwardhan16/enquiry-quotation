'use client';

import { memo } from 'react';
import { Upload, Download } from 'lucide-react';

interface CustomerActionsProps {
  onImport: () => void;
  onExport: () => void;
}

export const CustomerActions = memo(function CustomerActions({
  onImport,
  onExport,
}: CustomerActionsProps) {
  return (
    <div className="flex items-center justify-end mb-6">
      {/* Action buttons */}
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

