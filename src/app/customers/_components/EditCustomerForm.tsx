'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CreateCustomerSchema } from '@/lib/validators/customer';
import type { z } from 'zod';
import { api } from '@/trpc/client';
import { Save, X, Building, Factory, Package, Info } from 'lucide-react';
import { useEffect } from 'react';
import { useToast } from '@/components/ui/toast';

type FormData = z.infer<typeof CreateCustomerSchema>;

interface Customer {
  id: string;
  name: string;
  isNew: boolean;
  officeAddress?: string | null;
  officeCity?: string | null;
  officeState?: string | null;
  officeCountry?: string | null;
  officeReceptionNumber?: string | null;
  plantAddress?: string | null;
  plantCity?: string | null;
  plantState?: string | null;
  plantCountry?: string | null;
  plantReceptionNumber?: string | null;
  poRuptureDiscs?: boolean;
  poThermowells?: boolean;
  poHeatExchanger?: boolean;
  poMiscellaneous?: boolean;
  poWaterJetSteamJet?: boolean;
  existingGraphiteSuppliers?: string | null;
  problemsFaced?: string | null;
}

interface EditCustomerFormProps {
  customer: Customer;
  onCancel: () => void;
  onSuccess: () => void;
}

// Indian states data
const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
  'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal'
];

// Countries data
const COUNTRIES = [
  'India', 'United States', 'United Kingdom', 'Canada', 'Australia',
  'Germany', 'France', 'Japan', 'China', 'South Korea',
  'Brazil', 'Mexico', 'Russia', 'Italy', 'Spain',
  'Netherlands', 'Switzerland', 'Sweden', 'Norway', 'Denmark'
];

