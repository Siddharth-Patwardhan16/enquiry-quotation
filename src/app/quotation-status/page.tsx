'use client';

import { api } from '@/trpc/client';
import { QuotationStatusUpdater } from './_components/QuotationStatusUpdater';
import type { AppRouter } from '@/server/api/root';
import type { inferRouterOutputs } from '@trpc/server';

// Use the same type as the QuotationStatusUpdater component
type Quotation = inferRouterOutputs<AppRouter>['quotation']['getAll'][0];

export default function QuotationStatusPage() {
  const { data: quotations, isLoading, error } = api.quotation.getAll.useQuery();

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
          <div className="text-red-500 text-6xl mb-4">❌</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Quotations</h2>
          <p className="text-gray-600 mb-4">{error.message}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Calculate stats
  const stats = {
    total: quotations?.length || 0,
    draft: quotations?.filter((q: Quotation) => q.status === 'DRAFT').length || 0,
    live: quotations?.filter((q: Quotation) => ['LIVE', 'SUBMITTED'].includes(q.status)).length || 0,
    won: quotations?.filter((q: Quotation) => q.status === 'WON').length || 0,
    lost: quotations?.filter((q: Quotation) => q.status === 'LOST').length || 0,
    received: quotations?.filter((q: Quotation) => q.status === 'RECEIVED').length || 0
  };

  const totalValue = quotations
    ?.filter((q: Quotation) => ['LIVE', 'SUBMITTED', 'WON', 'RECEIVED'].includes(q.status))
    .reduce((sum: number, q: Quotation) => sum + (Number(q.totalValue) || 0), 0) || 0;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="p-4 md:p-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Quotation Status</h1>
        <p className="text-gray-600 mt-1">Track and update the status of all quotations as you receive feedback from customers</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-6 mb-8">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                  <div className="text-white font-bold text-sm">📄</div>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.total}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-gray-500 rounded-md flex items-center justify-center">
                  <div className="text-white font-bold text-sm">📝</div>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Draft</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.draft}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                  <div className="text-white font-bold text-sm">⏳</div>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Live</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.live}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                  <div className="text-white font-bold text-sm">🏆</div>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Won</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.won}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-red-500 rounded-md flex items-center justify-center">
                  <div className="text-white font-bold text-sm">❌</div>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Lost</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.lost}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                  <div className="text-white font-bold text-sm">📦</div>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Received</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.received}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Total Value Card */}
      <div className="bg-white overflow-hidden shadow rounded-lg mb-8">
        <div className="p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-indigo-500 rounded-md flex items-center justify-center">
                <div className="text-white font-bold text-sm">💰</div>
              </div>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Total Live Value</dt>
                <dd className="text-2xl font-bold text-gray-900">{formatCurrency(totalValue)}</dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      {/* Quotations Table */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Quotation Status Overview</h3>
          <p className="text-sm text-gray-600 mt-1">Click on any status to update it</p>
        </div>
        
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 text-lg font-medium">Loading quotations...</p>
            <p className="text-gray-500 text-sm mt-1">Please wait while we fetch your data</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quotation #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Subject
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Value
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {quotations?.map((quotation: Quotation) => (
                  <tr key={quotation.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{quotation.quotationNumber}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{quotation.enquiry?.customer?.name || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 max-w-xs truncate" title={quotation.enquiry?.subject || 'N/A'}>
                        {quotation.enquiry?.subject || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {quotation.totalValue ? formatCurrency(Number(quotation.totalValue)) : 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <QuotationStatusUpdater quotation={quotation} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <button
                        onClick={() => window.open(`/quotations/${quotation.id}`, '_blank')}
                        className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                      >
                        <div className="w-4 h-4 mr-1">👁️</div>
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        {!isLoading && quotations?.length === 0 && (
          <div className="p-8 text-center">
            <div className="text-gray-400 text-6xl mb-4">📄</div>
            <p className="text-gray-600 text-lg">No quotations found</p>
            <p className="text-gray-500 text-sm mt-1">Create your first quotation to get started</p>
          </div>
                 )}
       </div>
     </div>
   );
 }
