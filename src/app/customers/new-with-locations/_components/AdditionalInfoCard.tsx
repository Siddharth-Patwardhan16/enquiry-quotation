'use client';

import React from 'react';
import { useFormContext } from 'react-hook-form';
import { Info } from 'lucide-react';
import { CompanyFormData } from '../_types/company.types';

export function AdditionalInfoCard() {
  const { register, formState: { errors } } = useFormContext<CompanyFormData>();

  return (
    <div className="bg-white rounded-xl border shadow-sm">
      <div className="px-6 pt-6">
        <h4 className="text-lg font-semibold text-gray-900 flex items-center">
          <Info className="w-5 h-5 mr-2 text-gray-600" />
          Additional Information
        </h4>
        <p className="text-gray-600 text-sm">Enter any additional details about the company</p>
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
          {errors.existingGraphiteSuppliers && (
            <p className="mt-1 text-sm text-red-600">{errors.existingGraphiteSuppliers.message}</p>
          )}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Problems Faced
          </label>
          <textarea
            {...register('problemsFaced')}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
            placeholder="Describe any problems faced with the company..."
          />
          {errors.problemsFaced && (
            <p className="mt-1 text-sm text-red-600">{errors.problemsFaced.message}</p>
          )}
        </div>
      </div>
    </div>
  );
}