export function EditCustomerForm({ customer, onCancel, onSuccess }: EditCustomerFormProps) {
  const { success, error: showError } = useToast();
  const utils = api.useUtils();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isValid },
  } = useForm<FormData>({
    resolver: zodResolver(CreateCustomerSchema) as any,
    defaultValues: {
      name: customer.name,
      isNew: customer.isNew,
      officeAddress: customer.officeAddress || '',
      officeCity: customer.officeCity || '',
      officeState: customer.officeState || '',
      officeCountry: customer.officeCountry || 'India',
      officeReceptionNumber: customer.officeReceptionNumber || '',
      plantAddress: customer.plantAddress || '',
      plantCity: customer.plantCity || '',
      plantState: customer.plantState || '',
      plantCountry: customer.plantCountry || 'India',
      plantReceptionNumber: customer.plantReceptionNumber || '',
      poRuptureDiscs: Boolean(customer.poRuptureDiscs),
      poThermowells: Boolean(customer.poThermowells),
      poHeatExchanger: Boolean(customer.poHeatExchanger),
      poMiscellaneous: Boolean(customer.poMiscellaneous),
      poWaterJetSteamJet: Boolean(customer.poWaterJetSteamJet),
      existingGraphiteSuppliers: customer.existingGraphiteSuppliers || '',
      problemsFaced: customer.problemsFaced || '',
    },
    mode: 'onChange',
  });

  const watchedOfficeCountry = watch('officeCountry');
  const watchedPlantCountry = watch('plantCountry');

  // Update form when customer changes
  useEffect(() => {
    reset({
      name: customer.name,
      isNew: customer.isNew,
      officeAddress: customer.officeAddress || '',
      officeCity: customer.officeCity || '',
      officeState: customer.officeState || '',
      officeCountry: customer.officeCountry || 'India',
      officeReceptionNumber: customer.officeReceptionNumber || '',
      plantAddress: customer.plantAddress || '',
      plantCity: customer.plantCity || '',
      plantState: customer.plantState || '',
      plantCountry: customer.plantCountry || 'India',
      plantReceptionNumber: customer.plantReceptionNumber || '',
      poRuptureDiscs: Boolean(customer.poRuptureDiscs),
      poThermowells: Boolean(customer.poThermowells),
      poHeatExchanger: Boolean(customer.poHeatExchanger),
      poMiscellaneous: Boolean(customer.poMiscellaneous),
      poWaterJetSteamJet: Boolean(customer.poWaterJetSteamJet),
      existingGraphiteSuppliers: customer.existingGraphiteSuppliers || '',
      problemsFaced: customer.problemsFaced || '',
    });
  }, [customer, reset]);

  const updateCustomer = api.customer.update.useMutation({
    onSuccess: () => {
      utils.customer.getAll.invalidate();
      success('Customer Updated', 'The customer has been successfully updated.');
      onSuccess();
    },
    onError: (error) => {
      showError('Update Failed', `Failed to update customer: ${error.message}`);
    },
  });

  const onSubmit = (data: FormData) => {
    if (!isValid) {
      showError('Validation Error', 'Please fill in all required fields correctly.');
      return;
    }
    
    updateCustomer.mutate({
      id: customer.id,
      ...data,
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Edit Customer</h2>
          <button
            onClick={onCancel}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="bg-white rounded-xl border shadow-sm">
            <div className="px-6 pt-6">
              <h4 className="text-lg font-semibold text-gray-900">Basic Information</h4>
              <p className="text-gray-600 text-sm">Enter the primary details for the customer</p>
            </div>
            <div className="px-6 pb-6 space-y-4">
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium text-gray-900">
                  Customer Name *
                </label>
                <input 
                  id="name" 
                  {...register('name')} 
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black ${
                    errors.name ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Enter customer name"
                />
                {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
              </div>
            </div>
          </div>

          {/* Office Information */}
          <div className="bg-white rounded-xl border shadow-sm">
            <div className="px-6 pt-6">
              <h4 className="text-lg font-semibold text-gray-900 flex items-center">
                <Building className="w-5 h-5 mr-2 text-blue-600" />
                Office Information (Maximum 4 offices)
              </h4>
              <p className="text-gray-600 text-sm">Enter office details and contacts</p>
            </div>
            <div className="px-6 pb-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="officeReceptionNumber" className="text-sm font-medium text-gray-900">
                    Reception Number
                  </label>
                  <input 
                    id="officeReceptionNumber" 
                    {...register('officeReceptionNumber')} 
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                    placeholder="Enter reception number"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="officeAddress" className="text-sm font-medium text-gray-900">
                  Address
                </label>
                <input 
                  id="officeAddress" 
                  {...register('officeAddress')} 
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                  placeholder="Enter office address"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label htmlFor="officeCity" className="text-sm font-medium text-gray-900">
                    City/Town
                  </label>
                  <input 
                    id="officeCity" 
                    {...register('officeCity')} 
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                    placeholder="Enter city/town"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="officeState" className="text-sm font-medium text-gray-900">
                    State
                  </label>
                  {watchedOfficeCountry === 'India' ? (
                    <select
                      id="officeState"
                      {...register('officeState')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black bg-white"
                    >
                      <option value="">Select State</option>
                      {INDIAN_STATES.map((state) => (
                        <option key={state} value={state}>{state}</option>
                      ))}
                    </select>
                  ) : (
                    <input 
                      id="officeState" 
                      {...register('officeState')} 
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                      placeholder="Enter state/province"
                    />
                  )}
                </div>

                <div className="space-y-2">
                  <label htmlFor="officeCountry" className="text-sm font-medium text-gray-900">
                    Country
                  </label>
                  <select
                    id="officeCountry"
                    {...register('officeCountry')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black bg-white"
                  >
                    {COUNTRIES.map((country) => (
                      <option key={country} value={country}>{country}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Plant Information */}
          <div className="bg-white rounded-xl border shadow-sm">
            <div className="px-6 pt-6">
              <h4 className="text-lg font-semibold text-gray-900 flex items-center">
                <Factory className="w-5 h-5 mr-2 text-green-600" />
                Plant Information (Maximum 20 Plants)
              </h4>
              <p className="text-gray-600 text-sm">Enter plant details and contacts</p>
            </div>
            <div className="px-6 pb-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="plantReceptionNumber" className="text-sm font-medium text-gray-900">
                    Reception Number
                  </label>
                  <input 
                    id="plantReceptionNumber" 
                    {...register('plantReceptionNumber')} 
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                    placeholder="Enter plant reception number"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="plantAddress" className="text-sm font-medium text-gray-900">
                  Address
                </label>
                <input 
                  id="plantAddress" 
                  {...register('plantAddress')} 
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                  placeholder="Enter plant address"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label htmlFor="plantCity" className="text-sm font-medium text-gray-900">
                    City/Town
                  </label>
                  <input 
                    id="plantCity" 
                    {...register('plantCity')} 
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                    placeholder="Enter plant city/town"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="plantState" className="text-sm font-medium text-gray-900">
                    State
                  </label>
                  {watchedPlantCountry === 'India' ? (
                    <select
                      id="plantState"
                      {...register('plantState')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black bg-white"
                    >
                      <option value="">Select State</option>
                      {INDIAN_STATES.map((state) => (
                        <option key={state} value={state}>{state}</option>
                      ))}
                    </select>
                  ) : (
                    <input 
                      id="plantState" 
                      {...register('plantState')} 
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                      placeholder="Enter plant state/province"
                    />
                  )}
                </div>

                <div className="space-y-2">
                  <label htmlFor="plantCountry" className="text-sm font-medium text-gray-900">
                    Country
                  </label>
                  <select
                    id="plantCountry"
                    {...register('plantCountry')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black bg-white"
                  >
                    {COUNTRIES.map((country) => (
                      <option key={country} value={country}>{country}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* PO Received from Customer */}
          <div className="bg-white rounded-xl border shadow-sm">
            <div className="px-6 pt-6">
              <h4 className="text-lg font-semibold text-gray-900 flex items-center">
                <Package className="w-5 h-5 mr-2 text-purple-600" />
                PO Received from Customer
              </h4>
              <p className="text-gray-600 text-sm">Tick the types of POs received from the customer</p>
            </div>
            <div className="px-6 pb-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="poRuptureDiscs"
                      {...register('poRuptureDiscs')}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                    />
                    <label htmlFor="poRuptureDiscs" className="text-sm font-medium text-gray-900">
                      Rupture Discs
                    </label>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="poThermowells"
                      {...register('poThermowells')}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                    />
                    <label htmlFor="poThermowells" className="text-sm font-medium text-gray-900">
                      Thermowells
                    </label>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="poHeatExchanger"
                      {...register('poHeatExchanger')}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                    />
                    <label htmlFor="poHeatExchanger" className="text-sm font-medium text-gray-900">
                      Heat Exchanger
                    </label>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="poMiscellaneous"
                      {...register('poMiscellaneous')}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                    />
                    <label htmlFor="poMiscellaneous" className="text-sm font-medium text-gray-900">
                      Miscellaneous (Repair, Special Components)
                    </label>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="poWaterJetSteamJet"
                      {...register('poWaterJetSteamJet')}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                    />
                    <label htmlFor="poWaterJetSteamJet" className="text-sm font-medium text-gray-900">
                      Water Jet / Steam Jet Ejector
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <div className="bg-white rounded-xl border shadow-sm">
            <div className="px-6 pt-6">
              <h4 className="text-lg font-semibold text-gray-900 flex items-center">
                <Info className="w-5 h-5 mr-2 text-orange-600" />
                Additional Information
              </h4>
              <p className="text-gray-600 text-sm">Enter additional customer information</p>
            </div>
            <div className="px-6 pb-6 space-y-4">
              <div className="space-y-2">
                <label htmlFor="existingGraphiteSuppliers" className="text-sm font-medium text-gray-900">
                  Existing Graphite HE supplier(s) (Maximum 5 Numbers)
                </label>
                <input 
                  id="existingGraphiteSuppliers" 
                  {...register('existingGraphiteSuppliers')} 
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                  placeholder="Enter existing graphite heat exchanger suppliers"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="problemsFaced" className="text-sm font-medium text-gray-900">
                  Problems Faced
                </label>
                <textarea 
                  id="problemsFaced" 
                  {...register('problemsFaced')} 
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                  placeholder="Describe any problems faced by the customer"
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updateCustomer.isPending}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              <Save className="w-4 h-4 mr-2" />
              {updateCustomer.isPending ? 'Updating...' : 'Update Customer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
