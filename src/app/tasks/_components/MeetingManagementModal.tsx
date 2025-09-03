'use client';

import { useState } from 'react';
import { api } from '@/trpc/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Clock, Video, Phone, Mail, Building, MapPin, User, AlertCircle } from 'lucide-react';
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
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Meeting Management
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Meeting Details */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Meeting Details</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">Scheduled Date:</span>
                  <span className="text-sm text-gray-900">
                    {communication.nextCommunicationDate 
                      ? formatDateTime(communication.nextCommunicationDate)
                      : 'Not scheduled'
                    }
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {getCommunicationTypeIcon(communication.type)}
                  <span className="text-sm font-medium text-gray-700">Meeting Type:</span>
                  <span className="text-sm text-gray-900">
                    {getCommunicationTypeLabel(communication.type)}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">Customer:</span>
                  <span className="text-sm text-gray-900">{communication.customer.name}</span>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <span className="text-sm font-medium text-gray-700">Subject:</span>
                  <p className="text-sm text-gray-900 mt-1">{communication.subject}</p>
                </div>

                {communication.contact && (
                  <div>
                    <span className="text-sm font-medium text-gray-700">Contact Person:</span>
                    <p className="text-sm text-gray-900 mt-1">
                      {communication.contact.name}
                      {communication.contact.designation && ` (${communication.contact.designation})`}
                    </p>
                    {communication.contact.officialCellNumber && (
                      <p className="text-xs text-gray-600 mt-1">
                        📞 {communication.contact.officialCellNumber}
                      </p>
                    )}
                  </div>
                )}

                {communication.customer.officeReceptionNumber && (
                  <div>
                    <span className="text-sm font-medium text-gray-700">Office Contact:</span>
                    <p className="text-sm text-gray-900 mt-1">
                      📞 {communication.customer.officeReceptionNumber}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {communication.customer.officeAddress && (
              <div className="mt-4">
                <span className="text-sm font-medium text-gray-700">Address:</span>
                <p className="text-sm text-gray-900 mt-1">
                  {communication.customer.officeAddress}
                  {communication.customer.officeCity && `, ${communication.customer.officeCity}`}
                  {communication.customer.officeState && `, ${communication.customer.officeState}`}
                  {communication.customer.officeCountry && `, ${communication.customer.officeCountry}`}
                </p>
              </div>
            )}
          </div>

          {/* Reschedule Section */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Reschedule Meeting</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="newDate">New Date *</Label>
                <Input
                  id="newDate"
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="newTime">New Time (Optional)</Label>
                <Input
                  id="newTime"
                  type="time"
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>

            <div className="mt-4">
              <Label htmlFor="reason">Reason for Rescheduling (Optional)</Label>
              <Textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Enter reason for rescheduling..."
                rows={3}
                className="mt-1"
              />
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-green-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button
                variant="outline"
                onClick={() => {
                  const tomorrow = new Date();
                  tomorrow.setDate(tomorrow.getDate() + 1);
                  setNewDate(tomorrow.toISOString().split('T')[0]);
                  setReason('Postponed to tomorrow');
                }}
                className="w-full"
              >
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
                className="w-full"
              >
                Postpone to Next Week
              </Button>

              <Button
                variant="outline"
                onClick={() => {
                  const today = new Date();
                  setNewDate(today.toISOString().split('T')[0]);
                  setReason('Preponed to today');
                }}
                className="w-full"
              >
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
                className="w-full"
              >
                Prepone to Yesterday
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
            onClick={handleReschedule} 
            disabled={isSubmitting || !newDate}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isSubmitting ? 'Rescheduling...' : 'Reschedule Meeting'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
