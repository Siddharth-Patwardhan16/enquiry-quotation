'use client';

import { useState } from 'react';
import { api } from '@/trpc/client';
import type { AppRouter } from '@/server/api/root';
import type { inferRouterOutputs } from '@trpc/server';

type Quotation = inferRouterOutputs<AppRouter>['quotation']['getAll'][0];

export function QuotationStatusUpdater({ quotation }: { quotation: Quotation }) {
  const utils = api.useUtils();
  const [currentStatus, setCurrentStatus] = useState(quotation.status);

  const updateStatusMutation = api.quotation.updateStatus.useMutation({
    onSuccess: () => {
      // Refresh the quotation list after a successful update
      utils.quotation.getAll.invalidate();
      alert('Status updated successfully!');
    },
    onError: (error) => {
      alert(`Error: ${error.message}`);
      // Revert the UI back to the original status if the API call fails
      setCurrentStatus(quotation.status);
    },
  });

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value as Quotation['status'];
    setCurrentStatus(newStatus);

    if (newStatus === 'LOST') {
      const reason = prompt("Why was this quotation lost?\n\nOptions:\n- PRICE\n- DELIVERY_SCHEDULE\n- LACK_OF_CONFIDENCE\n- OTHER\n\nPlease enter one of the above options:");
      if (reason && ['PRICE', 'DELIVERY_SCHEDULE', 'LACK_OF_CONFIDENCE', 'OTHER'].includes(reason.toUpperCase())) {
        updateStatusMutation.mutate({ 
          quotationId: quotation.id, 
          status: newStatus, 
          lostReason: reason.toUpperCase() as any 
        });
      } else {
        setCurrentStatus(quotation.status); // Revert if user cancels or enters invalid reason
      }
    } else if (newStatus === 'WON' || newStatus === 'RECEIVED') {
      const poNumber = prompt("Please enter the Purchase Order (PO) Number:");
      if (poNumber && poNumber.trim()) {
        updateStatusMutation.mutate({ 
          quotationId: quotation.id, 
          status: newStatus, 
          purchaseOrderNumber: poNumber.trim() 
        });
      } else {
        setCurrentStatus(quotation.status); // Revert if user cancels or enters empty PO
      }
    } else {
      updateStatusMutation.mutate({ quotationId: quotation.id, status: newStatus });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'bg-gray-100 text-gray-800 border-gray-300';
      case 'PENDING': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'SUBMITTED': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'WON': return 'bg-green-100 text-green-800 border-green-300';
      case 'LOST': return 'bg-red-100 text-red-800 border-red-300';
      case 'RECEIVED': return 'bg-purple-100 text-purple-800 border-purple-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'DRAFT': return '📝';
      case 'PENDING': return '⏳';
      case 'SUBMITTED': return '📤';
      case 'WON': return '🏆';
      case 'LOST': return '❌';
      case 'RECEIVED': return '📦';
      default: return '📄';
    }
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex items-center gap-2">
        <div className="text-lg">{getStatusIcon(currentStatus)}</div>
        <select
          value={currentStatus}
          onChange={handleStatusChange}
          disabled={updateStatusMutation.isPending}
          className={`rounded-md border-0 px-3 py-2 text-sm font-medium transition-colors focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
            getStatusColor(currentStatus)
          } ${updateStatusMutation.isPending ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        >
          <option value="DRAFT">Draft</option>
          <option value="LIVE">Live</option>
          <option value="SUBMITTED">Submitted</option>
          <option value="WON">Won</option>
          <option value="LOST">Lost</option>
          <option value="RECEIVED">Received</option>
        </select>
      </div>
      
      {updateStatusMutation.isPending && (
        <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
          Updating...
        </div>
      )}
      
      {/* Display additional info if available */}
      {quotation.lostReason && currentStatus === 'LOST' && (
        <div className="text-xs text-red-700 bg-red-100 border border-red-200 px-2 py-1 rounded-md">
          Reason: {quotation.lostReason}
        </div>
      )}
      
      {quotation.purchaseOrderNumber && (currentStatus === 'WON' || currentStatus === 'RECEIVED') && (
        <div className="text-xs text-green-700 bg-green-100 border border-green-200 px-2 py-1 rounded-md">
          PO: {quotation.purchaseOrderNumber}
        </div>
      )}
    </div>
  );
}
