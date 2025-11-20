'use client';

import { useState } from 'react';
import { api } from '@/trpc/client';
import type { AppRouter } from '@/server/api/root';
import type { inferRouterOutputs } from '@trpc/server';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DollarSign, Calendar, Shield, HelpCircle, AlertTriangle } from 'lucide-react';

type Quotation = inferRouterOutputs<AppRouter>['quotation']['getAll'][0];

export function QuotationStatusUpdater({ quotation }: { quotation: Quotation }) {
  const utils = api.useUtils();
  const [currentStatus, setCurrentStatus] = useState(quotation.status);
  const [showModal, setShowModal] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<Quotation['status'] | null>(null);
  const [lostReason, setLostReason] = useState('');
  const [purchaseOrderNumber, setPurchaseOrderNumber] = useState('');
  const [poValue, setPoValue] = useState('');
  const [poDate, setPoDate] = useState('');

  const updateStatusMutation = api.quotation.updateStatus.useMutation({
    onSuccess: () => {
      // Refresh the quotation list after a successful update
      utils.quotation.getAll.invalidate();
      setShowModal(false);
      setPendingStatus(null);
      setLostReason('');
      setPurchaseOrderNumber('');
      setPoValue('');
      setPoDate('');
      alert('Status updated successfully!');
    },
    onError: (error) => {
      alert(`Error: ${error.message}`);
      // Revert the UI back to the original status if the API call fails
      setCurrentStatus(quotation.status);
      setShowModal(false);
      setPendingStatus(null);
    },
  });

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value as Quotation['status'];
    setCurrentStatus(newStatus);

    if (newStatus === 'LOST' || newStatus === 'WON') {
      setPendingStatus(newStatus);
      setShowModal(true);
    } else {
      updateStatusMutation.mutate({ 
        quotationId: quotation.id, 
        status: newStatus as 'LIVE' | 'WON' | 'LOST' | 'BUDGETARY' | 'DEAD'
      });
    }
  };

  const handleModalSubmit = () => {
    if (pendingStatus === 'LOST' && !lostReason) {
      alert('Please provide a reason for losing the quotation.');
      return;
    }
    
    // PO Number is now optional for WON status
    // No validation needed for purchaseOrderNumber

    updateStatusMutation.mutate({
      quotationId: quotation.id,
      status: pendingStatus! as 'LIVE' | 'WON' | 'LOST' | 'BUDGETARY' | 'DEAD',
      lostReason: pendingStatus === 'LOST' ? lostReason as 'PRICE' | 'DELIVERY_SCHEDULE' | 'LACK_OF_CONFIDENCE' | 'OTHER' : undefined,
      purchaseOrderNumber: pendingStatus === 'WON' ? purchaseOrderNumber : undefined,
      poValue: pendingStatus === 'WON' && poValue ? parseFloat(poValue) : undefined,
      poDate: pendingStatus === 'WON' ? poDate : undefined,
    });
  };

  const handleModalCancel = () => {
    setCurrentStatus(quotation.status); // Revert to original status
    setShowModal(false);
    setPendingStatus(null);
    setLostReason('');
    setPurchaseOrderNumber('');
    setPoValue('');
    setPoDate('');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'bg-gray-100 text-gray-800 border-gray-300';
      case 'LIVE': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'WON': return 'bg-green-100 text-green-800 border-green-300';
      case 'LOST': return 'bg-red-100 text-red-800 border-red-300';
      case 'RECEIVED': return 'bg-purple-100 text-purple-800 border-purple-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'DRAFT': return '📝';
      case 'LIVE': return '⏳';
      case 'WON': return '🏆';
      case 'LOST': return '❌';
      case 'RECEIVED': return '📦';
      default: return '📄';
    }
  };

  return (
    <>
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
            <option value="LIVE">Live</option>
            <option value="WON">Won</option>
            <option value="LOST">Lost</option>
            <option value="BUDGETARY">Budgetary</option>
            <option value="RECEIVED">Received</option>
            <option value="DEAD">Dead</option>
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
        
        {quotation.purchaseOrderNumber && currentStatus === 'WON' && (
          <div className="text-xs text-green-700 bg-green-100 border border-green-200 px-2 py-1 rounded-md">
            PO: {quotation.purchaseOrderNumber}
            {quotation.poValue && (
              <span className="ml-2">
                (₹{quotation.poValue.toLocaleString()})
              </span>
            )}
          </div>
        )}
      </div>

      {/* Modal for LOST and WON status updates */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              {pendingStatus === 'LOST' && (
                <div className="p-2 bg-gradient-to-br from-orange-100 to-orange-50 rounded-xl shadow-sm border border-orange-200/50">
                  <AlertTriangle className="h-5 w-5 text-orange-600" />
                </div>
              )}
              <span className="text-xl font-bold tracking-tight">Update Status to {pendingStatus === 'LOST' ? 'Lost' : 'Won'}</span>
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {pendingStatus === 'LOST' && (
              <div>
                <Label htmlFor="lostReason" className="text-sm font-semibold text-gray-900 mb-2 block">
                  Reason for Loss <span className="text-red-500">*</span>
                </Label>
                <Select value={lostReason} onValueChange={setLostReason}>
                  <SelectTrigger className="w-full h-12 rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-900 hover:border-blue-300 hover:shadow-md focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all duration-200">
                    <SelectValue placeholder="Choose a reason..." />
                  </SelectTrigger>
                  <SelectContent className="z-[100] max-h-[260px] rounded-xl border-2 border-gray-200 shadow-xl bg-white">
                    <SelectItem 
                      value="PRICE" 
                      className="flex items-center gap-3 py-3.5 px-4 cursor-pointer hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 focus:bg-blue-50 transition-all duration-150 rounded-lg m-1"
                    >
                      <div className="p-1.5 bg-blue-100 rounded-lg">
                        <DollarSign className="h-4 w-4 text-blue-600" />
                      </div>
                      <span className="font-semibold text-gray-900">Price</span>
                    </SelectItem>
                    <SelectItem 
                      value="DELIVERY_SCHEDULE" 
                      className="flex items-center gap-3 py-3.5 px-4 cursor-pointer hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 focus:bg-blue-50 transition-all duration-150 rounded-lg m-1"
                    >
                      <div className="p-1.5 bg-blue-100 rounded-lg">
                        <Calendar className="h-4 w-4 text-blue-600" />
                      </div>
                      <span className="font-semibold text-gray-900">Delivery Schedule</span>
                    </SelectItem>
                    <SelectItem 
                      value="LACK_OF_CONFIDENCE" 
                      className="flex items-center gap-3 py-3.5 px-4 cursor-pointer hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 focus:bg-blue-50 transition-all duration-150 rounded-lg m-1"
                    >
                      <div className="p-1.5 bg-blue-100 rounded-lg">
                        <Shield className="h-4 w-4 text-blue-600" />
                      </div>
                      <span className="font-semibold text-gray-900">Lack of Confidence</span>
                    </SelectItem>
                    <SelectItem 
                      value="OTHER" 
                      className="flex items-center gap-3 py-3.5 px-4 cursor-pointer hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 focus:bg-blue-50 transition-all duration-150 rounded-lg m-1"
                    >
                      <div className="p-1.5 bg-blue-100 rounded-lg">
                        <HelpCircle className="h-4 w-4 text-blue-600" />
                      </div>
                      <span className="font-semibold text-gray-900">Other</span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {pendingStatus === 'WON' && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="purchaseOrderNumber" className="text-sm font-medium text-gray-700">
                    Purchase Order Number <span className="text-gray-500">(Optional)</span>
                  </Label>
                  <div className="mt-2">
                    <Input
                      id="purchaseOrderNumber"
                      value={purchaseOrderNumber}
                      onChange={(e) => setPurchaseOrderNumber(e.target.value)}
                      placeholder="Enter PO number"
                      className="w-full rounded-md border border-gray-300 p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="poValue" className="text-sm font-medium text-gray-700">
                    PO Value (Amount) <span className="text-gray-500">(Optional)</span>
                  </Label>
                  <div className="mt-2">
                    <Input
                      id="poValue"
                      type="number"
                      step="0.01"
                      value={poValue}
                      onChange={(e) => setPoValue(e.target.value)}
                      placeholder="Enter PO value/amount"
                      className="w-full rounded-md border border-gray-300 p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="poDate" className="text-sm font-medium text-gray-700">
                    PO Date <span className="text-gray-500">(Optional)</span>
                  </Label>
                  <div className="mt-2">
                    <Input
                      id="poDate"
                      type="date"
                      value={poDate}
                      onChange={(e) => setPoDate(e.target.value)}
                      className="w-full rounded-md border border-gray-300 p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                variant="outline"
                onClick={handleModalCancel}
                disabled={updateStatusMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                onClick={handleModalSubmit}
                disabled={updateStatusMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {updateStatusMutation.isPending ? 'Updating...' : 'Update Status'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}