'use client';

import React from 'react';
import { useFormContext } from 'react-hook-form';
import { Building2 } from 'lucide-react';
import { CompanyFormData } from '../_types/company.types';

interface CompanyInfoCardProps {}

export function CompanyInfoCard({}: CompanyInfoCardProps) {
  const { register, formState: { errors } } = useFormContext<CompanyFormData>();

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <h2 className="text-lg font-semibold mb-4 flex items-center">
        <Building2 className="w-5 h-5 mr-2 text-blue-600" />
        Company Information
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Company Name *
          </label>
          <input
            {...register('companyName')}
            placeholder="e.g., DMCC Industries Pvt Ltd"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {errors.companyName && (
            <p className="mt-1 text-sm text-red-600">{errors.companyName.message}</p>
          )}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Industry
          </label>
          <input
            {...register('industry')}
            placeholder="e.g., Manufacturing"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        
        <div className="md:col-span-3">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Company Website
          </label>
          <input
            {...register('website')}
            type="url"
            placeholder="https://www.company.com"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {errors.website && (
            <p className="mt-1 text-sm text-red-600">{errors.website.message}</p>
          )}
        </div>
      </div>
    </div>
  );
}
