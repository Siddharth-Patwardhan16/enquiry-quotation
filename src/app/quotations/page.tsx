'use client';

import Link from 'next/link';
import { api } from '@/trpc/client';
import { Calculator, TrendingUp, Clock, CheckCircle, Eye, Plus } from 'lucide-react';
import type { AppRouter } from '@/server/api/root';
import type { inferRouterOutputs } from '@trpc/server';

// Use the same type as other quotation components
type Quotation = inferRouterOutputs<AppRouter>['quotation']['getAll'][0];

export default function QuotationsPage() {
  const { data: quotations, isLoading, error } = api.quotation.getAll.useQuery();

  if (error) return <div>Error: {error.message}</div>;

  // Calculate stats
      const stats = {
      total: quotations?.length ?? 0,
      draft: quotations?.filter((q: Quotation) => q.status === 'DRAFT').length ?? 0,
      live: quotations?.filter((q: Quotation) => ['LIVE', 'SUBMITTED'].includes(q.status)).length ?? 0,
      won: quotations?.filter((q: Quotation) => q.status === 'WON').length ?? 0
    };

  const totalValue = quotations
    ?.filter((q: Quotation) => ['LIVE', 'SUBMITTED'].includes(q.status))
          .reduce((sum: number, q: Quotation) => sum + (Number(q.totalValue) ?? 0), 0) ?? 0;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'DRAFT': { color: 'bg-gray-100 text-gray-800', label: 'Draft' },
      'LIVE': { color: 'bg-yellow-100 text-yellow-800', label: 'Live' },
      'SUBMITTED': { color: 'bg-blue-100 text-blue-800', label: 'Submitted' },
      'WON': { color: 'bg-green-100 text-green-800', label: 'Won' },
      'LOST': { color: 'bg-red-100 text-red-800', label: 'Lost' },
      'RECEIVED': { color: 'bg-purple-100 text-purple-800', label: 'Received' }
    };
    
          const config = statusConfig[status as keyof typeof statusConfig] ?? statusConfig['DRAFT'];
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  return (
    <div className="p-4 md:p-8">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Quotations</h1>
          <p className="text-gray-600 mt-1">Manage customer quotations and track their progress</p>
        </div>
        <Link 
          href="/quotations/new" 
          className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-white font-medium hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          New Quotation
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                  <Calculator className="w-5 h-5 text-white" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Quotations</dt>
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
                <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Live Value</dt>
                  <dd className="text-lg font-medium text-gray-900">{formatCurrency(totalValue)}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-orange-500 rounded-md flex items-center justify-center">
                  <Clock className="w-5 h-5 text-white" />
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
                <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-white" />
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
      </div>

      {/* Quotations Table */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Quotation Management</h3>
              <p className="mt-1 text-sm text-gray-500">Track and manage all customer quotations</p>
            </div>
          </div>
        </div>
        
        <div className="px-6 pb-6">
          {isLoading ? (
            <p className="p-4">Loading quotations...</p>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50 border-b">
                    <th className="p-4 font-medium text-gray-900">Quotation #</th>
                    <th className="p-4 font-medium text-gray-900">Customer</th>
                    <th className="p-4 font-medium text-gray-900">Date</th>
                    <th className="p-4 font-medium text-gray-900">Total Value</th>
                    <th className="p-4 font-medium text-gray-900">Status</th>
                    <th className="p-4 font-medium text-gray-900 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                                     {quotations?.map((q: Quotation) => (
                    <tr key={q.id} className="border-b last:border-none hover:bg-gray-50">
                      <td className="p-4 font-medium text-gray-900">{q.quotationNumber}</td>
                      <td className="p-4 text-gray-900">{q.enquiry.customer.name}</td>
                      <td className="p-4 text-gray-500">
                        {new Date(q.quotationDate ?? q.createdAt).toLocaleDateString()}
                      </td>
                      <td className="p-4 text-gray-900">
                        {formatCurrency(Number(q.totalValue) ?? 0)}
                      </td>
                      <td className="p-4">{getStatusBadge(q.status)}</td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Link
                            href={`/quotations/${q.id}`}
                            className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all hover:bg-blue-100 h-8 w-8 rounded-md text-blue-600 hover:text-blue-700"
                            title="View Quotation Details"
                          >
                            <Eye className="h-4 w-4" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
