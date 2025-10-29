'use client';

import { useState } from 'react';
import { api } from '@/trpc/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Calendar, DollarSign, User, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { useToast } from '@/components/ui/toast';

interface QuotationStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  quotationId: string;
  onSuccess?: () => void;
}

export function QuotationStatusModal({ 
  isOpen, 
  onClose, 
  quotationId, 
  onSuccess 
}: QuotationStatusModalProps) {
  const [status, setStatus] = useState('');
  const [lostReason, setLostReason] = useState('');
  const [purchaseOrderNumber, setPurchaseOrderNumber] = useState('');
  const [poValue, setPoValue] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { success, error: showError } = useToast();

  // Fetch quotation details
  const { data: quotation, isLoading } = api.tasks.getQuotationDetails.useQuery(
    { quotationId },
    { enabled: isOpen && !!quotationId }
  );

  // Update status mutation
  const updateStatusMutation = api.quotation.updateStatus.useMutation({
    onSuccess: () => {
      success('Status Updated', 'Quotation status has been updated successfully.');
      setIsSubmitting(false);
      onSuccess?.();
      onClose();
      // Reset form
      setStatus('');
      setLostReason('');
      setPurchaseOrderNumber('');
      setPoValue('');
      setNotes('');
    },
    onError: (error) => {
      showError('Update Failed', `Failed to update quotation status: ${error.message}`);
      setIsSubmitting(false);
    },
  });

  const handleStatusUpdate = () => {
    if (!status) {
      showError('Validation Error', 'Please select a status.');
      return;
    }

    if (status === 'LOST' && !lostReason) {
      showError('Validation Error', 'Please provide a reason for losing the quotation.');
      return;
    }

    if (status === 'RECEIVED' && !purchaseOrderNumber) {
      showError('Validation Error', 'Please provide the purchase order number.');
      return;
    }


    setIsSubmitting(true);
    updateStatusMutation.mutate({
      quotationId,
      status: status as 'LIVE' | 'WON' | 'LOST' | 'BUDGETARY' | 'DEAD',
      lostReason: lostReason as 'PRICE' | 'DELIVERY_SCHEDULE' | 'LACK_OF_CONFIDENCE' | 'OTHER' | undefined,
      purchaseOrderNumber: purchaseOrderNumber || undefined,
      poValue: poValue ? parseFloat(poValue) : undefined,
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'WON': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'LOST': return <XCircle className="h-4 w-4 text-red-600" />;
      case 'RECEIVED': return <CheckCircle className="h-4 w-4 text-blue-600" />;
      default: return <FileText className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'bg-gray-100 text-gray-800';
      case 'LIVE': return 'bg-blue-100 text-blue-800';
      case 'WON': return 'bg-green-100 text-green-800';
      case 'LOST': return 'bg-red-100 text-red-800';
      case 'RECEIVED': return 'bg-indigo-100 text-indigo-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(new Date(date));
  };

  if (isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!quotation) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl">
          <div className="text-center py-8">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Quotation Not Found</h3>
            <p className="text-gray-600">The requested quotation could not be found.</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-4 border-b border-gray-200">
          <DialogTitle className="flex items-center gap-3 text-xl font-bold text-gray-800">
            <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg">
              <FileText className="h-6 w-6 text-white" />
            </div>
            Update Quotation Status
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Quotation Details */}
          <div className="bg-white rounded-lg border shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Quotation Details</h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <FileText className="h-4 w-4 text-purple-600" />
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-700">Quotation #:</span>
                      <p className="text-sm text-gray-900 font-medium">{quotation.quotationNumber}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <User className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-700">Customer:</span>
                      <p className="text-sm text-gray-900 font-medium">{quotation.enquiry?.customer?.name ?? 'Unknown Customer'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Calendar className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-700">Date:</span>
                      <p className="text-sm text-gray-900 font-medium">{formatDate(quotation.quotationDate)}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-yellow-100 rounded-lg">
                      <DollarSign className="h-4 w-4 text-yellow-600" />
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-700">Total Value:</span>
                      <p className="text-sm text-gray-900 font-medium">
                        {quotation.totalValue ? formatCurrency(Number(quotation.totalValue)) : 'N/A'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <span className="text-sm font-medium text-gray-700">Current Status:</span>
                    </div>
                    <div>
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(quotation.status)}`}>
                        {getStatusIcon(quotation.status)}
                        {quotation.status}
                      </span>
                    </div>
                  </div>

                  {quotation.validityPeriod && (
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-red-100 rounded-lg">
                        <Calendar className="h-4 w-4 text-red-600" />
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-700">Valid Until:</span>
                        <p className="text-sm text-gray-900 font-medium">{formatDate(quotation.validityPeriod)}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {quotation.enquiry?.subject && (
                <div className="mt-6 p-4 bg-gray-50 rounded-md">        
                  <span className="text-sm font-medium text-gray-700">Subject:</span>                                                                   
                  <p className="text-sm text-gray-900 mt-1 font-medium">{quotation.enquiry.subject}</p>
                </div>
              )}
            </div>
          </div>

          {/* Status Update Section */}
          <div className="bg-white rounded-lg border shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200 bg-blue-50">
              <h3 className="text-lg font-semibold text-gray-900">Update Status</h3>
            </div>
            <div className="p-6">
              <div className="space-y-6">
                <div>
                  <Label htmlFor="status" className="text-sm font-medium text-gray-700">
                    New Status <span className="text-red-500">*</span>
                  </Label>
                  <div className="mt-2">
                    <Select value={status} onValueChange={setStatus}>
                      <SelectTrigger className="w-full rounded-md border border-gray-300 p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                        <SelectValue placeholder="Select new status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DRAFT">Draft</SelectItem>
                        <SelectItem value="LIVE">Live</SelectItem>
                        <SelectItem value="WON">Won</SelectItem>
                        <SelectItem value="LOST">Lost</SelectItem>
                        <SelectItem value="RECEIVED">Received (PO)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {status === 'LOST' && (
                  <div>
                    <Label htmlFor="lostReason" className="text-sm font-medium text-gray-700">
                      Reason for Loss <span className="text-red-500">*</span>
                    </Label>
                    <div className="mt-2">
                      <Select value={lostReason} onValueChange={setLostReason}>
                        <SelectTrigger className="w-full rounded-md border border-gray-300 p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                          <SelectValue placeholder="Select reason" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PRICE">Price</SelectItem>
                          <SelectItem value="DELIVERY_SCHEDULE">Delivery Schedule</SelectItem>
                          <SelectItem value="LACK_OF_CONFIDENCE">Lack of Confidence</SelectItem>
                          <SelectItem value="OTHER">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                {status === 'RECEIVED' && (
                  <div>
                    <Label htmlFor="purchaseOrderNumber" className="text-sm font-medium text-gray-700">
                      Purchase Order Number <span className="text-red-500">*</span>
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
                )}

                {status === 'WON' && (
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
                  </div>
                )}

                <div>
                  <Label htmlFor="notes" className="text-sm font-medium text-gray-700">
                    Additional Notes (Optional)
                  </Label>
                  <div className="mt-2">
                    <Textarea
                      id="notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Enter any additional notes..."
                      rows={3}
                      className="w-full rounded-md border border-gray-300 p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Status Actions */}
          <div className="bg-white rounded-lg border shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200 bg-green-50">
              <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button
                  variant="outline"
                  onClick={() => setStatus('WON')}
                  className="w-full h-12 text-green-700 border-green-300 hover:bg-green-50 hover:border-green-400"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Mark as Won
                </Button>

                <Button
                  variant="outline"
                  onClick={() => setStatus('LOST')}
                  className="w-full h-12 text-red-700 border-red-300 hover:bg-red-50 hover:border-red-400"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Mark as Lost
                </Button>

                <Button
                  variant="outline"
                  onClick={() => setStatus('RECEIVED')}
                  className="w-full h-12 text-blue-700 border-blue-300 hover:bg-blue-50 hover:border-blue-400"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Mark as Received
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
          <Button 
            variant="outline" 
            onClick={onClose} 
            disabled={isSubmitting}
            className="px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleStatusUpdate} 
            disabled={isSubmitting || !status}
            className="px-6 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {isSubmitting ? 'Updating...' : 'Update Status'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
