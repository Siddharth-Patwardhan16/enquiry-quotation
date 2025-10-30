'use client';

import { useState } from 'react';
import { api } from '@/trpc/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FileText, Calendar, Building } from 'lucide-react';
import { useToastContext } from '@/components/providers/ToastProvider';

interface ReceiptDateModalProps {
  isOpen: boolean;
  onClose: () => void;
  enquiryId: number;
  onSuccess?: () => void;
}

export function ReceiptDateModal({ 
  isOpen, 
  onClose, 
  enquiryId, 
  onSuccess 
}: ReceiptDateModalProps) {
  const [receiptDate, setReceiptDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { success, error: showError } = useToastContext();

  // Fetch enquiry details
  const { data: enquiries } = api.enquiry.getAll.useQuery();
  const enquiry = enquiries?.find((e) => e.id === enquiryId);

  const updateEnquiryMutation = api.enquiry.updateStatusWithReceipt.useMutation({
    onSuccess: () => {
      success('Status Updated', 'Enquiry status has been updated to RCD with receipt date.');
      setIsSubmitting(false);
      onSuccess?.();
      onClose();
      // Reset form
      setReceiptDate('');
    },
    onError: (error) => {
      showError('Update Failed', `Failed to update enquiry status: ${error.message}`);
      setIsSubmitting(false);
    },
  });



  const handleStatusUpdate = () => {
    if (!receiptDate) {
      showError('Validation Error', 'Please enter receipt date.');
      return;
    }

    setIsSubmitting(true);
    updateEnquiryMutation.mutate({
      id: enquiryId,
      status: 'RCD',
      dateOfReceipt: receiptDate,
    });
  };

  if (!enquiry) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl">
          <div className="text-center py-8">
            <FileText className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Enquiry Not Found</h3>
            <p className="text-gray-600">The requested enquiry could not be found.</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            Update Status to RCD (Received) - Receipt Date
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Enquiry Summary */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <div className="flex items-start gap-3">
              <Building className="w-5 h-5 text-blue-600 mt-1" />
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 mb-2">Enquiry Details</h4>
                <div className="space-y-1 text-sm text-gray-700">
                  <p><span className="font-medium">Customer:</span> {enquiry.company?.name ?? 'Not specified'}</p>
                  <p><span className="font-medium">Location:</span> {enquiry.office?.name ?? enquiry.plant?.name ?? 'Not specified'}</p>
                  {enquiry.subject && (
                    <p><span className="font-medium">Subject:</span> {enquiry.subject}</p>
                  )}
                  {enquiry.quotationNumber && (
                    <p><span className="font-medium">Quotation #:</span> {enquiry.quotationNumber}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Receipt Date Input */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="receiptDate" className="text-sm font-medium text-gray-700">
                Receipt Date <span className="text-red-500">*</span>
              </Label>
              <Input
                id="receiptDate"
                type="date"
                value={receiptDate}
                onChange={(e) => setReceiptDate(e.target.value)}
                className="mt-2"
                required
              />
              <p className="mt-1 text-sm text-gray-500">Date when the order was received</p>
            </div>

          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleStatusUpdate}
              disabled={!receiptDate || isSubmitting}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
            >
              <Calendar className="w-4 h-4" />
              {isSubmitting ? 'Updating...' : 'Update Status to RCD'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

