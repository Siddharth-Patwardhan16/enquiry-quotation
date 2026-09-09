'use client';

import Link from 'next/link';
import { api } from '@/trpc/client';
import { 
  Calculator, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  Eye, 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  ChevronLeft, 
  ChevronRight,
  Filter
} from 'lucide-react';
import { useState } from 'react';
import { buildFinancialYearOptions, getFinancialYear } from '@/lib/financial-year';

type QuotationStatus = 'LIVE' | 'WON' | 'LOST' | 'BUDGETARY' | 'DEAD' | 'RECEIVED';

type Quotation = {
  id: string;
  quotationNumber: string;
  quotationDate: Date | string | null;
  createdAt: Date | string;
  totalValue: number | string | null;
  purchaseOrderNumber: string | null;
  status: QuotationStatus | string;
  enquiry: {
    company: { name: string } | null;
    customer: { name: string } | null;
  } | null;
};

export default function QuotationsPage() {
  const [financialYear, setFinancialYear] = useState(() => getFinancialYear(new Date()));
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const financialYearOptions = buildFinancialYearOptions(6, 1);

  const { data: paginatedData, isLoading, error, refetch } = api.quotation.getPaginated.useQuery({
    financialYear,
    page: currentPage,
    pageSize,
    search: searchQuery.trim() || undefined,
    status: (statusFilter as QuotationStatus) || undefined,
  });

  const { data: stats } = api.quotation.getStats.useQuery({ financialYear });
  const quotations = (paginatedData?.items ?? []) as unknown as Quotation[];
  const totalQuotations = paginatedData?.total ?? 0;
  const totalPages = Math.max(1, paginatedData?.totalPages ?? 1);

  const deleteQuotationMutation = api.quotation.delete.useMutation({
    onSuccess: () => {
      refetch();
      setDeletingId(null);
    },
    onError: (err) => {
      alert(`Failed to delete quotation: ${err.message}`);
      setDeletingId(null);
    },
  });

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this quotation? This action cannot be undone.')) {
      setDeletingId(id);
      deleteQuotationMutation.mutate({ id });
    }
  };

  const formatCurrency = (amount: number | string | { toString(): string } | null | undefined) => {
    const rawVal = typeof amount === 'object' && amount !== null ? amount.toString() : amount;
    const numeric = Number(rawVal ?? 0);
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Number.isFinite(numeric) ? numeric : 0);
  };

  const formatDateSafe = (value: Date | string | null | undefined): string => {
    if (!value) return '-';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return '-';
    return parsed.toLocaleDateString();
  };

  const displayStats = stats ? {
    total: stats.total,
    live: stats.live,
    won: stats.won,
    lost: stats.lost,
    budgetary: stats.budgetary,
    dead: stats.dead,
  } : {
    total: 0,
    live: 0,
    won: 0,
    lost: 0,
    budgetary: 0,
    dead: 0,
  };

  const displayTotalValue = stats?.liveTotalValue ?? 0;

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; label: string }> = {
      LIVE: { color: 'bg-yellow-100 text-yellow-800', label: 'Live' },
      WON: { color: 'bg-green-100 text-green-800', label: 'Won' },
      LOST: { color: 'bg-red-100 text-red-800', label: 'Lost' },
      BUDGETARY: { color: 'bg-orange-100 text-orange-800', label: 'Budgetary' },
      DEAD: { color: 'bg-gray-100 text-gray-800', label: 'Dead' },
      RECEIVED: { color: 'bg-blue-100 text-blue-800', label: 'Received' },
    };
    
    const config = statusConfig[status] ?? { color: 'bg-gray-100 text-gray-800', label: status };
    
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
          className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-white font-medium hover:bg-blue-700 shadow-sm transition-colors"
        >
          <Plus className="h-4 w-4" />
          New Quotation
        </Link>
      </div>

      {/* Financial Year Selector */}
      <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-4 rounded-lg shadow-sm border border-gray-100">
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <span className="font-semibold text-gray-900 whitespace-nowrap">Financial Year:</span>
          <select
            value={financialYear}
            onChange={(e) => {
              setFinancialYear(e.target.value);
              setCurrentPage(1);
            }}
            className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm"
          >
            {financialYearOptions.map((fy) => (
              <option key={fy} value={fy}>
                {fy}
              </option>
            ))}
          </select>
        </label>
        <p className="text-sm text-gray-500">
          Quotations and summary metrics filtered for FY {financialYear}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white overflow-hidden shadow rounded-lg border border-gray-100">
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
                  <dd className="text-lg font-semibold text-gray-900">{displayStats.total}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg border border-gray-100">
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
                  <dd className="text-lg font-semibold text-gray-900">{formatCurrency(displayTotalValue)}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg border border-gray-100">
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
                  <dd className="text-lg font-semibold text-gray-900">{displayStats.live}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg border border-gray-100">
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
                  <dd className="text-lg font-semibold text-gray-900">{displayStats.won}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quotations Table */}
      <div className="bg-white shadow rounded-lg border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Quotation Management</h3>
              <p className="mt-1 text-sm text-gray-500">Track and manage all customer quotations</p>
            </div>

            {/* Search & Filter Toolbar */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search quotation, PO, customer..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-9 pr-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-64 shadow-sm"
                />
              </div>

              <div className="flex items-center gap-1.5">
                <Filter className="h-4 w-4 text-gray-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white shadow-sm"
                >
                  <option value="">All Statuses</option>
                  <option value="LIVE">Live</option>
                  <option value="WON">Won</option>
                  <option value="LOST">Lost</option>
                  <option value="BUDGETARY">Budgetary</option>
                  <option value="DEAD">Dead</option>
                  <option value="RECEIVED">Received</option>
                </select>
              </div>
            </div>
          </div>
        </div>
        
        <div className="p-6">
          {error && (
            <div className="mb-4 p-4 rounded-md bg-red-50 text-red-700 text-sm border border-red-200">
              Failed to load quotations: {error.message}
            </div>
          )}

          {isLoading ? (
            <div className="p-8 text-center text-gray-500 flex flex-col items-center justify-center gap-2">
              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <span>Loading quotations...</span>
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
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
                    {quotations.length > 0 ? quotations.map((q: Quotation) => (
                      <tr key={q.id} className="border-b last:border-none hover:bg-gray-50 transition-colors">
                        <td className="p-4 font-medium text-gray-900">{q.quotationNumber}</td>
                        <td className="p-4 text-gray-900">{q.enquiry?.company?.name ?? q.enquiry?.customer?.name ?? 'Unknown Customer'}</td>
                        <td className="p-4 text-gray-500">
                          {formatDateSafe(q.quotationDate ?? q.createdAt)}
                        </td>
                        <td className="p-4 text-gray-900 font-medium">
                          {formatCurrency(q.totalValue)}
                        </td>
                        <td className="p-4 text-gray-900">
                          {q.purchaseOrderNumber ?? '-'}
                        </td>
                        <td className="p-4">{getStatusBadge(q.status)}</td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <Link
                              href={`/quotations/${q.id}`}
                              className="inline-flex items-center justify-center h-8 w-8 rounded-md text-blue-600 hover:bg-blue-50 transition-colors"
                              title="View Quotation Details"
                            >
                              <Eye className="h-4 w-4" />
                            </Link>
                            <Link
                              href={`/quotations/${q.id}/edit`}
                              className="inline-flex items-center justify-center h-8 w-8 rounded-md text-green-600 hover:bg-green-50 transition-colors"
                              title="Edit Quotation"
                            >
                              <Edit className="h-4 w-4" />
                            </Link>
                            <button
                              onClick={() => handleDelete(q.id)}
                              disabled={deletingId === q.id}
                              className="inline-flex items-center justify-center h-8 w-8 rounded-md text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                              title="Delete Quotation"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-gray-500">
                          No quotations found matching your criteria.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              {totalQuotations > 0 && (
                <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="text-sm text-gray-700">
                    Showing <span className="font-semibold text-gray-900">{((currentPage - 1) * pageSize) + 1}</span> to{' '}
                    <span className="font-semibold text-gray-900">{Math.min(currentPage * pageSize, totalQuotations)}</span> of{' '}
                    <span className="font-semibold text-gray-900">{totalQuotations}</span> quotations
                  </div>

                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-1.5 text-xs text-gray-600">
                      <span>Rows:</span>
                      <select
                        value={pageSize}
                        onChange={(e) => {
                          setPageSize(Number(e.target.value));
                          setCurrentPage(1);
                        }}
                        className="border border-gray-300 rounded px-2 py-1 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        <option value={10}>10</option>
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                      </select>
                    </label>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage <= 1 || isLoading}
                        className="p-1.5 rounded border border-gray-300 text-gray-700 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        title="Previous page"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <span className="px-2 text-xs font-medium text-gray-700">
                        Page {currentPage} of {totalPages}
                      </span>
                      <button
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        disabled={currentPage >= totalPages || isLoading}
                        className="p-1.5 rounded border border-gray-300 text-gray-700 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        title="Next page"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
