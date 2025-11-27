'use client';

import { useState } from 'react';
import { api } from '@/trpc/client';
import { QuotationStatusUpdater } from './_components/QuotationStatusUpdater';
import type { AppRouter } from '@/server/api/root';
import type { inferRouterOutputs } from '@trpc/server';

// Use the same type as the QuotationStatusUpdater component
type Quotation = inferRouterOutputs<AppRouter>['quotation']['getAll'][0];

export default function QuotationStatusPage() {
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const { data: quotations, isLoading, error } = api.quotation.getAll.useQuery();
  const { data: stats, isLoading: isLoadingStats, error: statsError } = api.quotation.getStats.useQuery();

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

  // Log stats error if any (for debugging)
  if (statsError) {
    console.error('Stats query error:', statsError);
  }

  // Use backend stats if available, otherwise show loading or 0
  const displayStats = stats ? {
    total: stats.total ?? 0,
    live: stats.live ?? 0,
    won: stats.won ?? 0,
    lost: stats.lost ?? 0,
    budgetary: stats.budgetary ?? 0,
    dead: stats.dead ?? 0
  } : {
    total: isLoadingStats ? '...' : 0,
    live: isLoadingStats ? '...' : 0,
    won: isLoadingStats ? '...' : 0,
    lost: isLoadingStats ? '...' : 0,
    budgetary: isLoadingStats ? '...' : 0,
    dead: isLoadingStats ? '...' : 0
  };

  // Filter quotations based on status filter
  const filteredQuotations = statusFilter 
    ? quotations?.filter(q => q.status === statusFilter) ?? []
    : quotations ?? [];

  // Calculate total value from filtered quotations
  // Use PO value for WON quotations (matching dashboard chart logic)
  const displayTotalValue = filteredQuotations.reduce((sum, q) => {
    // Use PO value if status is WON and poValue is available, otherwise use totalValue
    const value = q.status === 'WON' && q.poValue 
      ? Number(q.poValue) 
      : q.totalValue ? Number(q.totalValue) : 0;
    return sum + value;
  }, 0);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="min-w-0 p-4 md:p-8 max-w-full overflow-x-hidden">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Quotation Status</h1>
        <p className="text-gray-600 mt-1">Track and update the status of all quotations as you receive feedback from customers</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 md:gap-6 mb-8">
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
                  <dd className="text-lg font-medium text-gray-900">{typeof displayStats.total === 'number' ? displayStats.total.toLocaleString() : displayStats.total}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div 
          className={`bg-white overflow-hidden shadow rounded-lg cursor-pointer transition-all hover:shadow-lg ${
            statusFilter === 'BUDGETARY' ? 'ring-2 ring-orange-500' : ''
          }`}
          onClick={() => setStatusFilter(statusFilter === 'BUDGETARY' ? null : 'BUDGETARY')}
        >
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-orange-500 rounded-md flex items-center justify-center">
                  <div className="text-white font-bold text-sm">💰</div>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Budgetary</dt>
                  <dd className="text-lg font-medium text-gray-900">{typeof displayStats.budgetary === 'number' ? displayStats.budgetary.toLocaleString() : displayStats.budgetary}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div 
          className={`bg-white overflow-hidden shadow rounded-lg cursor-pointer transition-all hover:shadow-lg ${
            statusFilter === 'LIVE' ? 'ring-2 ring-yellow-500' : ''
          }`}
          onClick={() => setStatusFilter(statusFilter === 'LIVE' ? null : 'LIVE')}
        >
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
                  <dd className="text-lg font-medium text-gray-900">{typeof displayStats.live === 'number' ? displayStats.live.toLocaleString() : displayStats.live}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div 
          className={`bg-white overflow-hidden shadow rounded-lg cursor-pointer transition-all hover:shadow-lg ${
            statusFilter === 'WON' ? 'ring-2 ring-green-500' : ''
          }`}
          onClick={() => setStatusFilter(statusFilter === 'WON' ? null : 'WON')}
        >
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
                  <dd className="text-lg font-medium text-gray-900">{typeof displayStats.won === 'number' ? displayStats.won.toLocaleString() : displayStats.won}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div 
          className={`bg-white overflow-hidden shadow rounded-lg cursor-pointer transition-all hover:shadow-lg ${
            statusFilter === 'LOST' ? 'ring-2 ring-red-500' : ''
          }`}
          onClick={() => setStatusFilter(statusFilter === 'LOST' ? null : 'LOST')}
        >
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
                  <dd className="text-lg font-medium text-gray-900">{typeof displayStats.lost === 'number' ? displayStats.lost.toLocaleString() : displayStats.lost}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div 
          className={`bg-white overflow-hidden shadow rounded-lg cursor-pointer transition-all hover:shadow-lg ${
            statusFilter === 'DEAD' ? 'ring-2 ring-gray-500' : ''
          }`}
          onClick={() => setStatusFilter(statusFilter === 'DEAD' ? null : 'DEAD')}
        >
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-gray-600 rounded-md flex items-center justify-center">
                  <div className="text-white font-bold text-sm">💀</div>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Dead</dt>
                  <dd className="text-lg font-medium text-gray-900">{typeof displayStats.dead === 'number' ? displayStats.dead.toLocaleString() : displayStats.dead}</dd>
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
                <dt className="text-sm font-medium text-gray-500 truncate">
                  {statusFilter === 'WON' ? 'Total Won Value' :
                   statusFilter === 'LIVE' ? 'Total Live Value' :
                   statusFilter === 'LOST' ? 'Total Lost Value' :
                   statusFilter === 'BUDGETARY' ? 'Total Budgetary Value' :
                   statusFilter === 'DEAD' ? 'Total Dead Value' :
                   'Total Value'}
                </dt>
                <dd className="text-2xl font-bold text-gray-900">{formatCurrency(displayTotalValue)}</dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Status */}
      {statusFilter && (
        <div className="mb-4 flex items-center justify-between bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center">
            <span className="text-sm text-blue-700">
              Showing quotations with status: <strong>{statusFilter}</strong>
            </span>
          </div>
          <button
            onClick={() => setStatusFilter(null)}
            className="text-sm text-blue-600 hover:text-blue-800 underline"
          >
            Clear Filter
          </button>
        </div>
      )}

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
          <div className="overflow-x-auto -mx-6 px-6">
            <div className="inline-block min-w-full align-middle">
              <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Quotation #
                      </th>
                      <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Customer
                      </th>
                      <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[200px]">
                        Subject
                      </th>
                      <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total Value
                      </th>
                      <th className="px-4 md:px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-4 md:px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredQuotations?.map((quotation: Quotation) => (
                      <tr key={quotation.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{quotation.quotationNumber}</div>
                        </td>
                        <td className="px-4 md:px-6 py-4">
                          <div className="text-sm text-gray-900 max-w-[150px] truncate" title={quotation.enquiry?.company?.name ?? quotation.enquiry?.customer?.name ?? 'N/A'}>
                            {quotation.enquiry?.company?.name ?? quotation.enquiry?.customer?.name ?? 'N/A'}
                          </div>
                        </td>
                        <td className="px-4 md:px-6 py-4">
                          <div className="text-sm text-gray-900 max-w-[200px] truncate" title={quotation.enquiry?.subject ?? 'N/A'}>
                            {quotation.enquiry?.subject ?? 'N/A'}
                          </div>
                        </td>
                        <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {quotation.totalValue ? formatCurrency(Number(quotation.totalValue)) : 'N/A'}
                          </div>
                        </td>
                        <td className="px-4 md:px-6 py-4 whitespace-nowrap text-center">
                          <QuotationStatusUpdater quotation={quotation} />
                        </td>
                        <td className="px-4 md:px-6 py-4 whitespace-nowrap text-center">
                          <button
                            onClick={() => window.open(`/quotations/${quotation.id}`, '_blank')}
                            className="inline-flex items-center px-2 md:px-3 py-1 border border-transparent text-xs md:text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                          >
                            <span className="hidden sm:inline mr-1">👁️</span>
                            <span className="sm:hidden">👁</span>
                            <span className="hidden sm:inline">View</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
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
