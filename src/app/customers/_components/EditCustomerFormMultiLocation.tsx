'use client';

import { useForm, useFieldArray } from 'react-hook-form';
import { api } from '@/trpc/client';
import { Save, X, Building, Factory, Package, Info, Plus, Trash2 } from 'lucide-react';
import { useToast } from '@/components/ui/toast';

type FormData = {
  id: string;
  name: string;
  isNew: boolean;
  offices: Array<{
    id?: string;
    name: string;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    receptionNumber?: string;
  }>;
  plants: Array<{
    id?: string;
    name: string;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    receptionNumber?: string;
  }>;
  poRuptureDiscs: boolean;
  poThermowells: boolean;
  poHeatExchanger: boolean;
  poMiscellaneous: boolean;
  poWaterJetSteamJet: boolean;
  existingGraphiteSuppliers?: string;
  problemsFaced?: string;
};

interface Customer {
  id: string;
  name: string;
  isNew: boolean;
  createdAt: Date;
  updatedAt: Date;
  poRuptureDiscs: boolean;
  poThermowells: boolean;
  poHeatExchanger: boolean;
  poMiscellaneous: boolean;
  poWaterJetSteamJet: boolean;
  existingGraphiteSuppliers?: string | null;
  problemsFaced?: string | null;
  locations?: Array<{
    id: string;
    name: string;
    type: 'OFFICE' | 'PLANT';
    address?: string | null;
    city?: string | null;
    state?: string | null;
    country?: string | null;
    receptionNumber?: string | null;
  }>;
}

