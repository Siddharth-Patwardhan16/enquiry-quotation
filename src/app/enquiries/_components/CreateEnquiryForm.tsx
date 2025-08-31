'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CreateEnquirySchema } from '@/lib/validators/enquiry';
import type { z } from 'zod';
import { api } from '@/trpc/client';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/toast';
import { useState } from 'react';
import { 
  Save, 
  X, 
  Building, 
  FileText
} from 'lucide-react';

type FormData = z.infer<typeof CreateEnquirySchema>;

interface CreateEnquiryFormProps {
  onSuccess?: () => void;
}

export function CreateEnquiryForm({ onSuccess }: CreateEnquiryFormProps) {
  const router = useRouter();
  const { success, error: showError } = useToast();
  const utils = api.useUtils();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Fetch the list of customers to populate the dropdown
  const { data: customers, isLoading: isLoadingCustomers } = api.customer.getAll.useQuery();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isValid },

  } = useForm<FormData>({
    resolver: zodResolver(CreateEnquirySchema),
    defaultValues: {
      enquiryDate: new Date().toISOString().split('T')[0],
      priority: 'Medium' as const,
      source: 'Website' as const,
    },
    mode: 'onChange',
  });

  const createEnquiry = api.enquiry.create.useMutation({
    onSuccess: () => {
      utils.enquiry.getAll.invalidate(); // Refresh the enquiry list
      reset();
      success('Enquiry Created', 'The enquiry has been successfully created and is ready for processing.');
      
      // Redirect to enquiries page immediately after successful creation
      router.push('/enquiries');
      
      if (onSuccess) {
        onSuccess();
      }
    },
    onError: (error) => {
      showError('Creation Failed', `Failed to create enquiry: ${error.message}`);
      setIsSubmitting(false);
    },
  });

  const onSubmit = (data: FormData) => {
    if (!isValid) {
      showError('Validation Error', 'Please fill in all required fields correctly.');
      return;
    }
    
    setIsSubmitting(true);
    createEnquiry.mutate(data);
  };

  const handleCancel = () => {
    if (onSuccess) {
      onSuccess();
    } else {
      router.push('/enquiries');
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={handleCancel}
    >
      <div 
        className="bg-white rounded-lg shadow-xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto transform transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        <form onSubmit={handleSubmit(onSubmit)}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">New Enquiry</h3>
              <p className="text-sm text-gray-500">Create a new customer enquiry</p>
            </div>
          </div>
          <button
            onClick={handleCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            type="button"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Content */}
        <div className="p-6 space-y-6">
          {/* Customer Information */}
          <div className="bg-white rounded-xl border shadow-sm">
            <div className="px-6 pt-6">
              <h4 className="text-lg font-semibold text-gray-900 flex items-center">
                <Building className="w-5 h-5 mr-2 text-blue-600" />
                Customer Information
              </h4>
              <p className="text-gray-600 text-sm">Select the customer for this enquiry</p>
            </div>
            <div className="px-6 pb-6 space-y-4">
              <div className="space-y-2">
                <label htmlFor="customerId" className="block text-sm font-medium text-gray-900">
                  Customer <span className="text-red-500">*</span>
                </label>
                <select
                  id="customerId"
                  {...register('customerId')}
                  className={`mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md text-black bg-white ${
                    errors.customerId ? 'border-red-300' : ''
                  }`}
                  disabled={isLoadingCustomers}
                >
                  <option value="" className="text-black bg-white">
                    {isLoadingCustomers ? 'Loading customers...' : 'Select a customer'}
                  </option>
                  {customers?.map((customer: { id: string; name: string }) => (
                    <option key={customer.id} value={customer.id} className="text-black bg-white">
                      {customer.name}
                    </option>
                  ))}
                </select>
                {errors.customerId && (
                  <p className="mt-2 text-sm text-red-600">{errors.customerId.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Enquiry Details */}
          <div className="bg-white rounded-xl border shadow-sm">
            <div className="px-6 pt-6">
              <h4 className="text-lg font-semibold text-gray-900 flex items-center">
                <FileText className="w-5 h-5 mr-2 text-blue-600" />
                Enquiry Details
              </h4>
              <p className="text-gray-600 text-sm">Provide comprehensive enquiry information</p>
            </div>
            <div className="px-6 pb-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="subject" className="block text-sm font-medium text-gray-900">
                    Subject <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="subject"
                    {...register('subject')}
                    className={`mt-1 block w-full pl-3 pr-3 py-2 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-black bg-white ${
                      errors.subject ? 'border-red-300' : ''
                    }`}
                    placeholder="Enter enquiry subject"
                  />
                  {errors.subject && (
                    <p className="mt-2 text-sm text-red-600">{errors.subject.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label htmlFor="enquiryDate" className="block text-sm font-medium text-gray-900">
                    Enquiry Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    id="enquiryDate"
                    {...register('enquiryDate')}
                    className="mt-1 block w-full pl-3 pr-3 py-2 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-black bg-white"
                  />
                </div>



                <div className="space-y-2">
                  <label htmlFor="priority" className="block text-sm font-medium text-gray-900">
                    Priority
                  </label>
                  <select
                    id="priority"
                    {...register('priority')}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md text-black bg-white"
                  >
                    <option value="Low" className="text-black bg-white">Low</option>
                    <option value="Medium" className="text-black bg-white">Medium</option>
                    <option value="High" className="text-black bg-white">High</option>
                    <option value="Urgent" className="text-black bg-white">Urgent</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label htmlFor="source" className="block text-sm font-medium text-gray-900">
                    Source
                  </label>
                  <select
                    id="source"
                    {...register('source')}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md text-black bg-white"
                  >
                    <option value="Website" className="text-black bg-white">Website</option>
                    <option value="Email" className="text-black bg-white">Email</option>
                    <option value="Phone" className="text-black bg-white">Phone</option>
                    <option value="Referral" className="text-black bg-white">Referral</option>
                    <option value="Trade Show" className="text-black bg-white">Trade Show</option>
                    <option value="Social Media" className="text-black bg-white">Social Media</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label htmlFor="expectedBudget" className="block text-sm font-medium text-gray-900">
                    Expected Budget
                  </label>
                  <input
                    id="expectedBudget"
                    {...register('expectedBudget')}
                    className="mt-1 block w-full pl-3 pr-3 py-2 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-black bg-white"
                    placeholder="e.g., ₹10,000 - ₹20,000"
                  />
                </div>
              </div>
            </div>

              <div className="space-y-2">
                <label htmlFor="description" className="block text-sm font-medium text-gray-900">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="description"
                  {...register('description')}
                  rows={4}
                  className={`mt-1 block w-full pl-3 pr-3 py-2 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-black bg-white placeholder-gray-500 ${
                    errors.description ? 'border-red-300' : ''
                  }`}
                  placeholder="Provide a detailed description of the enquiry..."
                />
                {errors.description && (
                  <p className="mt-2 text-sm text-red-600">{errors.description.message}</p>
                )}
                <p className="mt-2 text-sm text-gray-500 pl-3 pb-2">
                  Minimum 10 characters required
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="submit" 
              disabled={isSubmitting || !isValid} 
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 px-4 py-2"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Create Enquiry
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
