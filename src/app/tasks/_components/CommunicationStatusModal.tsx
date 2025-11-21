'use client';

import { useState, useEffect } from 'react';
import { api } from '@/trpc/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { MessageSquare, CheckCircle, XCircle, Clock, RotateCcw, AlertCircle, Trophy, Ban } from 'lucide-react';
import { useToast } from '@/components/ui/toast';

interface CommunicationStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  communicationId: string;
  onSuccess?: () => void;
}

export function CommunicationStatusModal({ 
  isOpen, 
  onClose, 
  communicationId, 
  onSuccess 
}: CommunicationStatusModalProps) {
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { success, error: showError } = useToast();

  // Fetch communication details
  const { data: communication, isLoading } = api.tasks.getCommunicationDetails.useQuery(
    { communicationId },
    { enabled: isOpen && !!communicationId }
  );

  // Initialize description from communication data
  useEffect(() => {
    if (communication?.description) {
      setDescription(communication.description);
    } else {
      setDescription('');
    }
  }, [communication]);

  // Update status mutation
  const updateStatusMutation = api.communication.updateStatus.useMutation({
    onSuccess: () => {
      success('Status Updated', 'Communication status has been successfully updated.');
      setIsSubmitting(false);
      onSuccess?.();
      onClose();
      // Reset form
      setSelectedStatus('');
      setDescription('');
    },
    onError: (error) => {
      showError('Update Failed', `Failed to update status: ${error.message}`);
      setIsSubmitting(false);
    },
  });

  const handleStatusUpdate = () => {
    // Status is optional - can update just description
    if (!selectedStatus && !description.trim()) {
      showError('Validation Error', 'Please update either the status or description.');
      return;
    }

    setIsSubmitting(true);
    updateStatusMutation.mutate({
      id: communicationId,
      status: selectedStatus ? (selectedStatus as 'SCHEDULED' | 'COMPLETED' | 'CANCELLED' | 'RESCHEDULED' | 'FOLLOW_UP_REQUIRED' | 'WON' | 'LOST') : undefined,
      description: description || undefined,
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'SCHEDULED': return <Clock className="h-4 w-4" />;
      case 'COMPLETED': return <CheckCircle className="h-4 w-4" />;
      case 'CANCELLED': return <XCircle className="h-4 w-4" />;
      case 'RESCHEDULED': return <RotateCcw className="h-4 w-4" />;
      case 'FOLLOW_UP_REQUIRED': return <AlertCircle className="h-4 w-4" />;
      case 'WON': return <Trophy className="h-4 w-4" />;
      case 'LOST': return <Ban className="h-4 w-4" />;
      default: return <MessageSquare className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SCHEDULED': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'COMPLETED': return 'text-green-600 bg-green-50 border-green-200';
      case 'CANCELLED': return 'text-red-600 bg-red-50 border-red-200';
      case 'RESCHEDULED': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'FOLLOW_UP_REQUIRED': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'WON': return 'text-emerald-600 bg-emerald-50 border-emerald-200';
      case 'LOST': return 'text-gray-600 bg-gray-50 border-gray-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const statusOptions = [
    { value: 'SCHEDULED', label: 'Scheduled', description: 'Communication is scheduled' },
    { value: 'COMPLETED', label: 'Completed', description: 'Communication has been completed' },
    { value: 'CANCELLED', label: 'Cancelled', description: 'Communication was cancelled' },
    { value: 'RESCHEDULED', label: 'Rescheduled', description: 'Communication was rescheduled' },
    { value: 'FOLLOW_UP_REQUIRED', label: 'Follow-up Required', description: 'Follow-up action needed' },
    { value: 'WON', label: 'Won', description: 'Communication resulted in a win' },
    { value: 'LOST', label: 'Lost', description: 'Communication did not result in success' },
  ];

  if (isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Update Communication Status
            </DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!communication) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Update Communication Status
            </DialogTitle>
          </DialogHeader>
          <div className="text-center py-8">
            <p className="text-gray-500">Communication not found</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-4 border-b border-gray-200">
          <DialogTitle className="flex items-center gap-3 text-xl font-bold text-gray-800">
            <div className="p-2 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-lg">
              <MessageSquare className="h-6 w-6 text-white" />
            </div>
            Update Communication Status
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 overflow-x-hidden">
          {/* Current Communication Details */}
          <div className="bg-white rounded-lg border shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Communication Details</h3>
            </div>
            <div className="p-4 sm:p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-4 min-w-0">
                  <div>
                    <span className="text-sm font-medium text-gray-700">Subject:</span>
                    <p className="text-sm text-gray-900 mt-1 font-medium break-words">{communication.subject || 'N/A'}</p>
                  </div>

                  <div>
                    <span className="text-sm font-medium text-gray-700">Customer:</span>
                    <p className="text-sm text-gray-900 mt-1 font-medium break-words">{communication.customer?.name ?? communication.company?.name ?? 'Unknown Customer'}</p>
                  </div>

                  <div>
                    <span className="text-sm font-medium text-gray-700">Type:</span>
                    <p className="text-sm text-gray-900 mt-1 font-medium">{communication.type}</p>
                  </div>
                </div>

                <div className="space-y-4 min-w-0">
                  <div>
                    <span className="text-sm font-medium text-gray-700">Current Status:</span>
                    <div className="mt-2">
                      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(communication.status)}`}>
                        {getStatusIcon(communication.status)}
                        {communication.status}
                      </div>
                    </div>
                  </div>

                  <div>
                    <span className="text-sm font-medium text-gray-700">Description:</span>
                    <p className="text-sm text-gray-900 mt-1 font-medium break-words whitespace-pre-wrap">{communication.description || 'N/A'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Status Selection */}
          <div className="bg-white rounded-lg border shadow-sm">
            <div className="px-4 sm:px-6 py-4 border-b border-gray-200 bg-emerald-50">
              <h3 className="text-lg font-semibold text-gray-900">Select New Status (Optional)</h3>
              <p className="text-sm text-gray-500 mt-1">Optionally choose a new status for this communication</p>
            </div>
            <div className="p-4 sm:p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {statusOptions.map((option) => (
                  <label
                    key={option.value}
                    htmlFor={`status-${option.value}`}
                    className={`relative flex items-start p-3 sm:p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-all min-w-0 ${
                      selectedStatus === option.value 
                        ? 'border-blue-500 bg-blue-50 shadow-sm' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={(e) => {
                      e.preventDefault();
                      setSelectedStatus(option.value === selectedStatus ? '' : option.value);
                    }}
                  >
                    <input
                      type="radio"
                      id={`status-${option.value}`}
                      name="status"
                      value={option.value}
                      checked={selectedStatus === option.value}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedStatus(option.value);
                        } else {
                          setSelectedStatus('');
                        }
                      }}
                      className="sr-only"
                    />
                    <div className="flex items-start space-x-3 w-full min-w-0">
                      <div className="flex-shrink-0 mt-0.5">
                        <div className={`w-5 h-5 border-2 rounded-full flex items-center justify-center transition-colors ${
                          selectedStatus === option.value 
                            ? 'bg-blue-600 border-blue-600' 
                            : 'border-gray-300'
                        }`}>
                          <div className={`w-2.5 h-2.5 bg-white rounded-full transition-opacity ${
                            selectedStatus === option.value ? 'opacity-100' : 'opacity-0'
                          }`}></div>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0 overflow-hidden">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="flex-shrink-0">
                            {getStatusIcon(option.value)}
                          </div>
                          <span className="text-sm font-medium text-gray-900 truncate">{option.label}</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2 break-words">{option.description}</p>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="bg-white rounded-lg border shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Description</h3>
            </div>
            <div className="p-4 sm:p-6">
              <Label htmlFor="description" className="text-sm font-medium text-gray-700">
                Communication Description
              </Label>
              <div className="mt-2">
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Update the communication description..."
                  className="w-full rounded-md border border-gray-300 p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[100px] resize-y max-h-[200px]"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t border-gray-200">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              className="w-full sm:w-auto px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Cancel
            </Button>
            <Button
              onClick={handleStatusUpdate}
              disabled={isSubmitting || (!selectedStatus && !description.trim())}
              className="w-full sm:w-auto px-6 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {isSubmitting ? 'Updating...' : 'Update'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
