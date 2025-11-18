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
} from 'lucide-react';
import { useToastContext } from '@/components/providers/ToastProvider';

interface EnquiryCommunicationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  enquiryId: number;
}

export function EnquiryCommunicationDrawer({
  isOpen,
  onClose,
  enquiryId,
}: EnquiryCommunicationDrawerProps) {
  const [message, setMessage] = useState('');
  const [communicationType, setCommunicationType] = useState<'TELEPHONIC' | 'VIRTUAL_MEETING' | 'EMAIL' | 'PLANT_VISIT' | 'OFFICE_VISIT'>('TELEPHONIC');
  
  // Set default date to 7 days from now
  const getDefaultDate = () => {
    const date = new Date();
    date.setDate(date.getDate() + 7);
    date.setHours(0, 0, 0, 0); // Reset time to start of day
    return date;
  };
  
  const [nextCommunicationDate, setNextCommunicationDate] = useState<string>(() => {
    const date = getDefaultDate();
    return date ? date.toISOString().split('T')[0] : '';
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { success, error: showError } = useToastContext();

  // Fetch enquiry data
  const { data: enquiry, isLoading: isLoadingEnquiry } = api.enquiry.getById.useQuery(
    { id: enquiryId },
    { enabled: isOpen && !!enquiryId }
  );

  // Fetch company/customer data based on enquiry
  const { data: company, isLoading: isLoadingCompany } = api.company.getById.useQuery(
    { id: enquiry?.companyId ?? '' },
    { enabled: isOpen && !!enquiry?.companyId && typeof enquiry.companyId === 'string' }
  );

  const { data: customer, isLoading: isLoadingCustomer } = api.customer.getById.useQuery(
    { id: enquiry?.customerId ?? '' },
    { enabled: isOpen && !!enquiry?.customerId && !enquiry?.companyId && typeof enquiry.customerId === 'string' }
  );

  // Fetch communications for this enquiry
  const { data: communications, isLoading: isLoadingCommunications, refetch: refetchCommunications } = 
    api.communication.getCommunicationsByEnquiryId.useQuery(
      { enquiryId },
      { enabled: isOpen && !!enquiryId }
    );

  const utils = api.useUtils();

  // Create communication mutation
  const createCommunicationMutation = api.communication.create.useMutation({
    onSuccess: () => {
      success('Communication Added', 'New communication has been added and task created.');
      setIsSubmitting(false);
      setMessage('');
      setCommunicationType('TELEPHONIC');
      const defaultDate = getDefaultDate();
      setNextCommunicationDate(defaultDate ? defaultDate.toISOString().split('T')[0] : '');
      refetchCommunications();
      utils.communication.getCommunicationsByEnquiryId.invalidate({ enquiryId });
      // Invalidate tasks query to refresh tasks page
      utils.tasks.getUpcoming.invalidate();
    },
    onError: (error) => {
      showError('Failed to Add Communication', error.message);
      setIsSubmitting(false);
    },
  });

  const handleSubmit = () => {
    if (!message.trim()) {
      showError('Validation Error', 'Please enter a message.');
      return;
    }

        if (!nextCommunicationDate?.trim()) {
          showError('Validation Error', 'Please select a date for the next communication.');
          return;
        }

    if (!enquiry) {
      showError('Error', 'Enquiry data not loaded.');
      return;
    }

    setIsSubmitting(true);

    // Auto-generate subject from enquiry
    const subject = enquiry.subject 
      ? `Follow-up: ${enquiry.subject}` 
      : `Follow-up: Enquiry #${enquiry.id}`;

    createCommunicationMutation.mutate({
      enquiryId: enquiry.id,
      companyId: enquiry.companyId ?? undefined,
      description: message,
      type: communicationType,
          subject,
          nextCommunicationDate: nextCommunicationDate,
          proposedNextAction: 'Follow up on enquiry',
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

  const isLoading = isLoadingEnquiry || isLoadingCompany || isLoadingCustomer;

  return (
    <Drawer open={isOpen} onOpenChange={onClose} direction="right">
      <DrawerContent className="w-full sm:max-w-lg">
        <DrawerHeader className="border-b bg-gradient-to-r from-blue-50 to-indigo-50">
          <DrawerTitle className="flex items-center gap-2 text-gray-900">
            <MessageSquare className="w-5 h-5 text-blue-600" />
            Communication - Enquiry #{enquiryId}
          </DrawerTitle>
          <DrawerDescription className="text-gray-600">
            View and add communications for this enquiry
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
              {/* Enquiry Summary */}
              {enquiry && (
                <div className="bg-white rounded-lg p-5 border-2 border-blue-200 shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="bg-blue-100 p-2 rounded-lg">
                      <FileText className="w-5 h-5 text-blue-700" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-900 mb-3 text-lg">Enquiry Details</h4>
                      <div className="space-y-2 text-sm">
                        <p className="text-gray-800"><span className="font-semibold text-gray-900">ID:</span> <span className="text-blue-700 font-medium">#{enquiry.id}</span></p>
                        {enquiry.quotationNumber && (
                          <p className="text-gray-800"><span className="font-semibold text-gray-900">Quotation #:</span> <span className="text-indigo-700 font-medium">{enquiry.quotationNumber}</span></p>
                        )}
                        {enquiry.subject && (
                          <p className="text-gray-800"><span className="font-semibold text-gray-900">Subject:</span> <span className="text-gray-700">{enquiry.subject}</span></p>
                        )}
                        {enquiry.enquiryDate && (
                          <p className="text-gray-800"><span className="font-semibold text-gray-900">Date:</span> <span className="text-gray-700">{new Date(enquiry.enquiryDate).toLocaleDateString()}</span></p>
                        )}
                        <p className="flex items-center gap-2">
                          <span className="font-semibold text-gray-900">Status:</span>{' '}
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            enquiry.status === 'LIVE' ? 'bg-green-500 text-white' :
                            enquiry.status === 'DEAD' ? 'bg-red-500 text-white' :
                            enquiry.status === 'RCD' ? 'bg-blue-500 text-white' :
                            enquiry.status === 'WON' ? 'bg-purple-500 text-white' :
                            'bg-gray-500 text-white'
                          }`}>
                            {enquiry.status}
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Customer/Company Summary */}
              {(company ?? customer) && (
                <div className="bg-white rounded-lg p-5 border-2 border-green-200 shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="bg-green-100 p-2 rounded-lg">
                      <Building className="w-5 h-5 text-green-700" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-900 mb-3 text-lg">
                        {company ? 'Company' : 'Customer'} Details
                      </h4>
                      <div className="space-y-2 text-sm">
                        <p className="text-gray-800"><span className="font-semibold text-gray-900">Name:</span> <span className="text-green-700 font-medium">{company?.name ?? customer?.name}</span></p>
                        {company?.website && (
                          <p className="text-gray-800"><span className="font-semibold text-gray-900">Website:</span> <span className="text-blue-600">{company.website}</span></p>
                        )}
                        {company?.industry && (
                          <p className="text-gray-800"><span className="font-semibold text-gray-900">Industry:</span> <span className="text-gray-700">{company.industry}</span></p>
                        )}
                        {customer?.emailId && (
                          <p className="text-gray-800"><span className="font-semibold text-gray-900">Email:</span> <span className="text-blue-600">{customer.emailId}</span></p>
                        )}
                        {customer?.phoneNumber && (
                          <p className="text-gray-800"><span className="font-semibold text-gray-900">Phone:</span> <span className="text-gray-700 font-mono">{customer.phoneNumber}</span></p>
                        )}
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
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <div className="bg-blue-100 p-1.5 rounded">
                              {getCommunicationTypeIcon(comm.type)}
                            </div>
                            <span className="font-semibold text-sm text-gray-900">
                              {getCommunicationTypeLabel(comm.type)}
                            </span>
                          </div>
                          <span className="text-xs font-medium text-gray-600 bg-gray-100 px-2 py-1 rounded">
                            {new Date(comm.createdAt).toLocaleDateString()}
                          </span>
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
                      Message <span className="text-red-600 font-bold">*</span>
                    </Label>
                    <Textarea
                      id="message"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="mt-2 border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter communication details..."
                      rows={4}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="nextCommunicationDate" className="block text-sm font-medium text-gray-700 mb-1">
                      Next Communication Date <span className="text-red-600">*</span>
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
                        required
                        onClick={(e) => {
                          // Ensure the input receives focus and opens the calendar
                          e.currentTarget.showPicker?.();
                        }}
                      />
                    </div>
                    <p className="mt-1 text-xs text-gray-600">
                      This date will create a task in the Tasks page for follow-up
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
                  disabled={isSubmitting || !message.trim() || !nextCommunicationDate?.trim() || isLoading}
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

