'use client';

import React, { useState } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Building2, MapPin, ArrowLeft } from 'lucide-react';
import { companyFormSchema, CompanyFormData } from '../_utils/validation';
import { CompanyInfoCard } from './CompanyInfoCard';
import { LocationManager } from './LocationManager';
import { PurchaseOrderCard } from './PurchaseOrderCard';
import { useRouter } from 'next/navigation';
import { api } from '@/trpc/client';
import { toast } from 'sonner';

export function CompanyForm() {
  const [activeTab, setActiveTab] = useState<'offices' | 'plants'>('offices');
  const router = useRouter();
  const utils = api.useUtils();

  const methods = useForm<CompanyFormData>({
    resolver: zodResolver(companyFormSchema),
    defaultValues: {
      companyName: '',
      offices: [{
        name: '',
        address: '',
        area: '',
        city: '',
        state: '',
        country: 'India',
        pincode: '',
        contacts: []
      }],
      plants: [],
      // Purchase Order fields
      poRuptureDiscs: false,
      poThermowells: false,
      poHeatExchanger: false,
      poMiscellaneous: false,
      poWaterJetSteamJet: false
    }
  });

  const createCompany = api.company.create.useMutation({
    onSuccess: (_data) => {
      toast.success('Company created successfully!');
      
      // Invalidate and refetch company data
      utils.company.getAll.invalidate();
      
      // Redirect to customers list after successful creation
      setTimeout(() => {
        router.push('/customers');
      }, 1000); // Small delay to show the success message
    },
    onError: (error) => {
      toast.error(`Failed to create company: ${error.message}`);
    }
  });

  const onSubmit = (data: CompanyFormData) => {
    createCompany.mutate(data);
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <div className="max-w-6xl mx-auto p-6 bg-gray-50 min-h-screen">
      <div className="space-y-6">
        
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button
                type="button"
                onClick={() => router.back()}
                className="mr-4 p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                title="Go back"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                  <Building2 className="w-7 h-7 mr-3 text-blue-600" />
                  Create New Company
                </h1>
                <p className="text-gray-600 mt-2">Add company information with multiple offices and plants</p>
              </div>
            </div>
          </div>
        </div>

        <FormProvider {...methods}>
          <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-6">
            {/* Step 1: Company Information */}
            <CompanyInfoCard />
            
            {/* Step 2: Location Management */}
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="border-b bg-gray-50">
                <nav className="flex -mb-px">
                  <button
                    type="button"
                    onClick={() => setActiveTab('offices')}
                    className={`py-4 px-6 border-b-2 font-medium text-sm flex items-center ${
                      activeTab === 'offices'
                        ? 'border-blue-500 text-blue-600 bg-white'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Building2 className="w-4 h-4 mr-2" />
                    Offices ({(() => {
                      const offices = methods.watch('offices');
                      return Array.isArray(offices) ? offices.length : 0;
                    })()})
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('plants')}
                    className={`py-4 px-6 border-b-2 font-medium text-sm flex items-center ${
                      activeTab === 'plants'
                        ? 'border-blue-500 text-blue-600 bg-white'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <MapPin className="w-4 h-4 mr-2" />
                    Plants ({(() => {
                      const plants = methods.watch('plants');
                      return Array.isArray(plants) ? plants.length : 0;
                    })()})
                  </button>
                </nav>
              </div>
              
              <div className="p-6">
                <LocationManager key={activeTab} type={activeTab} />
              </div>
            </div>
            
            {/* Step 3: Purchase Order Information */}
            <PurchaseOrderCard />
            
            {/* Submit Buttons */}
            <div className="flex justify-between items-center bg-white p-6 rounded-lg shadow-sm border">
              <div className="text-sm text-gray-600">
                Make sure all required fields are filled out correctly
              </div>
              <div className="flex space-x-4">
                <button 
                  type="button" 
                  onClick={handleCancel}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={createCompany.isPending}
                  className="px-8 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
                >
                  {createCompany.isPending ? 'Creating...' : 'Create Company'}
                </button>
              </div>
            </div>
          </form>
        </FormProvider>
      </div>
    </div>
  );
}
