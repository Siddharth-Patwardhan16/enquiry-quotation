'use client';

import { useState } from 'react';
import { api } from '@/trpc/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FileText, Building, CheckCircle } from 'lucide-react';
import { useToastContext } from '@/components/providers/ToastProvider';

interface EnquiryStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  enquiryId: number;
  newStatus: 'WON';
  onSuccess?: () => void;
}

export function EnquiryStatusModal({ 
  isOpen, 
  onClose, 
  enquiryId, 
  newStatus,
  onSuccess 
}: EnquiryStatusModalProps) {
  const [purchaseOrderNumber, setPurchaseOrderNumber] = useState('');
  const [poValue, setPoValue] = useState('');
  const [poDate, setPoDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { success, error: showError } = useToastContext();

  // Fetch enquiry details
  const { data: enquiries } = api.enquiry.getAll.useQuery();
  const enquiry = enquiries?.find((e) => e.id === enquiryId);

  const updateEnquiryMutation = api.enquiry.updateStatus.useMutation({
    onSuccess: () => {
      success('Status Updated', `Enquiry status has been updated to ${newStatus} with PO details.`);
      setIsSubmitting(false);
      onSuccess?.();
      onClose();
      // Reset form
      setPurchaseOrderNumber('');
      setPoValue('');
      setPoDate('');
    },
    onError: (error) => {
      showError('Update Failed', `Failed to update enquiry status: ${error.message}`);
      setIsSubmitting(false);
    },
  });

  const handleStatusUpdate = () => {
    if (!purchaseOrderNumber) {
      showError('Validation Error', 'Please enter Purchase Order Number.');
      return;
    }
    if (!poValue) {
      showError('Validation Error', 'Please enter PO Value.');
      return;
    }
    if (!poDate) {
      showError('Validation Error', 'Please enter PO Date.');
      return;
    }

    const poValueNum = parseFloat(poValue);
    if (isNaN(poValueNum) || poValueNum <= 0) {
      showError('Validation Error', 'Please enter a valid PO Value (must be a positive number).');
      return;
    }

    setIsSubmitting(true);
    updateEnquiryMutation.mutate({
      id: enquiryId,
      status: newStatus,
      purchaseOrderNumber,
      poValue: poValueNum,
      poDate,
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
            <CheckCircle className="w-5 h-5 text-green-600" />
            Update Status to WON - Purchase Order Details
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

          {/* PO Fields */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="purchaseOrderNumber" className="text-sm font-medium text-gray-700">
                Purchase Order Number <span className="text-red-500">*</span>
              </Label>
              <Input
                id="purchaseOrderNumber"
                type="text"
                value={purchaseOrderNumber}
                onChange={(e) => setPurchaseOrderNumber(e.target.value)}
                className="mt-2"
                placeholder="Enter PO Number"
                required
              />
            </div>

            <div>
              <Label htmlFor="poValue" className="text-sm font-medium text-gray-700">
                PO Value <span className="text-red-500">*</span>
              </Label>
              <Input
                id="poValue"
                type="number"
                step="0.01"
                min="0"
                value={poValue}
                onChange={(e) => setPoValue(e.target.value)}
                className="mt-2"
                placeholder="Enter PO Value"
                required
              />
              <p className="mt-1 text-sm text-gray-500">Enter the purchase order value</p>
            </div>

            <div>
              <Label htmlFor="poDate" className="text-sm font-medium text-gray-700">
                PO Date <span className="text-red-500">*</span>
              </Label>
              <Input
                id="poDate"
                type="date"
                value={poDate}
                onChange={(e) => setPoDate(e.target.value)}
                className="mt-2"
                required
              />
              <p className="mt-1 text-sm text-gray-500">Date of the purchase order</p>
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
              disabled={!purchaseOrderNumber || !poValue || !poDate || isSubmitting}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="w-4 h-4" />
              {isSubmitting ? 'Updating...' : 'Update Status to WON'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

