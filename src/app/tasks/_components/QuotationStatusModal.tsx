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
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { success, error: showError } = useToast();

  // Fetch quotation details
  const { data: quotation, isLoading } = api.tasks.getQuotationDetails.useQuery(
    { quotationId },
    { enabled: isOpen && !!quotationId }
  );

  // Update status mutation
  const updateStatusMutation = api.tasks.updateQuotationStatus.useMutation({
    onSuccess: () => {
      success('Status Updated', 'Quotation status has been updated successfully.');
      setIsSubmitting(false);
      onSuccess?.();
      onClose();
      // Reset form
      setStatus('');
      setLostReason('');
      setPurchaseOrderNumber('');
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
      status: status as 'DRAFT' | 'LIVE' | 'SUBMITTED' | 'WON' | 'LOST' | 'RECEIVED',
      lostReason: lostReason || undefined,
      purchaseOrderNumber: purchaseOrderNumber || undefined,
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
      case 'SUBMITTED': return 'bg-purple-100 text-purple-800';
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
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Update Quotation Status
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Quotation Details */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quotation Details</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">Quotation #:</span>
                  <span className="text-sm text-gray-900">{quotation.quotationNumber}</span>
                </div>

                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">Customer:</span>
                  <span className="text-sm text-gray-900">{quotation.enquiry.customer.name}</span>
                </div>

                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">Date:</span>
                  <span className="text-sm text-gray-900">{formatDate(quotation.quotationDate)}</span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">Total Value:</span>
                  <span className="text-sm text-gray-900">
                    {quotation.totalValue ? formatCurrency(Number(quotation.totalValue)) : 'N/A'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-700">Current Status:</span>
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(quotation.status)}`}>
                    {getStatusIcon(quotation.status)}
                    {quotation.status}
                  </span>
                </div>

                {quotation.validityPeriod && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">Valid Until:</span>
                    <span className="text-sm text-gray-900">{formatDate(quotation.validityPeriod)}</span>
                  </div>
                )}
              </div>
            </div>

            {quotation.enquiry.subject && (
              <div className="mt-4">
                <span className="text-sm font-medium text-gray-700">Subject:</span>
                <p className="text-sm text-gray-900 mt-1">{quotation.enquiry.subject}</p>
              </div>
            )}
          </div>

          {/* Status Update Section */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Update Status</h3>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="status">New Status *</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select new status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DRAFT">Draft</SelectItem>
                    <SelectItem value="LIVE">Live</SelectItem>
                    <SelectItem value="SUBMITTED">Submitted</SelectItem>
                    <SelectItem value="WON">Won</SelectItem>
                    <SelectItem value="LOST">Lost</SelectItem>
                    <SelectItem value="RECEIVED">Received (PO)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {status === 'LOST' && (
                <div>
                  <Label htmlFor="lostReason">Reason for Loss *</Label>
                  <Select value={lostReason} onValueChange={setLostReason}>
                    <SelectTrigger className="mt-1">
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
              )}

              {status === 'RECEIVED' && (
                <div>
                  <Label htmlFor="purchaseOrderNumber">Purchase Order Number *</Label>
                  <Input
                    id="purchaseOrderNumber"
                    value={purchaseOrderNumber}
                    onChange={(e) => setPurchaseOrderNumber(e.target.value)}
                    placeholder="Enter PO number"
                    className="mt-1"
                  />
                </div>
              )}

              <div>
                <Label htmlFor="notes">Additional Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Enter any additional notes..."
                  rows={3}
                  className="mt-1"
                />
              </div>
            </div>
          </div>

          {/* Quick Status Actions */}
          <div className="bg-green-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <Button
                variant="outline"
                onClick={() => setStatus('WON')}
                className="w-full text-green-700 border-green-300 hover:bg-green-50"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Mark as Won
              </Button>

              <Button
                variant="outline"
                onClick={() => setStatus('LOST')}
                className="w-full text-red-700 border-red-300 hover:bg-red-50"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Mark as Lost
              </Button>

              <Button
                variant="outline"
                onClick={() => setStatus('RECEIVED')}
                className="w-full text-blue-700 border-blue-300 hover:bg-blue-50"
              >
                <FileText className="h-4 w-4 mr-2" />
                Mark as Received
              </Button>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 pt-6 border-t">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button 
            onClick={handleStatusUpdate} 
            disabled={isSubmitting || !status}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isSubmitting ? 'Updating...' : 'Update Status'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
