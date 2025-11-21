'use client';

import { useState } from 'react';
import { api } from '@/trpc/client';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerClose,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  FileText,
  Building,
  MessageSquare,
  Phone,
  Mail,
  Video,
  MapPin,
  Calendar,
  User,
  Loader2,
  Edit,
  X,
} from 'lucide-react';
import { useToastContext } from '@/components/providers/ToastProvider';

interface TaskCommunicationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  communicationId: string;
  onSuccess?: () => void;
}

export function TaskCommunicationDrawer({
  isOpen,
  onClose,
  communicationId,
  onSuccess,
}: TaskCommunicationDrawerProps) {
  const [message, setMessage] = useState('');
  const [communicationType, setCommunicationType] = useState<'TELEPHONIC' | 'VIRTUAL_MEETING' | 'EMAIL' | 'PLANT_VISIT' | 'OFFICE_VISIT'>('TELEPHONIC');
  const [editingCommId, setEditingCommId] = useState<string | null>(null);
  const [editDescription, setEditDescription] = useState('');
  const [editingCommType, setEditingCommType] = useState<'TELEPHONIC' | 'VIRTUAL_MEETING' | 'EMAIL' | 'PLANT_VISIT' | 'OFFICE_VISIT'>('TELEPHONIC');
  
  const [nextCommunicationDate, setNextCommunicationDate] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { success, error: showError } = useToastContext();

  // Fetch communication details
  const { data: communication, isLoading: isLoadingCommunication } = api.tasks.getCommunicationDetails.useQuery(
    { communicationId },
    { enabled: isOpen && !!communicationId }
  );

  // Fetch communications by enquiryId if available
  const { data: enquiryCommunications, isLoading: isLoadingEnquiryCommunications, refetch: refetchEnquiryCommunications } = 
    api.communication.getCommunicationsByEnquiryId.useQuery(
      { enquiryId: communication?.enquiryId ?? 0 },
      { enabled: isOpen && !!communication?.enquiryId && typeof communication.enquiryId === 'number' }
    );

  // Fetch communications by customer/company if no enquiryId
  const { data: customerCommunications, isLoading: isLoadingCustomerCommunications, refetch: refetchCustomerCommunications } = 
    api.communication.getAll.useQuery(
      { customerId: communication?.companyId ?? communication?.customerId ?? '' },
      { enabled: isOpen && !!communication && !communication.enquiryId && (!!communication.companyId || !!communication.customerId) }
    );

  const utils = api.useUtils();

  // Determine which communications to display
  const communications = communication?.enquiryId 
    ? enquiryCommunications 
    : customerCommunications;
  const isLoadingCommunications = communication?.enquiryId 
    ? isLoadingEnquiryCommunications 
    : isLoadingCustomerCommunications;

  // Create communication mutation
  const createCommunicationMutation = api.communication.create.useMutation({
    onSuccess: () => {
      success('Communication Added', 'New communication has been added and task created.');
      setIsSubmitting(false);
      setMessage('');
      setCommunicationType('TELEPHONIC');
      setNextCommunicationDate('');
      if (communication?.enquiryId) {
        refetchEnquiryCommunications();
        utils.communication.getCommunicationsByEnquiryId.invalidate({ enquiryId: communication.enquiryId });
      } else {
        refetchCustomerCommunications();
        utils.communication.getAll.invalidate();
      }
      utils.tasks.getUpcoming.invalidate();
      onSuccess?.();
    },
    onError: (error) => {
      showError('Failed to Add Communication', error.message);
      setIsSubmitting(false);
    },
  });

  // Update communication mutation
  const updateCommunicationMutation = api.communication.update.useMutation({
    onSuccess: () => {
      success('Communication Updated', 'Communication has been successfully updated.');
      setEditingCommId(null);
      setEditDescription('');
      if (communication?.enquiryId) {
        refetchEnquiryCommunications();
        utils.communication.getCommunicationsByEnquiryId.invalidate({ enquiryId: communication.enquiryId });
      } else {
        refetchCustomerCommunications();
        utils.communication.getAll.invalidate();
      }
      utils.tasks.getUpcoming.invalidate();
      onSuccess?.();
    },
    onError: (error) => {
      showError('Failed to Update Communication', error.message);
    },
  });

  const handleSubmit = () => {
    if (!message.trim()) {
      showError('Validation Error', 'Please enter a message.');
      return;
    }

    if (!communication) {
      showError('Error', 'Communication data not loaded.');
      return;
    }

    setIsSubmitting(true);

    // Auto-generate subject
    const subject = communication.subject 
      ? `Follow-up: ${communication.subject}` 
      : `Follow-up: Communication #${communication.id}`;

    createCommunicationMutation.mutate({
      enquiryId: communication.enquiryId ?? undefined,
      companyId: communication.companyId ?? undefined,
      description: message,
      type: communicationType,
      subject,
      nextCommunicationDate: nextCommunicationDate?.trim() || undefined,
      proposedNextAction: 'Follow up on communication',
    });
  };

  const handleEdit = (comm: { id: string; description: string | null; type: string }) => {
    setEditingCommId(comm.id);
    setEditDescription(comm.description ?? '');
    setEditingCommType(comm.type as typeof editingCommType);
  };

  const handleCancelEdit = () => {
    setEditingCommId(null);
    setEditDescription('');
    setEditingCommType('TELEPHONIC');
  };

  const handleSaveEdit = (commId: string) => {
    if (!editDescription.trim()) {
      showError('Validation Error', 'Please enter a description.');
      return;
    }

    updateCommunicationMutation.mutate({
      id: commId,
      description: editDescription,
      type: editingCommType,
    });
  };

  const getCommunicationTypeIcon = (type: string) => {
    switch (type) {
      case 'TELEPHONIC':
        return <Phone className="w-4 h-4" />;
      case 'VIRTUAL_MEETING':
        return <Video className="w-4 h-4" />;
      case 'EMAIL':
        return <Mail className="w-4 h-4" />;
      case 'PLANT_VISIT':
      case 'OFFICE_VISIT':
        return <MapPin className="w-4 h-4" />;
      default:
        return <MessageSquare className="w-4 h-4" />;
    }
  };

  const getCommunicationTypeLabel = (type: string) => {
    switch (type) {
      case 'TELEPHONIC':
        return 'Phone Call';
      case 'VIRTUAL_MEETING':
        return 'Video Call';
      case 'EMAIL':
        return 'Email';
      case 'PLANT_VISIT':
        return 'Plant Visit';
      case 'OFFICE_VISIT':
        return 'Office Visit';
      default:
        return type;
    }
  };

  const isLoading = isLoadingCommunication;

  return (
    <Drawer open={isOpen} onOpenChange={onClose} direction="right">
      <DrawerContent className="w-full sm:max-w-lg">
        <DrawerHeader className="border-b bg-gradient-to-r from-blue-50 to-indigo-50">
          <DrawerTitle className="flex items-center gap-2 text-gray-900">
            <MessageSquare className="w-5 h-5 text-blue-600" />
            Communication - Task
          </DrawerTitle>
          <DrawerDescription className="text-gray-600">
            View and manage communications
          </DrawerDescription>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-gray-50">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
              <span className="ml-2 text-gray-700 font-medium">Loading...</span>
            </div>
          ) : (
            <>
              {/* Communication Summary */}
              {communication && (
                <div className="bg-white rounded-lg p-5 border-2 border-blue-200 shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="bg-blue-100 p-2 rounded-lg">
                      <MessageSquare className="w-5 h-5 text-blue-700" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-900 mb-3 text-lg">Current Communication</h4>
                      <div className="space-y-2 text-sm">
                        {communication.subject && (
                          <p className="text-gray-800"><span className="font-semibold text-gray-900">Subject:</span> <span className="text-blue-700 font-medium">{communication.subject}</span></p>
                        )}
                        <p className="text-gray-800"><span className="font-semibold text-gray-900">Type:</span> <span className="text-gray-700">{getCommunicationTypeLabel(communication.type)}</span></p>
                        {communication.status && (
                          <p className="flex items-center gap-2">
                            <span className="font-semibold text-gray-900">Status:</span>{' '}
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              communication.status === 'COMPLETED' ? 'bg-green-500 text-white' :
                              communication.status === 'SCHEDULED' ? 'bg-blue-500 text-white' :
                              communication.status === 'CANCELLED' ? 'bg-red-500 text-white' :
                              'bg-gray-500 text-white'
                            }`}>
                              {communication.status}
                            </span>
                          </p>
                        )}
                        {communication.nextCommunicationDate && (
                          <p className="text-gray-800"><span className="font-semibold text-gray-900">Next Date:</span> <span className="text-gray-700">{new Date(communication.nextCommunicationDate).toLocaleDateString()}</span></p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Enquiry Summary (if exists) */}
              {communication?.enquiry && (
                <div className="bg-white rounded-lg p-5 border-2 border-purple-200 shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="bg-purple-100 p-2 rounded-lg">
                      <FileText className="w-5 h-5 text-purple-700" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-900 mb-3 text-lg">Related Enquiry</h4>
                      <div className="space-y-2 text-sm">
                        <p className="text-gray-800"><span className="font-semibold text-gray-900">ID:</span> <span className="text-purple-700 font-medium">#{communication.enquiry.id}</span></p>
                        {communication.enquiry.quotationNumber && (
                          <p className="text-gray-800"><span className="font-semibold text-gray-900">Quotation #:</span> <span className="text-indigo-700 font-medium">{communication.enquiry.quotationNumber}</span></p>
                        )}
                        {communication.enquiry.subject && (
                          <p className="text-gray-800"><span className="font-semibold text-gray-900">Subject:</span> <span className="text-gray-700">{communication.enquiry.subject}</span></p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Customer/Company Summary */}
              {(communication?.company ?? communication?.customer) && (
                <div className="bg-white rounded-lg p-5 border-2 border-green-200 shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="bg-green-100 p-2 rounded-lg">
                      <Building className="w-5 h-5 text-green-700" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-900 mb-3 text-lg">
                        {communication.company ? 'Company' : 'Customer'} Details
                      </h4>
                      <div className="space-y-2 text-sm">
                        <p className="text-gray-800"><span className="font-semibold text-gray-900">Name:</span> <span className="text-green-700 font-medium">{communication.company?.name ?? communication.customer?.name}</span></p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Communication Timeline */}
              <div>
                <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2 text-lg">
                  <div className="bg-blue-100 p-2 rounded-lg">
                    <Calendar className="w-5 h-5 text-blue-700" />
                  </div>
                  Communication Timeline
                </h4>
                {isLoadingCommunications ? (
                  <div className="flex items-center justify-center py-8 bg-white rounded-lg border-2 border-gray-200">
                    <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                  </div>
                ) : communications && communications.length > 0 ? (
                  <div className="space-y-3">
                    {communications.map((comm) => (
                      <div
                        key={comm.id}
                        className="bg-white border-2 border-gray-300 rounded-lg p-4 hover:shadow-lg hover:border-blue-400 transition-all"
                      >
                        {editingCommId === comm.id ? (
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="bg-blue-100 p-1.5 rounded">
                                  {getCommunicationTypeIcon(comm.type)}
                                </div>
                                <span className="font-semibold text-sm text-gray-900">
                                  {getCommunicationTypeLabel(comm.type)}
                                </span>
                              </div>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={handleCancelEdit}
                                className="h-6 w-6 p-0"
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                            <Textarea
                              value={editDescription}
                              onChange={(e) => setEditDescription(e.target.value)}
                              className="w-full border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                              placeholder="Enter communication description..."
                              rows={3}
                            />
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleSaveEdit(comm.id)}
                                disabled={updateCommunicationMutation.isPending}
                                className="bg-blue-600 hover:bg-blue-700 text-white"
                              >
                                {updateCommunicationMutation.isPending ? (
                                  <>
                                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                    Saving...
                                  </>
                                ) : (
                                  'Save'
                                )}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={handleCancelEdit}
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <div className="bg-blue-100 p-1.5 rounded">
                                  {getCommunicationTypeIcon(comm.type)}
                                </div>
                                <span className="font-semibold text-sm text-gray-900">
                                  {getCommunicationTypeLabel(comm.type)}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleEdit(comm)}
                                  className="h-6 w-6 p-0"
                                >
                                  <Edit className="w-3 h-3" />
                                </Button>
                                <span className="text-xs font-medium text-gray-600 bg-gray-100 px-2 py-1 rounded">
                                  {new Date(comm.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                            {comm.description && (
                              <p className="text-sm text-gray-800 mb-3 leading-relaxed bg-gray-50 p-3 rounded border-l-4 border-blue-500">
                                {comm.description}
                              </p>
                            )}
                            {comm.proposedNextAction && (
                              <p className="text-xs font-medium text-blue-700 bg-blue-50 px-2 py-1 rounded inline-block mb-2">
                                Next: {comm.proposedNextAction}
                              </p>
                            )}
                            <div className="flex items-center gap-3 mt-2 pt-2 border-t border-gray-200">
                              {comm.nextCommunicationDate && (
                                <p className="text-xs font-medium text-gray-700 flex items-center gap-1">
                                  <Calendar className="w-3 h-3 text-indigo-600" />
                                  Follow-up: {new Date(comm.nextCommunicationDate).toLocaleDateString()}
                                </p>
                              )}
                              {comm.employee && (
                                <p className="text-xs font-medium text-gray-700 flex items-center gap-1">
                                  <User className="w-3 h-3 text-green-600" />
                                  {comm.employee.name}
                                </p>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed border-gray-300">
                    <MessageSquare className="w-16 h-16 mx-auto mb-3 text-gray-400" />
                    <p className="text-gray-700 font-medium mb-1">No communications yet</p>
                    <p className="text-sm text-gray-500">Add your first communication below</p>
                  </div>
                )}
              </div>

              {/* Add Communication Form */}
              <div className="border-t-2 border-gray-300 pt-6 bg-white rounded-lg p-5 shadow-sm">
                <h4 className="font-bold text-gray-900 mb-4 text-lg flex items-center gap-2">
                  <div className="bg-indigo-100 p-2 rounded-lg">
                    <MessageSquare className="w-5 h-5 text-indigo-700" />
                  </div>
                  Add New Communication
                </h4>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="communication-type" className="text-sm font-semibold text-gray-900 mb-2 block">
                      Communication Type
                    </Label>
                    <select
                      id="communication-type"
                      value={communicationType}
                      onChange={(e) => setCommunicationType(e.target.value as typeof communicationType)}
                      className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 font-medium"
                    >
                      <option value="TELEPHONIC">Phone Call</option>
                      <option value="VIRTUAL_MEETING">Video Call</option>
                      <option value="EMAIL">Email</option>
                      <option value="PLANT_VISIT">Plant Visit</option>
                      <option value="OFFICE_VISIT">Office Visit</option>
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="message" className="text-sm font-semibold text-gray-900 mb-2 block">
                      Message
                    </Label>
                    <Textarea
                      id="message"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="mt-2 border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter communication details..."
                      rows={4}
                    />
                  </div>

                  <div>
                    <Label htmlFor="nextCommunicationDate" className="block text-sm font-medium text-gray-700 mb-1">
                      Next Communication Date (Optional)
                    </Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none z-10" />
                      <input
                        id="nextCommunicationDate"
                        type="date"
                        value={nextCommunicationDate}
                        onChange={(e) => setNextCommunicationDate(e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                        className="pl-10 w-full rounded-md border border-gray-300 p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white relative z-0 cursor-pointer"
                        onClick={(e) => {
                          e.currentTarget.showPicker?.();
                        }}
                      />
                    </div>
                    <p className="mt-1 text-xs text-gray-600">
                      Optional: This date will create a task in the Tasks page for follow-up
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        <DrawerFooter className="border-t-2 border-gray-300 bg-white">
          <div className="flex items-center justify-end gap-3 w-full">
            <DrawerClose asChild>
              <Button variant="outline" disabled={isSubmitting} className="border-2 border-gray-300 font-semibold text-gray-700 hover:bg-gray-100">
                Close
              </Button>
            </DrawerClose>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || !message.trim() || isLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-md hover:shadow-lg transition-all border-2 border-blue-700"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Add Communication
                </>
              )}
            </Button>
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

