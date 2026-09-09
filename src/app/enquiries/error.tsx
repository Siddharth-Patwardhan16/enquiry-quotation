'use client';

import { useEffect } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

export default function EnquiriesError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Enquiries Page client error:', error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="max-w-lg w-full bg-white rounded-xl shadow-md border border-gray-200 p-8 text-center space-y-6">
        <div className="w-14 h-14 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto">
          <AlertCircle className="w-7 h-7" />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-bold text-gray-900">Failed to Load Enquiries</h2>
          <p className="text-sm text-gray-600">
            An unexpected error occurred while preparing enquiry data. You can retry loading the page.
          </p>
          {error?.message && (
            <div className="mt-4 p-3 bg-red-50/50 border border-red-100 rounded text-left text-xs font-mono text-red-700 overflow-x-auto max-h-32">
              {error.message}
            </div>
          )}
        </div>

        <div className="flex justify-center gap-3">
          <button
            onClick={() => reset()}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Reload Enquiries
          </button>
        </div>
      </div>
    </div>
  );
}
