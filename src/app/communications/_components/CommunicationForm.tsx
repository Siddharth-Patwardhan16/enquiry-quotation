'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '@/trpc/client';
import { Calendar, Building, Phone, Mail, Video, MapPin } from 'lucide-react';
import type { Communication } from '@/types/communication';
import { useFormConfirmation } from '@/hooks/useFormConfirmation';
import { useToastContext } from '@/components/providers/ToastProvider';

// Validation schema for communication form
const CommunicationSchema = z.object({
  date: z.string().min(1, 'Date is required'),
  customerId: z.string().min(1, 'Customer is required'),
  contactId: z.string().optional(),
  subject: z.string().min(1, 'Subject is required'),
  description: z.string().min(1, 'Description is required'),
  enquiryRelated: z.string().optional(), // Link to enquiry for tracking
  type: z.enum(['TELEPHONIC', 'VIRTUAL_MEETING', 'EMAIL', 'PLANT_VISIT', 'OFFICE_VISIT']),
  nextCommunicationDate: z.string().optional(),
  proposedNextAction: z.string().optional(),
});

type FormData = z.infer<typeof CommunicationSchema>;

// Define customer type
type Customer = {
  id: string;
  name: string;
  isNew: boolean;
  createdAt: Date;
  updatedAt: Date;
};

interface CommunicationFormProps {
  onSuccess?: () => void;
  initialData?: Communication;
  mode?: 'create' | 'edit';
}

