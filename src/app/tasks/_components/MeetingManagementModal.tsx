'use client';

import { useState } from 'react';
import { api } from '@/trpc/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar, Video, Phone, Mail, Building, MapPin, User, AlertCircle } from 'lucide-react';
import { useToast } from '@/components/ui/toast';

interface MeetingManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  communicationId: string;
  onSuccess?: () => void;
}

export function MeetingManagementModal({ 
  isOpen, 
  onClose, 
  communicationId, 
  onSuccess 
}: MeetingManagementModalProps) {
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { success, error: showError } = useToast();

  // Fetch communication details
  const { data: communication, isLoading } = api.tasks.getCommunicationDetails.useQuery(
    { communicationId },
    { enabled: isOpen && !!communicationId }
  );

  // Reschedule mutation
  const rescheduleMutation = api.tasks.rescheduleCommunication.useMutation({
    onSuccess: () => {
      success('Meeting Rescheduled', 'The meeting has been successfully rescheduled.');
      setIsSubmitting(false);
      onSuccess?.();
      onClose();
      // Reset form
      setNewDate('');
      setNewTime('');
      setReason('');
    },
    onError: (error) => {
      showError('Reschedule Failed', `Failed to reschedule meeting: ${error.message}`);
      setIsSubmitting(false);
    },
  });

  const handleReschedule = () => {
    if (!newDate) {
      showError('Validation Error', 'Please select a new date for the meeting.');
      return;
    }

    setIsSubmitting(true);
    rescheduleMutation.mutate({
      communicationId,
      newDate,
      newTime: newTime || undefined,
      reason: reason || undefined,
    });
  };

  const getCommunicationTypeIcon = (type: string) => {
    switch (type) {
      case 'TELEPHONIC': return <Phone className="h-4 w-4" />;
      case 'VIRTUAL_MEETING': return <Video className="h-4 w-4" />;
      case 'EMAIL': return <Mail className="h-4 w-4" />;
      case 'PLANT_VISIT': return <Building className="h-4 w-4" />;
      case 'OFFICE_VISIT': return <MapPin className="h-4 w-4" />;
      default: return <Phone className="h-4 w-4" />;
    }
  };

  const getCommunicationTypeLabel = (type: string) => {
    switch (type) {
      case 'TELEPHONIC': return 'Phone Call';
      case 'VIRTUAL_MEETING': return 'Video Call';
      case 'EMAIL': return 'Email';
      case 'PLANT_VISIT': return 'Plant Visit';
      case 'OFFICE_VISIT': return 'Office Visit';
      default: return type;
    }
  };

  const formatDateTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
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

  if (!communication) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl">
          <div className="text-center py-8">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Communication Not Found</h3>
            <p className="text-gray-600">The requested communication could not be found.</p>
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
            <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
              <Calendar className="h-6 w-6 text-white" />
            </div>
            Meeting Management
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Meeting Details */}
          <div className="bg-white rounded-lg border shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Current Meeting Details</h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Calendar className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-700">Scheduled Date:</span>
                      <p className="text-sm text-gray-900 font-medium">
                        {communication.nextCommunicationDate 
                          ? formatDateTime(communication.nextCommunicationDate)
                          : 'Not scheduled'
                        }
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      {getCommunicationTypeIcon(communication.type)}
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-700">Meeting Type:</span>
                      <p className="text-sm text-gray-900 font-medium">
                        {getCommunicationTypeLabel(communication.type)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <User className="h-4 w-4 text-purple-600" />
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-700">Customer:</span>
                      <p className="text-sm text-gray-900 font-medium">{communication.customer?.name ?? 'Unknown Customer'}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <span className="text-sm font-medium text-gray-700">Subject:</span>
                    <p className="text-sm text-gray-900 mt-1 font-medium">{communication.subject}</p>
                  </div>

                  {communication.contact && (
                    <div>
                      <span className="text-sm font-medium text-gray-700">Contact Person:</span>
                      <div className="mt-1 p-3 bg-gray-50 rounded-md">
                        <p className="text-sm text-gray-900 font-medium">
                          {communication.contact.name}
                          {communication.contact.designation && ` (${communication.contact.designation})`}
                        </p>
                        {communication.contact.officialCellNumber && (
                          <p className="text-xs text-gray-600 mt-1 flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {communication.contact.officialCellNumber}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Reschedule Section */}
          <div className="bg-white rounded-lg border shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200 bg-blue-50">
              <h3 className="text-lg font-semibold text-gray-900">Reschedule Meeting</h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="newDate" className="text-sm font-medium text-gray-700">
                    New Date <span className="text-red-500">*</span>
                  </Label>
                  <div className="mt-2">
                    <Input
                      id="newDate"
                      type="date"
                      value={newDate}
                      onChange={(e) => setNewDate(e.target.value)}
                      className="w-full rounded-md border border-gray-300 p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="newTime" className="text-sm font-medium text-gray-700">
                    New Time (Optional)
                  </Label>
                  <div className="mt-2">
                    <Input
                      id="newTime"
                      type="time"
                      value={newTime}
                      onChange={(e) => setNewTime(e.target.value)}
                      className="w-full rounded-md border border-gray-300 p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <Label htmlFor="reason" className="text-sm font-medium text-gray-700">
                  Reason for Rescheduling (Optional)
                </Label>
                <div className="mt-2">
                  <Textarea
                    id="reason"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Enter reason for rescheduling..."
                    rows={3}
                    className="w-full rounded-md border border-gray-300 p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg border shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200 bg-green-50">
              <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    const tomorrow = new Date();
                    tomorrow.setDate(tomorrow.getDate() + 1);
                    setNewDate(tomorrow.toISOString().split('T')[0]);
                    setReason('Postponed to tomorrow');
                  }}
                  className="w-full h-12 text-blue-600 border-blue-300 hover:bg-blue-50 hover:border-blue-400"
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Postpone to Tomorrow
                </Button>

                <Button
                  variant="outline"
                  onClick={() => {
                    const nextWeek = new Date();
                    nextWeek.setDate(nextWeek.getDate() + 7);
                    setNewDate(nextWeek.toISOString().split('T')[0]);
                    setReason('Postponed to next week');
                  }}
                  className="w-full h-12 text-purple-600 border-purple-300 hover:bg-purple-50 hover:border-purple-400"
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Postpone to Next Week
                </Button>

                <Button
                  variant="outline"
                  onClick={() => {
                    const today = new Date();
                    setNewDate(today.toISOString().split('T')[0]);
                    setReason('Preponed to today');
                  }}
                  className="w-full h-12 text-green-600 border-green-300 hover:bg-green-50 hover:border-green-400"
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Prepone to Today
                </Button>

                <Button
                  variant="outline"
                  onClick={() => {
                    const yesterday = new Date();
                    yesterday.setDate(yesterday.getDate() - 1);
                    setNewDate(yesterday.toISOString().split('T')[0]);
                    setReason('Preponed to yesterday');
                  }}
                  className="w-full h-12 text-orange-600 border-orange-300 hover:bg-orange-50 hover:border-orange-400"
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Prepone to Yesterday
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
            onClick={handleReschedule} 
            disabled={isSubmitting || !newDate}
            className="px-6 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {isSubmitting ? 'Rescheduling...' : 'Reschedule Meeting'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
