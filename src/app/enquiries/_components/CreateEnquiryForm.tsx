'use client';

// Type for company from the API
type Company = {
  id: string;
  name: string;
  website?: string | null;
  industry?: string | null;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: {
    id: string;
    name: string;
    email: string;
  } | null;
  offices: Array<{
    id: string;
    name: string;
    address: string | null;
    city: string | null;
    state: string | null;
    country: string | null;
    contactPersons: Array<{
      id: string;
      name: string;
      designation: string | null;
      phoneNumber: string | null;
      emailId: string | null;
      isPrimary: boolean;
    }>;
  }>;
  plants: Array<{
    id: string;
    name: string;
    address: string | null;
    city: string | null;
    state: string | null;
    country: string | null;
    contactPersons: Array<{
      id: string;
      name: string;
      designation: string | null;
      phoneNumber: string | null;
      emailId: string | null;
      isPrimary: boolean;
    }>;
  }>;
  contactPersons: Array<{
    id: string;
    name: string;
    designation: string | null;
    phoneNumber: string | null;
    emailId: string | null;
    isPrimary: boolean;
  }>;
};

import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CreateEnquirySchema } from '@/lib/validators/enquiry';
import type { z } from 'zod';
import { api } from '@/trpc/client';
import { useRouter } from 'next/navigation';
import { useToastContext } from '@/components/providers/ToastProvider';
import React, { useState, useEffect } from 'react';
import { useFormConfirmation } from '@/hooks/useFormConfirmation';
import { 
  Save, 
  X, 
  Building, 
  FileText
} from 'lucide-react';
import CustomerSelector, { type Customer } from '@/components/ui/CustomerSelector';

type FormData = z.infer<typeof CreateEnquirySchema>;

// Generate a unique quotation number
const generateQuotationNumber = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const timestamp = now.getTime().toString().slice(-6);
  return `Q${year}${month}${timestamp}`;
};

interface CreateEnquiryFormProps {
  onSuccess?: () => void;
}

