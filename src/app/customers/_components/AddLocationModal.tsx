'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '@/trpc/client';
import { useToast } from '@/components/ui/toast';
import { Building, Factory, X, Plus } from 'lucide-react';

const AddLocationSchema = z.object({
  name: z.string().min(2, 'Location name is required'),
  type: z.enum(['OFFICE', 'PLANT']),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  receptionNumber: z.string().optional(),
});

type AddLocationData = z.infer<typeof AddLocationSchema>;

interface AddLocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  customerId: string;
  customerName: string;
  onSuccess?: () => void;
}

// Countries data
const COUNTRIES = [
  'India', 'United States', 'United Kingdom', 'Canada', 'Australia',
  'Germany', 'France', 'Japan', 'China', 'South Korea',
  'Brazil', 'Mexico', 'Russia', 'Italy', 'Spain',
  'Netherlands', 'Switzerland', 'Sweden', 'Norway', 'Denmark'
];

export function AddLocationModal({ 
  isOpen, 
  onClose, 
  customerId, 
  customerName, 
  onSuccess 
}: AddLocationModalProps) {
  const { success, error: showError } = useToast();
  const utils = api.useUtils();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isValid },
  } = useForm<AddLocationData>({
    resolver: zodResolver(AddLocationSchema),
    defaultValues: {
      name: '',
      type: 'OFFICE',
      country: 'India',
      address: '',
      city: '',
      state: '',
      receptionNumber: '',
    },
    mode: 'onChange',
  });

  const watchedType = watch('type');

  const addLocation = api.company.addLocation.useMutation({
    onSuccess: () => {
      utils.company.getAll.invalidate();
      reset();
      success('Location Added Successfully!', `New ${watchedType.toLowerCase()} has been added to ${customerName}.`);
      onSuccess?.();
      onClose();
    },
    onError: (error) => {
      showError('Failed to Add Location', error.message);
    },
  });

  const onSubmit = (data: AddLocationData) => {
    addLocation.mutate({
      ...data,
      customerId,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            {watchedType === 'OFFICE' ? (
              <Building className="w-5 h-5 text-blue-600" />
            ) : (
              <Factory className="w-5 h-5 text-green-600" />
            )}
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Add New {watchedType}
              </h3>
              <p className="text-sm text-gray-600">
                Add a new location to {customerName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          {/* Location Type Toggle */}
          <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
            <button
              type="button"
              onClick={() => watch('type') !== 'OFFICE' && reset({ ...watch(), type: 'OFFICE' })}
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                watchedType === 'OFFICE'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <Building className="w-4 h-4" />
              Office
            </button>
            <button
              type="button"
              onClick={() => watch('type') !== 'PLANT' && reset({ ...watch(), type: 'PLANT' })}
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                watchedType === 'PLANT'
                  ? 'bg-green-100 text-green-700'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <Factory className="w-4 h-4" />
              Plant
            </button>
          </div>

          {/* Location Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {watchedType} Name *
            </label>
            <input
              {...register('name')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder={`e.g., ${watchedType === 'OFFICE' ? 'Headquarters, Branch Office' : 'Main Factory, Production Plant'}`}
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          {/* Country */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Country
            </label>
            <select
              {...register('country')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {COUNTRIES.map(country => (
                <option key={country} value={country}>{country}</option>
              ))}
            </select>
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Address
            </label>
            <input
              {...register('address')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Street address"
            />
          </div>

          {/* City and State */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                City
              </label>
              <input
                {...register('city')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="City"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                State
              </label>
              <input
                {...register('state')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="State/Province"
              />
            </div>
          </div>

          {/* Reception Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Reception Number
            </label>
            <input
              {...register('receptionNumber')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Phone number"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={addLocation.isPending || !isValid}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {addLocation.isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Adding...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  Add {watchedType}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
