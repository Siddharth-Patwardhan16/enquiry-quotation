'use client';

import { useParams, useRouter } from 'next/navigation';
import { api } from '@/trpc/client';
import { ArrowLeft, Building, Download, Upload, AlertTriangle } from 'lucide-react';
import { useState } from 'react';
import type { AppRouter } from '@/server/api/root';
import type { inferRouterOutputs } from '@trpc/server';

// Use the same type as other quotation components
type Quotation = NonNullable<inferRouterOutputs<AppRouter>['quotation']['getById']>;
type QuotationItem = NonNullable<Quotation['items']>[0];

export default function QuotationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const quotationId = params.id as string;
  
  const [updating, setUpdating] = useState(false);
  const [showLostReasonModal, setShowLostReasonModal] = useState(false);
  const [lostReason, setLostReason] = useState('');
  const [showPOUpload, setShowPOUpload] = useState(false);

  const { data: quotation, isLoading, error } = api.quotation.getById.useQuery({ id: quotationId });

  const updateStatusMutation = api.quotation.updateStatus.useMutation({
    onSuccess: () => {
      // Refetch the quotation data
      window.location.reload();
    },
    onError: (error) => {
      alert(`Failed to update status: ${error.message}`);
    },
  });

  if (error) return <div>Error: {error.message}</div>;
  if (isLoading || !quotation) return <div>Loading...</div>;

  const handleStatusUpdate = async (newStatus: string) => {
    if (newStatus === 'LOST') {
      setShowLostReasonModal(true);
      return;
    }

    if (newStatus === 'RECEIVED') {
      setShowPOUpload(true);
      return;
    }

    await updateQuotationStatus(newStatus);
  };

  const updateQuotationStatus = async (newStatus: string, reason?: string) => {
    setUpdating(true);
    try {
      await updateStatusMutation.mutateAsync({
        quotationId: quotationId,
        status: newStatus as 'DRAFT' | 'LIVE' | 'SUBMITTED' | 'WON' | 'LOST' | 'RECEIVED',
        ...(reason && { lostReason: reason as 'PRICE' | 'DELIVERY_SCHEDULE' | 'LACK_OF_CONFIDENCE' | 'OTHER' }),
      });
    } finally {
      setUpdating(false);
      setShowLostReasonModal(false);
      setShowPOUpload(false);
      setLostReason('');
    }
  };

  const handleLostReasonSubmit = async () => {
    if (!lostReason) return;
    await updateQuotationStatus('LOST', lostReason);
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
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig['DRAFT'];
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: quotation.currency || 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  return (
    <div className="p-4 md:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => router.push('/quotations')} 
            className="p-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Quotation {quotation.quotationNumber}
            </h1>
            <p className="text-gray-600 mt-1">
              For {quotation.enquiry.customer.name}
            </p>
          </div>
        </div>
        <div className="flex space-x-3">
          <button className="inline-flex items-center gap-2 rounded-md bg-gray-100 px-4 py-2 text-gray-700 hover:bg-gray-200">
            <Download className="h-4 w-4" />
            Export PDF
          </button>
          <button className="inline-flex items-center gap-2 rounded-md bg-blue-100 px-4 py-2 text-blue-700 hover:bg-blue-200">
            <Building className="h-4 w-4" />
            View Customer
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-3 space-y-6">
          {/* Quotation Details */}
          <div className="bg-white rounded-lg border p-6">
            <h2 className="text-lg font-semibold mb-4">Quotation Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-500">Quotation Date</p>
                <p className="text-gray-900">
                  {new Date(quotation.quotationDate || quotation.createdAt).toLocaleDateString()}
                </p>
              </div>
              
              <div>
                <p className="text-sm text-gray-500">Valid Until</p>
                <p className="text-gray-900">
                  {quotation.validityPeriod ? 
                    new Date(quotation.validityPeriod).toLocaleDateString() : 
                    'Not specified'
                  }
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Payment Terms</p>
                <p className="text-gray-900">{quotation.paymentTerms ?? 'Not specified'}</p>
              </div>
            </div>

            {quotation.deliverySchedule && (
              <div className="mt-4">
                <p className="text-sm text-gray-500">Delivery Schedule</p>
                <p className="text-gray-900">{quotation.deliverySchedule}</p>
              </div>
            )}

            {quotation.specialInstructions && (
              <div className="mt-4">
                <p className="text-sm text-gray-500">Special Instructions</p>
                <div className="mt-2 p-3 bg-gray-50 rounded-md">
                  <p className="text-gray-900 whitespace-pre-wrap">
                    {quotation.specialInstructions}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Line Items */}
          <div className="bg-white rounded-lg border p-6">
            <h2 className="text-lg font-semibold mb-4">Quoted Items</h2>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="p-3 text-left text-sm font-medium text-gray-900">Description</th>
                    <th className="p-3 text-left text-sm font-medium text-gray-900">Specifications</th>
                    <th className="p-3 text-right text-sm font-medium text-gray-900">Quantity</th>
                    <th className="p-3 text-right text-sm font-medium text-gray-900">Unit Price</th>
                    <th className="p-3 text-right text-sm font-medium text-gray-900">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {quotation.items?.map((item: QuotationItem) => (
                    <tr key={item.id} className="border-b">
                      <td className="p-3 text-gray-900">
                        {item.materialDescription}
                      </td>
                      <td className="p-3 text-gray-500 text-sm">
                        {item.specifications ?? '-'}
                      </td>
                      <td className="p-3 text-right">
                        {item.quantity}
                      </td>
                      <td className="p-3 text-right">
                        {formatCurrency(Number(item.pricePerUnit))}
                      </td>
                      <td className="p-3 text-right text-gray-900">
                        {formatCurrency(Number(item.total))}
                      </td>
                    </tr>
                  )) || (
                    <tr>
                      <td colSpan={5} className="text-center py-4 text-gray-500">
                        No line items available
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="mt-6 flex justify-end">
              <div className="w-80 space-y-2">
                <div className="border-t pt-2">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>{formatCurrency(Number(quotation.subtotal) ?? 0)}</span>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span>Tax (10%):</span>
                                      <span>{formatCurrency(Number(quotation.tax) ?? 0)}</span>
                </div>
                <div className="border-t pt-2">
                  <div className="flex justify-between text-lg font-semibold">
                    <span>Total:</span>
                    <span>{formatCurrency(Number(quotation.totalValue) ?? 0)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status Management */}
          <div className="bg-white rounded-lg border p-6">
            <h3 className="text-lg font-semibold mb-4">Status Management</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Current Status</span>
                {getStatusBadge(quotation.status)}
              </div>
              
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Update Status</label>
                <select 
                  value={quotation.status} 
                  onChange={(e) => handleStatusUpdate(e.target.value)}
                  disabled={updating}
                  className="w-full rounded-md border border-gray-300 p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="DRAFT">Draft</option>
                  <option value="LIVE">Live</option>
                  <option value="SUBMITTED">Submitted</option>
                  <option value="WON">Won</option>
                  <option value="LOST">Lost</option>
                  <option value="RECEIVED">Received</option>
                </select>
              </div>

              {quotation.lostReason && (
                <div>
                  <p className="text-sm text-gray-500">Lost Reason</p>
                  <p className="text-red-600 text-sm">{quotation.lostReason}</p>
                </div>
              )}
            </div>
          </div>

          {/* Quick Info */}
          <div className="bg-white rounded-lg border p-6">
            <h3 className="text-lg font-semibold mb-4">Summary</h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Total Value</p>
                <p className="text-xl text-gray-900">
                  {formatCurrency(Number(quotation.totalValue) || 0)}
                </p>
              </div>
              
              <div>
                <p className="text-sm text-gray-500">Items Count</p>
                <p className="text-gray-900">{quotation.items?.length || 0} items</p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Currency</p>
                <p className="text-gray-900">{quotation.currency || 'USD'}</p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Quotation ID</p>
                <p className="text-xs text-gray-600 font-mono">
                  #{quotation.id?.substring(0, 8)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Lost Reason Modal */}
      {showLostReasonModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center space-x-2 mb-4">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              <h3 className="text-lg font-semibold">Mark as Lost</h3>
            </div>
            <p className="text-gray-600 mb-4">
              Please select a reason for marking this quotation as lost. This information helps improve future quotations.
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Lost Reason *</label>
                <select 
                  value={lostReason} 
                  onChange={(e) => setLostReason(e.target.value)}
                  className="w-full rounded-md border border-gray-300 p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Select a reason</option>
                  <option value="Price too high">Price too high</option>
                  <option value="Timeline issues">Timeline issues</option>
                  <option value="Technical requirements not met">Technical requirements not met</option>
                  <option value="Customer chose competitor">Customer chose competitor</option>
                  <option value="Project cancelled">Project cancelled</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <button 
                  onClick={() => setShowLostReasonModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleLostReasonSubmit} 
                  disabled={!lostReason || updating}
                  className="px-4 py-2 text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50"
                >
                  {updating ? 'Updating...' : 'Mark as Lost'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PO Upload Modal */}
      {showPOUpload && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center space-x-2 mb-4">
              <Upload className="h-5 w-5 text-green-500" />
              <h3 className="text-lg font-semibold">Upload Purchase Order</h3>
            </div>
            <p className="text-gray-600 mb-4">
              Please upload the purchase order received from the customer.
            </p>
            <div className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <div className="mb-4">
                  <label htmlFor="po-upload" className="cursor-pointer">
                    <span className="block text-sm text-gray-600 mb-2">
                      <button 
                        type="button" 
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                      >
                        Choose PO file
                      </button>
                    </span>
                    <input
                      id="po-upload"
                      name="po-upload"
                      type="file"
                      className="hidden"
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    />
                  </label>
                  <p className="text-xs text-gray-500">
                    PDF, DOC, or image files
                  </p>
                </div>
              </div>
              
              <div className="flex justify-end">
                <button 
                  onClick={() => setShowPOUpload(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Skip for now
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