interface EditCustomerFormMultiLocationProps {
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

export function EditCustomerFormMultiLocation({ customer, onCancel, onSuccess }: EditCustomerFormMultiLocationProps) {
  const { success, error: showError } = useToast();
  const utils = api.useUtils();

  // Separate offices and plants from locations
  const offices = customer.locations?.filter(loc => loc.type === 'OFFICE') ?? [];
  const plants = customer.locations?.filter(loc => loc.type === 'PLANT') ?? [];

  const {
    register,
    handleSubmit,
    control,
    watch,
    // reset, // Unused variable commented out
    formState: { errors, isValid },
  } = useForm<FormData>({
    // resolver: zodResolver(EditCustomerMultiLocationSchema), // Temporarily disabled due to TypeScript issues
    defaultValues: {
      id: customer.id,
      name: customer.name,
      isNew: customer.isNew,
      offices: offices.length > 0 ? offices.map(office => ({
        name: office.name,
        address: office.address ?? undefined,
        city: office.city ?? undefined,
        state: office.state ?? undefined,
        country: office.country ?? undefined,
        receptionNumber: office.receptionNumber ?? undefined,
      })) : [{ name: '', address: '', city: '', state: '', country: 'India', receptionNumber: '' }],
      plants: plants.map(plant => ({
        name: plant.name,
        address: plant.address ?? undefined,
        city: plant.city ?? undefined,
        state: plant.state ?? undefined,
        country: plant.country ?? undefined,
        receptionNumber: plant.receptionNumber ?? undefined,
      })),
      poRuptureDiscs: customer.poRuptureDiscs,
      poThermowells: customer.poThermowells,
      poHeatExchanger: customer.poHeatExchanger,
      poMiscellaneous: customer.poMiscellaneous,
      poWaterJetSteamJet: customer.poWaterJetSteamJet,
      existingGraphiteSuppliers: customer.existingGraphiteSuppliers ?? '',
      problemsFaced: customer.problemsFaced ?? '',
    },
    mode: 'onChange',
  });

  const { fields: officeFields, append: appendOffice, remove: removeOffice } = useFieldArray({
    control,
    name: 'offices',
  });

  const { fields: plantFields, append: appendPlant, remove: removePlant } = useFieldArray({
    control,
    name: 'plants',
  });

  const updateCustomer = api.customer.update.useMutation({
    onSuccess: () => {
      utils.customer.getAll.invalidate();
      success('Customer Updated Successfully!', 'Customer information has been updated.');
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
    updateCustomer.mutate(data);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Edit Customer</h2>
        <button
          onClick={onCancel}
          className="inline-flex items-center justify-center w-10 h-10 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
          title="Cancel"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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

        {/* Offices Section */}
        <div className="bg-white rounded-xl border shadow-sm">
          <div className="px-6 pt-6">
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-semibold text-gray-900 flex items-center">
                <Building className="w-5 h-5 mr-2 text-blue-600" />
                Offices ({officeFields.length}/4)
              </h4>
              {officeFields.length < 4 && (
                <button
                  type="button"
                  onClick={() => appendOffice({ name: '', address: '', city: '', state: '', country: 'India', receptionNumber: '' })}
                  className="inline-flex items-center px-3 py-1 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Office
                </button>
              )}
            </div>
            <p className="text-gray-600 text-sm">Enter office details and contacts</p>
          </div>
          <div className="px-6 pb-6 space-y-6">
            {officeFields.map((field, index) => (
              <div key={field.id} className="border border-gray-200 rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h5 className="text-md font-medium text-gray-900">Office {index + 1}</h5>
                  {officeFields.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeOffice(index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-900">
                    Office Name *
                  </label>
                  <input 
                    {...register(`offices.${index}.name`)} 
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black ${
                      errors.offices?.[index]?.name ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Enter office name (e.g., Head Office, Regional Office)"
                  />
                  {errors.offices?.[index]?.name && (
                    <p className="text-sm text-red-500">{errors.offices[index]?.name?.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-900">
                    Address
                  </label>
                  <input 
                    {...register(`offices.${index}.address`)} 
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                    placeholder="Enter office address"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-900">
                      City/Town
                    </label>
                    <input 
                      {...register(`offices.${index}.city`)} 
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                      placeholder="Enter city/town"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-900">
                      State
                    </label>
                    {watch(`offices.${index}.country`) === 'India' ? (
                      <select
                        {...register(`offices.${index}.state`)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black bg-white"
                      >
                        <option value="">Select State</option>
                        {INDIAN_STATES.map((state) => (
                          <option key={state} value={state}>{state}</option>
                        ))}
                      </select>
                    ) : (
                      <input 
                        {...register(`offices.${index}.state`)} 
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                        placeholder="Enter state/province"
                      />
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-900">
                      Country
                    </label>
                    <select
                      {...register(`offices.${index}.country`)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black bg-white"
                    >
                      {COUNTRIES.map((country) => (
                        <option key={country} value={country}>{country}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-900">
                    Reception Number
                  </label>
                  <input 
                    {...register(`offices.${index}.receptionNumber`)} 
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                    placeholder="Enter reception number"
                  />
                </div>
              </div>
            ))}
            {errors.offices && (
              <p className="text-sm text-red-500">{errors.offices.message}</p>
            )}
          </div>
        </div>

        {/* Plants Section */}
        <div className="bg-white rounded-xl border shadow-sm">
          <div className="px-6 pt-6">
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-semibold text-gray-900 flex items-center">
                <Factory className="w-5 h-5 mr-2 text-green-600" />
                Plants ({plantFields.length}/20)
              </h4>
              {plantFields.length < 20 && (
                <button
                  type="button"
                  onClick={() => appendPlant({ name: '', address: '', city: '', state: '', country: 'India', receptionNumber: '' })}
                  className="inline-flex items-center px-3 py-1 text-sm font-medium text-green-600 bg-green-50 border border-green-200 rounded-md hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Plant
                </button>
              )}
            </div>
            <p className="text-gray-600 text-sm">Enter plant details and contacts (optional)</p>
          </div>
          <div className="px-6 pb-6 space-y-6">
            {plantFields.map((field, index) => (
              <div key={field.id} className="border border-gray-200 rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h5 className="text-md font-medium text-gray-900">Plant {index + 1}</h5>
                  <button
                    type="button"
                    onClick={() => removePlant(index)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-900">
                    Plant Name *
                  </label>
                  <input 
                    {...register(`plants.${index}.name`)} 
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black ${
                      errors.plants?.[index]?.name ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Enter plant name (e.g., Manufacturing Plant, Production Unit)"
                  />
                  {errors.plants?.[index]?.name && (
                    <p className="text-sm text-red-500">{errors.plants[index]?.name?.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-900">
                    Address
                  </label>
                  <input 
                    {...register(`plants.${index}.address`)} 
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                    placeholder="Enter plant address"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-900">
                      City/Town
                    </label>
                    <input 
                      {...register(`plants.${index}.city`)} 
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                      placeholder="Enter plant city/town"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-900">
                      State
                    </label>
                    {watch(`plants.${index}.country`) === 'India' ? (
                      <select
                        {...register(`plants.${index}.state`)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black bg-white"
                      >
                        <option value="">Select State</option>
                        {INDIAN_STATES.map((state) => (
                          <option key={state} value={state}>{state}</option>
                        ))}
                      </select>
                    ) : (
                      <input 
                        {...register(`plants.${index}.state`)} 
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                        placeholder="Enter plant state/province"
                      />
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-900">
                      Country
                    </label>
                    <select
                      {...register(`plants.${index}.country`)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black bg-white"
                    >
                      {COUNTRIES.map((country) => (
                        <option key={country} value={country}>{country}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-900">
                    Reception Number
                  </label>
                  <input 
                    {...register(`plants.${index}.receptionNumber`)} 
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                    placeholder="Enter plant reception number"
                  />
                </div>
              </div>
            ))}
            {errors.plants && (
              <p className="text-sm text-red-500">{errors.plants.message}</p>
            )}
          </div>
        </div>

        {/* PO Information Section */}
        <div className="bg-white rounded-xl border shadow-sm">
          <div className="px-6 pt-6">
            <h4 className="text-lg font-semibold text-gray-900 flex items-center">
              <Package className="w-5 h-5 mr-2 text-purple-600" />
              Purchase Orders Received
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
                    Miscellaneous
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
                    Water Jet/Steam Jet
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Information Section */}
        <div className="bg-white rounded-xl border shadow-sm">
          <div className="px-6 pt-6">
            <h4 className="text-lg font-semibold text-gray-900 flex items-center">
              <Info className="w-5 h-5 mr-2 text-gray-600" />
              Additional Information
            </h4>
            <p className="text-gray-600 text-sm">Enter any additional details about the customer</p>
          </div>
          <div className="px-6 pb-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Existing Graphite Suppliers
              </label>
              <textarea
                {...register('existingGraphiteSuppliers')}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                placeholder="List any existing graphite suppliers..."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Problems Faced
              </label>
              <textarea
                {...register('problemsFaced')}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                placeholder="Describe any problems faced with the customer..."
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end items-center pt-6 border-t border-gray-200 space-x-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={updateCustomer.isPending || !isValid}
            className="inline-flex items-center px-6 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {updateCustomer.isPending ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Updating...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Update Customer
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