export function CreateEnquiryForm({ onSuccess }: CreateEnquiryFormProps) {
  const router = useRouter();
  const { success, error: showError } = useToastContext();
  const utils = api.useUtils();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const { confirmFormClose } = useFormConfirmation();
  
  // Fetch both customers and companies to populate the dropdown
  const { data: customers, isLoading: isLoadingCustomers } = api.company.getAll.useQuery();
  const { data: companies, isLoading: isLoadingCompanies } = api.company.getAll.useQuery();
  const { data: employees, isLoading: isLoadingEmployees } = api.employee.getAll.useQuery();
  
  // Combine customers and companies into a unified list with deduplication
  const allEntities: Customer[] = (() => {
    const entities: Customer[] = [];
    const seenNames = new Set<string>();
    
    // First, add all companies (new structure takes priority)
    (companies ?? []).forEach((company: Company) => {
      const normalizedName = company.name.trim().toLowerCase();
      if (!seenNames.has(normalizedName)) {
        seenNames.add(normalizedName);
        entities.push({
          id: company.id,
          name: company.name,
          type: 'Company',
          industry: company.industry ?? undefined,
          website: company.website ?? undefined,
          location: company.offices?.[0] ? `${company.offices[0].city}, ${company.offices[0].state}` : undefined
        });
      }
    });
    
    // Then, add customers that don't have duplicate names
    (customers ?? []).forEach((customer: Company) => {
      const normalizedName = customer.name.trim().toLowerCase();
      if (!seenNames.has(normalizedName)) {
        seenNames.add(normalizedName);
        entities.push({
          id: customer.id,
          name: customer.name,
          type: 'Customer',
          location: customer.offices?.[0] ? `${customer.offices[0].city}, ${customer.offices[0].state}` : undefined
        });
      }
    });
    
    return entities.sort((a, b) => a.name.localeCompare(b.name));
  })();
  
  const isLoadingEntities = isLoadingCustomers || isLoadingCompanies;

  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(CreateEnquirySchema),
    defaultValues: {
      enquiryDate: new Date().toISOString().split('T')[0],
      priority: 'Medium' as const,
      source: 'Website' as const,
      quotationNumber: generateQuotationNumber(),
      status: 'LIVE' as const,
      customerType: 'NEW' as const,
      designRequired: 'Standard' as const,
    },
    mode: 'onSubmit', // Change to onSubmit to avoid validation issues while typing
  });

  // Watch for changes in the customer dropdown
  const selectedCustomerId = useWatch({ control, name: 'customerId' });
  
  // Sync selectedCustomer with form state
  useEffect(() => {
    if (selectedCustomerId && selectedCustomer?.id !== selectedCustomerId) {
      const entity = allEntities.find(e => e.id === selectedCustomerId);
      if (entity) {
        setSelectedCustomer(entity);
      }
    } else if (!selectedCustomerId && selectedCustomer) {
      setSelectedCustomer(null);
    }
  }, [selectedCustomerId, selectedCustomer, allEntities]);
  
  // Find the selected entity to determine its type
  const isCompany = selectedCustomer?.type === 'Company';

  // Fetch locations for the selected customer (legacy)
  const { data: customerLocations, isLoading: isLoadingCustomerLocations } = api.location.getByCustomerId.useQuery(
    { customerId: selectedCustomerId! },
    { enabled: !!selectedCustomerId && !isCompany } // Only run for customers
  );
  
  // For companies, we'll use offices and plants as locations
  const companyLocations = isCompany && selectedCustomer ? [
    ...(companies?.find(c => c.id === selectedCustomerId)?.offices?.map(office => ({
      id: office.id,
      name: office.name,
      type: 'OFFICE'
    })) ?? []),
    ...(companies?.find(c => c.id === selectedCustomerId)?.plants?.map(plant => ({
      id: plant.id,
      name: plant.name,
      type: 'PLANT'
    })) ?? [])
  ] : [];
  
  const locations = isCompany ? companyLocations : customerLocations;
  const isLoadingLocations = isCompany ? false : isLoadingCustomerLocations;

  // Watch for location changes to auto-populate region
  const selectedLocationId = useWatch({ control, name: 'locationId' });
  
  useEffect(() => {
    if (!selectedLocationId || !selectedCustomerId) {
      // Clear region if no location or customer is selected
      setValue('region', '');
      return;
    }

    if (isCompany && companies) {
      // For companies, get city/state from office or plant
      const company = companies.find(c => c.id === selectedCustomerId);
      if (company) {
        const office = company.offices?.find(o => o.id === selectedLocationId);
        const plant = company.plants?.find(p => p.id === selectedLocationId);
        const location = office || plant;
        
        if (location) {
          // Build region string from city and state
          const regionParts: string[] = [];
          if (location.city) {
            regionParts.push(location.city);
          }
          if (location.state) {
            regionParts.push(location.state);
          }
          if (location.country) {
            regionParts.push(location.country);
          }
          
          if (regionParts.length > 0) {
            setValue('region', regionParts.join(', '));
          } else {
            setValue('region', '');
          }
        } else {
          setValue('region', '');
        }
      }
    } else if (!isCompany && customerLocations) {
      // For legacy customers, try to get location data
      const selectedLocation = customerLocations.find(loc => loc.id === selectedLocationId);
      if (selectedLocation) {
        // If location has city/state data, use it
        const regionParts: string[] = [];
        const locationWithCity = selectedLocation as { city?: string; state?: string };
        if (locationWithCity.city) {
          regionParts.push(locationWithCity.city);
        }
        if (locationWithCity.state) {
          regionParts.push(locationWithCity.state);
        }
        if (regionParts.length > 0) {
          setValue('region', regionParts.join(', '));
        }
      }
    }
  }, [selectedLocationId, selectedCustomerId, isCompany, companies, customerLocations, setValue]);

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
      // Enquiry creation error
      
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
        showError('Creation Failed', `Failed to create enquiry: ${error.message}`);
      }
      setIsSubmitting(false);
    },
  });

  // Handle customer selection
  const handleCustomerSelect = (customer: Customer | null) => {
    setSelectedCustomer(customer);
    // Update form field
    if (customer) {
      setValue('customerId', customer.id);
    } else {
      setValue('customerId', undefined);
    }
  };

  const onSubmit = (data: FormData) => {
    // Clean up data: convert empty strings to undefined for optional UUID fields
    const cleanedData: FormData = {
      ...data,
      customerId: data.customerId && data.customerId.trim() !== '' ? data.customerId : undefined,
      locationId: data.locationId && data.locationId.trim() !== '' ? data.locationId : undefined,
      attendedById: data.attendedById && data.attendedById.trim() !== '' ? data.attendedById : undefined,
    };
    
    // Use selectedCustomer to determine entity type, or default to 'company' if no customer selected
    const entityType = selectedCustomer?.type === 'Company' ? 'company' : (selectedCustomer ? 'customer' : 'company');
    
    setIsSubmitting(true);
    createEnquiry.mutate({
      ...cleanedData,
      entityType: entityType as 'customer' | 'company'
    });
  };

  const handleCancel = () => {
    confirmFormClose({
      hasUnsavedChanges: true, // Always assume there might be changes
      onConfirm: () => {
        if (onSuccess) {
          onSuccess();
        } else {
          router.push('/enquiries');
        }
      }
    });
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
              <p className="text-sm text-gray-900">Create a new customer enquiry</p>
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
              <p className="text-gray-900 text-sm">Select the customer for this enquiry</p>
            </div>
            <div className="px-6 pb-6 space-y-4">
              <CustomerSelector
                customers={allEntities}
                selectedCustomer={selectedCustomer}
                onCustomerSelect={handleCustomerSelect}
                loading={isLoadingEntities}
                error={errors.customerId?.message}
                placeholder="Search and select a customer..."
                emptyMessage="No customers found"
                loadingMessage="Loading customers..."
              />
              
              {/* Hidden input for form validation */}
              <input
                type="hidden"
                {...register('customerId')}
                value={selectedCustomer?.id ?? ''}
              />

              <div className="space-y-2">
                <label htmlFor="locationId" className="block text-sm font-medium text-gray-900">
                  Location (Office/Plant)
                </label>
                <select
                  id="locationId"
                  {...register('locationId')}
                  className={`mt-1 block w-full pl-3 pr-10 py-2 text-base border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-black bg-white ${
                    errors.locationId ? 'border-red-300' : ''
                  }`}
                  disabled={!selectedCustomerId || isLoadingLocations}
                >
                  <option value="" className="text-black bg-white">
                    {isLoadingLocations ? 'Loading locations...' : 
                     !selectedCustomerId ? 'Select a customer first' : 
                     'Select a location'}
                  </option>
                  {locations?.map((location: { id: string; name: string; type: string }) => (
                    <option key={location.id} value={location.id} className="text-black bg-white">
                      {location.name} ({location.type})
                    </option>
                  ))}
                </select>
                {errors.locationId && (
                  <p className="mt-2 text-sm text-red-600">{errors.locationId.message}</p>
                )}
                {selectedCustomerId && locations && locations.length === 0 && (
                  <p className="mt-2 text-sm text-yellow-600">
                    No locations found for this customer. Please add locations to the customer first.
                  </p>
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
              <p className="text-gray-900 text-sm">Provide comprehensive enquiry information</p>
            </div>
            <div className="px-6 pb-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="enquiryDate" className="block text-sm font-medium text-gray-900">
                    Enquiry Date
                  </label>
                  <input
                    type="date"
                    id="enquiryDate"
                    {...register('enquiryDate')}
                    className="mt-1 block w-full pl-3 pr-3 py-2 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-black bg-white"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="region" className="block text-sm font-medium text-gray-900">
                    Region
                  </label>
                  <input
                    id="region"
                    {...register('region')}
                    className="mt-1 block w-full pl-3 pr-3 py-2 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-black bg-white"
                    placeholder="Auto-filled from location or enter manually"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="oaNumber" className="block text-sm font-medium text-gray-900">
                    O.A. No. (Order Acknowledge Number)
                  </label>
                  <input
                    id="oaNumber"
                    {...register('oaNumber')}
                    className="mt-1 block w-full pl-3 pr-3 py-2 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-black bg-white"
                    placeholder="Enter O.A. number"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="dateOfReceipt" className="block text-sm font-medium text-gray-900">
                    Date of Receipt
                  </label>
                  <input
                    type="date"
                    id="dateOfReceipt"
                    {...register('dateOfReceipt')}
                    className="mt-1 block w-full pl-3 pr-3 py-2 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-black bg-white"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="subject" className="block text-sm font-medium text-gray-900">
                    Subject
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
                  <label htmlFor="blockModel" className="block text-sm font-medium text-gray-900">
                    Block Model
                  </label>
                  <input
                    id="blockModel"
                    {...register('blockModel')}
                    className="mt-1 block w-full pl-3 pr-3 py-2 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-black bg-white"
                    placeholder="Enter block model"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="numberOfBlocks" className="block text-sm font-medium text-gray-900">
                    No. of Blocks
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    id="numberOfBlocks"
                    {...register('numberOfBlocks', { valueAsNumber: true })}
                    className="mt-1 block w-full pl-3 pr-3 py-2 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-black bg-white"
                    placeholder="Enter number of blocks"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="designRequired" className="block text-sm font-medium text-gray-900">
                    Design Required
                  </label>
                  <select
                    id="designRequired"
                    {...register('designRequired')}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-black bg-white"
                  >
                    <option value="Standard" className="text-black bg-white">Standard</option>
                    <option value="Custom" className="text-black bg-white">Custom</option>
                    <option value="Modified" className="text-black bg-white">Modified</option>
                    <option value="None" className="text-black bg-white">None</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label htmlFor="attendedById" className="block text-sm font-medium text-gray-900">
                    Attended By
                  </label>
                  <select
                    id="attendedById"
                    {...register('attendedById')}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-black bg-white"
                    disabled={isLoadingEmployees}
                  >
                    <option value="" className="text-black bg-white">
                      {isLoadingEmployees ? 'Loading employees...' : 'Select employee'}
                    </option>
                    {employees?.map((employee) => (
                      <option key={employee.id} value={employee.id} className="text-black bg-white">
                        {employee.name} ({employee.role})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label htmlFor="quotationNumber" className="block text-sm font-medium text-gray-900">
                    Quotation Ref. Number
                  </label>
                  <input
                    id="quotationNumber"
                    {...register('quotationNumber')}
                    className={`mt-1 block w-full pl-3 pr-3 py-2 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-black bg-white ${
                      errors.quotationNumber ? 'border-red-300' : ''
                    }`}
                    placeholder="e.g., Q202412345678"
                  />
                  {errors.quotationNumber && (
                    <p className="mt-2 text-sm text-red-600">{errors.quotationNumber.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label htmlFor="status" className="block text-sm font-medium text-gray-900">
                    Status
                  </label>
                  <select
                    id="status"
                    {...register('status')}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-black bg-white"
                  >
                    <option value="LIVE" className="text-black bg-white">LIVE</option>
                    <option value="DEAD" className="text-black bg-white">DEAD</option>
                    <option value="RCD" className="text-black bg-white">RCD (Received)</option>
                    <option value="LOST" className="text-black bg-white">LOST</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label htmlFor="customerType" className="block text-sm font-medium text-gray-900">
                    New/Old Customer
                  </label>
                  <select
                    id="customerType"
                    {...register('customerType')}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-black bg-white"
                  >
                    <option value="NEW" className="text-black bg-white">NEW</option>
                    <option value="OLD" className="text-black bg-white">OLD</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Details */}
          <div className="bg-white rounded-xl border shadow-sm">
            <div className="px-6 pt-6">
              <h4 className="text-lg font-semibold text-gray-900 flex items-center">
                <FileText className="w-5 h-5 mr-2 text-blue-600" />
                Additional Details
              </h4>
              <p className="text-gray-900 text-sm">Optional additional information</p>
            </div>
            <div className="px-6 pb-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="priority" className="block text-sm font-medium text-gray-900">
                    Priority
                  </label>
                  <select
                    id="priority"
                    {...register('priority')}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-black bg-white"
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
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-black bg-white"
                  >
                    <option value="Website" className="text-black bg-white">Website</option>
                    <option value="Email" className="text-black bg-white">Email</option>
                    <option value="Phone" className="text-black bg-white">Phone</option>
                    <option value="Referral" className="text-black bg-white">Referral</option>
                    <option value="Trade Show" className="text-black bg-white">Trade Show</option>
                    <option value="Social Media" className="text-black bg-white">Social Media</option>
                    <option value="Visit" className="text-black bg-white">Visit</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label htmlFor="timeline" className="block text-sm font-medium text-gray-900">
                    Timeline
                  </label>
                  <input
                    id="timeline"
                    {...register('timeline')}
                    className="mt-1 block w-full pl-3 pr-3 py-2 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-black bg-white"
                    placeholder="e.g., 2-3 weeks"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="requirements" className="block text-sm font-medium text-gray-900">
                    Requirements
                  </label>
                  <input
                    id="requirements"
                    {...register('requirements')}
                    className="mt-1 block w-full pl-3 pr-3 py-2 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-black bg-white"
                    placeholder="e.g., Specific requirements"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="description" className="block text-sm font-medium text-gray-900">
                  Description
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
              </div>

              <div className="space-y-2">
                <label htmlFor="notes" className="block text-sm font-medium text-gray-900">
                  Notes
                </label>
                <textarea
                  id="notes"
                  {...register('notes')}
                  rows={3}
                  className="mt-1 block w-full pl-3 pr-3 py-2 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-black bg-white placeholder-gray-500"
                  placeholder="Additional notes..."
                />
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
              disabled={isSubmitting} 
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
        </div>
        </form>
      </div>
    </div>
  );
}
