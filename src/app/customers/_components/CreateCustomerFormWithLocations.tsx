'use client';

import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '@/trpc/client';
import { Save, Building, Factory, Package, Info, Plus, X } from 'lucide-react';
import { useToastContext } from '@/components/providers/ToastProvider';
import { useFormConfirmation } from '@/hooks/useFormConfirmation';

// Simplified schema for the form
const FormSchema = z.object({
  name: z.string().min(2, 'Customer name is required'),
  isNew: z.boolean(),
  offices: z.array(z.object({
    name: z.string().min(2, 'Office name is required'),
    address: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    country: z.string().optional(),
    receptionNumber: z.string().optional(),
  })).min(1, 'At least one office is required'),
  plants: z.array(z.object({
    name: z.string().min(2, 'Plant name is required'),
    address: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    country: z.string().optional(),
    receptionNumber: z.string().optional(),
  })).optional(),
  poRuptureDiscs: z.boolean(),
  poThermowells: z.boolean(),
  poHeatExchanger: z.boolean(),
  poMiscellaneous: z.boolean(),
  poWaterJetSteamJet: z.boolean(),
  existingGraphiteSuppliers: z.string().optional(),
  problemsFaced: z.string().optional(),
});

type FormData = z.infer<typeof FormSchema>;

interface CreateCustomerFormWithLocationsProps {
  onSuccess?: () => void;
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

export function CreateCustomerFormWithLocations({ onSuccess }: CreateCustomerFormWithLocationsProps) {
  const { success, error: showError } = useToastContext();
  const utils = api.useUtils();
  const { confirmFormClose } = useFormConfirmation();

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    // setError, // Unused variable commented out
    // clearErrors, // Unused variable commented out
    formState: { errors, isValid },
  } = useForm<FormData>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      name: '',
      isNew: true,
      offices: [{ name: '', country: 'India' }],
      plants: [],
      poRuptureDiscs: false,
      poThermowells: false,
      poHeatExchanger: false,
      poMiscellaneous: false,
      poWaterJetSteamJet: false,
      existingGraphiteSuppliers: '',
      problemsFaced: '',
    },
    mode: 'onSubmit',
    reValidateMode: 'onChange',
  });

  // Manage dynamic arrays for offices and plants
  const { fields: officeFields, append: appendOffice, remove: removeOffice } = useFieldArray({
    control,
    name: 'offices',
  });

  const { fields: plantFields, append: appendPlant, remove: removePlant } = useFieldArray({
    control,
    name: 'plants',
  });

  const watchedOffices = watch('offices');
  const watchedPlants = watch('plants');

  // Create customer mutation
  const createCustomer = api.customer.create.useMutation({
    onSuccess: () => {
      utils.customer.getAll.invalidate();
      reset();
      success('Customer created successfully!');
      onSuccess?.();
    },
    onError: (error) => {
      console.error('Customer creation error:', error);
      
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
        showError('Error', error.message);
      }
    },
  });

  // Debounce office name changes
  // useEffect(() => {
  //   const timer = setTimeout(() => {
  //     const officeNames = watchedOffices?.map(office => office.name).filter(Boolean) ?? [];
  //     setDebouncedOfficeNames(officeNames);
  //   }, 500);

  //   return () => clearTimeout(timer);
  // }, [watchedOffices]);

  // // Debounce plant name changes
  // useEffect(() => {
  //   const timer = setTimeout(() => {
  //     const plantNames = watchedPlants?.map(plant => plant.name).filter(Boolean) ?? [];
  //     setDebouncedPlantNames(plantNames);
  //   }, 500);

  //   return () => clearTimeout(timer);
  // }, [watchedPlants]);

  // Note: Uniqueness validation removed for now - can be added back later if needed

  const onSubmit = (data: FormData) => {
    if (!isValid) {
      showError('Validation Error', 'Please fill in all required fields correctly.');
      return;
    }
    
    createCustomer.mutate(data);
  };

  const handleCancel = () => {
    confirmFormClose({
      hasUnsavedChanges: true,
      onConfirm: () => {
        if (onSuccess) {
          onSuccess();
        }
      }
    });
  };

  const addOffice = () => {
    appendOffice({ name: '', country: 'India' });
  };

  const addPlant = () => {
    appendPlant({ name: '', country: 'India' });
  };

  const removeOfficeField = (index: number) => {
    if (officeFields.length > 1) {
      removeOffice(index);
    }
  };

  const removePlantField = (index: number) => {
    removePlant(index);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">

      {/* Customer Name Section */}
      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Building className="w-5 h-5 text-blue-600" />
          Company Information
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Company Name *
            </label>
            <input
              {...register('name')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter company name"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <input
              {...register('isNew')}
              type="checkbox"
              id="isNew"
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
            />
            <label htmlFor="isNew" className="text-sm text-gray-700">
              This is a new customer
            </label>
          </div>
        </div>
      </div>

      {/* Offices Section */}
      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Building className="w-5 h-5 text-blue-600" />
          Offices
        </h3>
        
        <div className="space-y-4">
          {officeFields.map((field, index) => (
            <div key={field.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-gray-700">Office {index + 1}</h4>
                {officeFields.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeOfficeField(index)}
                    className="text-red-500 hover:text-red-700 p-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Office Name *
                  </label>
                  <input
                    {...register(`offices.${index}.name`)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Headquarters, Main Office"
                  />
                  {errors.offices?.[index]?.name && (
                    <p className="mt-1 text-sm text-red-600">{errors.offices[index]?.name?.message}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Country
                  </label>
                  <select
                    {...register(`offices.${index}.country`)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {COUNTRIES.map(country => (
                      <option key={country} value={country}>{country}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address
                  </label>
                  <input
                    {...register(`offices.${index}.address`)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Street address"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    City
                  </label>
                  <input
                    {...register(`offices.${index}.city`)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="City"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    State
                  </label>
                  {watchedOffices[index]?.country === 'India' ? (
                    <select
                      {...register(`offices.${index}.state`)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                    >
                      <option value="">Select State</option>
                      {INDIAN_STATES.map((state) => (
                        <option key={state} value={state}>{state}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      {...register(`offices.${index}.state`)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="State/Province"
                    />
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Reception Number
                  </label>
                  <input
                    {...register(`offices.${index}.receptionNumber`)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Phone number"
                  />
                </div>
              </div>
            </div>
          ))}
          
          <button
            type="button"
            onClick={addOffice}
            className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-gray-400 hover:text-gray-700 transition-colors flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Another Office
          </button>
        </div>
        
        {errors.offices && (
          <p className="mt-2 text-sm text-red-600">{errors.offices.message}</p>
        )}
      </div>

      {/* Plants Section */}
      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Factory className="w-5 h-5 text-green-600" />
          Plants
        </h3>
        
        <div className="space-y-4">
          {plantFields.map((field, index) => (
            <div key={field.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-gray-700">Plant {index + 1}</h4>
                <button
                  type="button"
                  onClick={() => removePlantField(index)}
                  className="text-red-500 hover:text-red-700 p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Plant Name *
                  </label>
                  <input
                    {...register(`plants.${index}.name`)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Main Factory, Production Plant"
                  />
                  {errors.plants?.[index]?.name && (
                    <p className="mt-1 text-sm text-red-600">{errors.plants[index]?.name?.message}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Country
                  </label>
                  <select
                    {...register(`plants.${index}.country`)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {COUNTRIES.map(country => (
                      <option key={country} value={country}>{country}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address
                  </label>
                  <input
                    {...register(`plants.${index}.address`)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Street address"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    City
                  </label>
                  <input
                    {...register(`plants.${index}.city`)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="City"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    State
                  </label>
                  {watchedPlants?.[index]?.country === 'India' ? (
                    <select
                      {...register(`plants.${index}.state`)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                    >
                      <option value="">Select State</option>
                      {INDIAN_STATES.map((state) => (
                        <option key={state} value={state}>{state}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      {...register(`plants.${index}.state`)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="State/Province"
                    />
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Reception Number
                  </label>
                  <input
                    {...register(`plants.${index}.receptionNumber`)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Phone number"
                  />
                </div>
              </div>
            </div>
          ))}
          
          <button
            type="button"
            onClick={addPlant}
            className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-gray-400 hover:text-gray-700 transition-colors flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Plant
          </button>
        </div>
        
        {errors.plants && (
          <p className="mt-2 text-sm text-red-600">{errors.plants.message}</p>
        )}
      </div>

      {/* PO Information Section */}
      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Package className="w-5 h-5 text-purple-600" />
          Purchase Orders Received
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="flex items-center gap-2">
            <input
              {...register('poRuptureDiscs')}
              type="checkbox"
              id="poRuptureDiscs"
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
            />
            <label htmlFor="poRuptureDiscs" className="text-sm text-gray-700">
              Rupture Discs
            </label>
          </div>
          
          <div className="flex items-center gap-2">
            <input
              {...register('poThermowells')}
              type="checkbox"
              id="poThermowells"
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
            />
            <label htmlFor="poThermowells" className="text-sm text-gray-700">
              Thermowells
            </label>
          </div>
          
          <div className="flex items-center gap-2">
            <input
              {...register('poHeatExchanger')}
              type="checkbox"
              id="poHeatExchanger"
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
            />
            <label htmlFor="poHeatExchanger" className="text-sm text-gray-700">
              Heat Exchanger
            </label>
          </div>
          
          <div className="flex items-center gap-2">
            <input
              {...register('poMiscellaneous')}
              type="checkbox"
              id="poMiscellaneous"
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
            />
            <label htmlFor="poMiscellaneous" className="text-sm text-gray-700">
              Miscellaneous
            </label>
          </div>
          
          <div className="flex items-center gap-2">
            <input
              {...register('poWaterJetSteamJet')}
              type="checkbox"
              id="poWaterJetSteamJet"
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
            />
            <label htmlFor="poWaterJetSteamJet" className="text-sm text-gray-700">
              Water Jet/Steam Jet
            </label>
          </div>
        </div>
      </div>

      {/* Additional Information Section */}
      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Info className="w-5 h-5 text-gray-600" />
          Additional Information
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Existing Graphite Suppliers
            </label>
            <textarea
              {...register('existingGraphiteSuppliers')}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Describe any problems or challenges..."
            />
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end space-x-3 pt-6 border-t">
        <button
          type="button"
          onClick={handleCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={createCustomer.isPending || !isValid}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {createCustomer.isPending ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block mr-2"></div>
              Creating...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 inline-block mr-2" />
              Create Customer
            </>
          )}
        </button>
      </div>
    </form>
  );
}