export function CommunicationForm({ onSuccess, initialData, mode = 'create' }: CommunicationFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedCommunicationType, setSelectedCommunicationType] = useState<string>('TELEPHONIC');
  const { confirmFormClose } = useFormConfirmation();
  const { success, error: showError } = useToastContext();

  // Fetch data
  const { data: customers, isLoading: loadingCustomers } = api.customer.getAll.useQuery();
  const { data: enquiries } = api.enquiry.getAll.useQuery();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(CommunicationSchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      type: 'TELEPHONIC',
      ...(initialData ? {
        customerId: initialData.customerId,
        subject: initialData.subject,
                description: initialData.description,
        type: initialData.type,
        enquiryRelated: initialData.enquiryRelated ?? undefined,
        nextCommunicationDate: initialData.nextCommunicationDate?.toISOString().split('T')[0] ?? undefined,
        proposedNextAction: initialData.proposedNextAction ?? undefined,
      } : {}),
    },
  });

  const watchedCustomerId = watch('customerId');
  const watchedEnquiryRelated = watch('enquiryRelated');

    // Filter contacts based on selected customer (unused for now)
  // const filteredContacts = contacts?.filter((contact: { customerId: string }) => contact.customerId === watchedCustomerId) || [];
  
  // Filter enquiries based on selected customer
  const filteredEnquiries = enquiries?.filter((enquiry: { customerId: string; id: number; subject: string; quotationNumber?: string | null }) => enquiry.customerId === watchedCustomerId) ?? [];

  // Update customer info when selection changes
  useEffect(() => {
    if (watchedCustomerId) {
      const customer = customers?.find((c: { id: string }) => c.id === watchedCustomerId);
              setSelectedCustomer(customer ?? null);
    }
  }, [watchedCustomerId, customers]);

  // Update selected communication type when form value changes
  useEffect(() => {
    const subscription = watch((value, { name }) => {
      if (name === 'type' && value.type) {
        setSelectedCommunicationType(value.type);
      }
    });
    return () => subscription.unsubscribe();
  }, [watch]);

  // Set initial communication type when editing
  useEffect(() => {
    if (initialData?.type) {
      setSelectedCommunicationType(initialData.type);
    }
  }, [initialData]);

  const createCommunication = api.communication.create.useMutation({
    onSuccess: () => {
      console.log('Communication created successfully');
      success('Communication Created', 'The communication has been successfully created.');
      setIsSubmitting(false);
      setSelectedCustomer(null);
      setSelectedCommunicationType('TELEPHONIC');
      reset();
      onSuccess?.();
    },
    onError: (error) => {
      console.error('Communication creation error:', error);
      setIsSubmitting(false);
      
      // Handle validation errors specifically
      if (error.data?.code === 'BAD_REQUEST') {
        try {
          const validationErrors = JSON.parse(error.message) as { path?: string[]; message: string }[];
          if (Array.isArray(validationErrors)) {
            const errorMessages = validationErrors.map((err: { path?: string[]; message: string }) => {
              if (err.path && err.path.length > 0) {
                const fieldName = err.path.join('.');
                return `${fieldName}: ${err.message}`;
              }
              return err.message;
            });
            showError('Validation Error', errorMessages.join('\n'));
          } else {
            showError('Validation Error', error.message);
          }
        } catch {
          showError('Validation Error', error.message);
        }
      } else {
        showError('Creation Failed', `Failed to create communication: ${error.message}`);
      }
    },
  });

  const updateCommunication = api.communication.update.useMutation({
    onSuccess: () => {
      success('Communication Updated', 'The communication has been successfully updated.');
      setIsSubmitting(false);
      onSuccess?.();
    },
    onError: (error) => {
      console.error('Communication update error:', error);
      setIsSubmitting(false);
      
      // Handle validation errors specifically
      if (error.data?.code === 'BAD_REQUEST') {
        try {
          const validationErrors = JSON.parse(error.message) as { path?: string[]; message: string }[];
          if (Array.isArray(validationErrors)) {
            const errorMessages = validationErrors.map((err: { path?: string[]; message: string }) => {
              if (err.path && err.path.length > 0) {
                const fieldName = err.path.join('.');
                return `${fieldName}: ${err.message}`;
              }
              return err.message;
            });
            showError('Validation Error', errorMessages.join('\n'));
          } else {
            showError('Validation Error', error.message);
          }
        } catch {
          showError('Validation Error', error.message);
        }
      } else {
        showError('Update Failed', `Failed to update communication: ${error.message}`);
      }
    },
  });

  const onSubmit = (data: FormData) => {
    console.log('Form submission data:', data);
    setIsSubmitting(true);
    
    if (mode === 'edit' && initialData?.id) {
      console.log('Updating communication:', { id: initialData.id, ...data });
      updateCommunication.mutate({ id: initialData.id, ...data });
    } else {
      console.log('Creating new communication:', data);
      createCommunication.mutate(data);
    }
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
      case 'TELEPHONIC': return 'Telephonic Discussion';
      case 'VIRTUAL_MEETING': return 'Virtual Meeting';
      case 'EMAIL': return 'Email';
      case 'PLANT_VISIT': return 'Plant Visit';
      case 'OFFICE_VISIT': return 'Office Visit';
      default: return type;
    }
  };

  return (
    <div className="bg-white rounded-lg border shadow-sm">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">
          {mode === 'edit' ? 'Edit Communication' : 'New Communication'}
        </h2>
      </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
        {/* 1. Date */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              1. Date <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="date"
                {...register('date')}
                className="pl-10 w-full rounded-md border border-gray-300 p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            {errors.date && <p className="text-red-500 text-sm mt-1">{errors.date.message}</p>}
          </div>
        </div>

        {/* 2. Customer Information */}
        <div className="space-y-4">
          <h3 className="text-md font-medium text-gray-900 border-b pb-2">2. Customer Information</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                2.1 Customer Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <select
                  {...register('customerId')}
                  className="pl-10 w-full rounded-md border border-gray-300 p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={loadingCustomers}
                >
                  <option value="">{loadingCustomers ? "Loading..." : "Select Customer"}</option>
                  {customers?.map((customer: { id: string; name: string }) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name}
                    </option>
                  ))}
                </select>
              </div>
              {errors.customerId && <p className="text-red-500 text-sm mt-1">{errors.customerId.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                2.2 Address
              </label>
              <div className="p-3 bg-gray-50 rounded-md border">
                {selectedCustomer ? (
                  <div className="text-sm text-gray-700">
                    <div className="text-gray-500 italic">Customer: {selectedCustomer.name}</div>
                    <div className="text-gray-500 italic">Address information is stored in locations</div>
                  </div>
                ) : (
                  <span className="text-gray-500">Select a customer to view information</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 3. Subject and Description */}
        <div className="space-y-4">
          <h3 className="text-md font-medium text-gray-900 border-b pb-2">3. Subject and Description</h3>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              3. Subject <span className="text-red-500">*</span>
            </label>
            <input
              {...register('subject')}
              placeholder="Enter communication subject"
              className="w-full rounded-md border border-gray-300 p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            {errors.subject && <p className="text-red-500 text-sm mt-1">{errors.subject.message}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                3.1 Enquiry Related
              </label>
              <select
                {...register('enquiryRelated')}
                className="w-full rounded-md border border-gray-300 p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={!watchedCustomerId}
              >
                <option value="">Select Enquiry (Optional)</option>
                {filteredEnquiries.map((enquiry: { id: number; subject: string; quotationNumber?: string | null }) => (
                  <option key={enquiry.id} value={enquiry.id}>
                    {enquiry.quotationNumber ? `Q#${enquiry.quotationNumber} - ${enquiry.subject}` : enquiry.subject}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                3.2 Selected Enquiry Details
              </label>
              <div className="p-3 bg-gray-50 rounded-md border">
                {watchedEnquiryRelated ? (
                  (() => {
                    const selectedEnquiry = filteredEnquiries.find((enquiry: { id: number; subject: string; quotationNumber?: string | null }) => enquiry.id === parseInt(watchedEnquiryRelated));
                    return selectedEnquiry ? (
                      <div className="text-sm text-gray-700">
                        <div className="font-medium text-gray-900 mb-1">
                          {selectedEnquiry.quotationNumber ? `Quotation #${selectedEnquiry.quotationNumber}` : 'No Quotation Number'}
                        </div>
                        <div className="text-gray-600">
                          {selectedEnquiry.subject}
                        </div>
                      </div>
                    ) : (
                      <span className="text-gray-500">Enquiry not found</span>
                    );
                  })()
                ) : (
                  <span className="text-gray-500">Select an enquiry to view details</span>
                )}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              3.3 Description of Communication <span className="text-red-500">*</span>
            </label>
            <textarea
              {...register('description')}
              placeholder="Provide a description of the communication"
              rows={4}
              className="w-full rounded-md border border-gray-300 p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>}
          </div>
        </div>

        {/* 4. Type of Communication */}
        <div className="space-y-4">
          <h3 className="text-md font-medium text-gray-900 border-b pb-2">4. Type of Communication</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(['TELEPHONIC', 'VIRTUAL_MEETING', 'EMAIL', 'PLANT_VISIT', 'OFFICE_VISIT'] as const).map((type) => (
              <label key={type} className={`relative flex items-start p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors ${
                selectedCommunicationType === type 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200'
              }`}>
                <input
                  type="radio"
                  value={type}
                  {...register('type')}
                  className="sr-only"
                  onChange={(e) => {
                    setSelectedCommunicationType(e.target.value);
                    setValue('type', e.target.value as 'TELEPHONIC' | 'VIRTUAL_MEETING' | 'EMAIL' | 'PLANT_VISIT' | 'OFFICE_VISIT');
                  }}
                />
                <div className="flex items-center space-x-3 w-full">
                  <div className="flex-shrink-0">
                    <div className={`w-5 h-5 border-2 rounded-full flex items-center justify-center transition-colors ${
                      selectedCommunicationType === type 
                        ? 'bg-blue-600 border-blue-600' 
                        : 'border-gray-300'
                    }`}>
                      <div className={`w-2.5 h-2.5 bg-white rounded-full transition-opacity ${
                        selectedCommunicationType === type ? 'opacity-100' : 'opacity-0'
                      }`}></div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 flex-1">
                    <div className="text-blue-600">
                      {getCommunicationTypeIcon(type)}
                    </div>
                    <span className="text-sm font-medium text-gray-900">
                      {getCommunicationTypeLabel(type)}
                    </span>
                  </div>
                </div>
              </label>
            ))}
          </div>
          {errors.type && (
            <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-600 text-sm flex items-center gap-2">
                <span className="w-2 h-2 bg-red-600 rounded-full"></span>
                {errors.type.message}
              </p>
            </div>
          )}
        </div>

        {/* 5. Next Communication */}
        <div className="space-y-4">
          <h3 className="text-md font-medium text-gray-900 border-b pb-2">5. Next Communication</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                5.1 Next Date of Communication
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="date"
                  {...register('nextCommunicationDate')}
                  className="pl-10 w-full rounded-md border border-gray-300 p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                5.2 Proposed Mode of Communication
              </label>
              <select
                {...register('proposedNextAction')}
                className="w-full rounded-md border border-gray-300 p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select Mode</option>
                <option value="Mail">Mail</option>
                <option value="Tel Call">Tel Call</option>
                <option value="Visit">Visit</option>
                <option value="Virtual Meeting">Virtual Meeting</option>
              </select>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end space-x-3 pt-6 border-t">
          <button
            type="button"
            onClick={() => {
              confirmFormClose({
                hasUnsavedChanges: true,
                onConfirm: () => {
                  setSelectedCustomer(null);
                  setSelectedCommunicationType('TELEPHONIC');
                  reset();
                }
              });
            }}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Reset
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {isSubmitting ? 'Saving...' : mode === 'edit' ? 'Update Communication' : 'Save Communication'}
          </button>
        </div>
      </form>
    </div>
  );
}

