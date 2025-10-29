'use client';

import Link from 'next/link';
import { api } from '@/trpc/client';
import { Calculator, TrendingUp, Clock, CheckCircle, Eye, Plus, Edit, Trash2 } from 'lucide-react';
import type { AppRouter } from '@/server/api/root';
import type { inferRouterOutputs } from '@trpc/server';
import { useState } from 'react';

// Use the same type as other quotation components
type Quotation = inferRouterOutputs<AppRouter>['quotation']['getAll'][0];

export default function QuotationsPage() {
  const { data: quotations, isLoading, error, refetch } = api.quotation.getAll.useQuery();
  const { data: stats } = api.quotation.getStats.useQuery();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const deleteQuotationMutation = api.quotation.delete.useMutation({
    onSuccess: () => {
      refetch();
      setDeletingId(null);
    },
    onError: (error) => {
      alert(`Failed to delete quotation: ${error.message}`);
      setDeletingId(null);
    },
  });

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this quotation? This action cannot be undone.')) {
      setDeletingId(id);
      deleteQuotationMutation.mutate({ id });
    }
  };

  if (error) return <div>Error: {error.message}</div>;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Use backend stats if available, otherwise show loading
  const displayStats = stats ? {
    total: stats.total,
    live: stats.live,
    won: stats.won,
    lost: stats.lost,
    budgetary: stats.budgetary,
    dead: stats.dead
  } : {
    total: 0,
    live: 0,
    won: 0,
    lost: 0,
    budgetary: 0,
    dead: 0
  };

  const displayTotalValue = stats?.liveTotalValue ?? 0;

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'LIVE': { color: 'bg-yellow-100 text-yellow-800', label: 'Live' },
      'WON': { color: 'bg-green-100 text-green-800', label: 'Won' },
      'LOST': { color: 'bg-red-100 text-red-800', label: 'Lost' },
      'BUDGETARY': { color: 'bg-orange-100 text-orange-800', label: 'Budgetary' },
      'DEAD': { color: 'bg-gray-100 text-gray-800', label: 'Dead' }
    };
    
          const config = statusConfig[status as keyof typeof statusConfig] ?? statusConfig['LIVE'];
    
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
                  <dd className="text-lg font-medium text-gray-900">{displayStats.total}</dd>
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
                  <dd className="text-lg font-medium text-gray-900">{formatCurrency(Number(displayTotalValue))}</dd>
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
                  <dd className="text-lg font-medium text-gray-900">{displayStats.live}</dd>
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
                  <dd className="text-lg font-medium text-gray-900">{displayStats.won}</dd>
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
                    <th className="p-4 font-medium text-gray-900">PO Number</th>
                    <th className="p-4 font-medium text-gray-900">Status</th>
                    <th className="p-4 font-medium text-gray-900 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                                     {quotations?.map((q: Quotation) => (
                    <tr key={q.id} className="border-b last:border-none hover:bg-gray-50">
                      <td className="p-4 font-medium text-gray-900">{q.quotationNumber}</td>
                      <td className="p-4 text-gray-900">{q.enquiry?.company?.name ?? q.enquiry?.customer?.name ?? 'Unknown Customer'}</td>
                      <td className="p-4 text-gray-500">
                        {new Date(q.quotationDate ?? q.createdAt).toLocaleDateString()}
                      </td>
                      <td className="p-4 text-gray-900">
                        {formatCurrency(Number(q.totalValue) ?? 0)}
                      </td>
                      <td className="p-4 text-gray-900">
                        {q.purchaseOrderNumber || '-'}
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
                          <Link
                            href={`/quotations/${q.id}/edit`}
                            className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all hover:bg-green-100 h-8 w-8 rounded-md text-green-600 hover:text-green-700"
                            title="Edit Quotation"
                          >
                            <Edit className="h-4 w-4" />
                          </Link>
                          <button
                            onClick={() => handleDelete(q.id)}
                            disabled={deletingId === q.id}
                            className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all hover:bg-red-100 h-8 w-8 rounded-md text-red-600 hover:text-red-700 disabled:opacity-50"
                            title="Delete Quotation"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
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
