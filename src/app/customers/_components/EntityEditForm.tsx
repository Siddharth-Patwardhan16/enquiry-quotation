'use client';

import { useState } from 'react';
import { X, Building, Factory, Users, Save, ArrowLeft } from 'lucide-react';
import { api } from '@/trpc/client';

interface ContactPerson {
  id: string;
  name: string;
  designation: string | null;
  phoneNumber: string | null;
  emailId: string | null;
  isPrimary: boolean;
}

interface Office {
  id: string;
  name: string;
  address: string | null;
  area?: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  pincode?: string | null;
  isHeadOffice: boolean;
  contactPersons: ContactPerson[];
}

interface Plant {
  id: string;
  name: string;
  address: string | null;
  area?: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  pincode?: string | null;
  plantType?: string | null;
  contactPersons: ContactPerson[];
}

interface Location {
  id: string;
  name: string;
  type: 'OFFICE' | 'PLANT';
  address?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  receptionNumber?: string | null;
}

interface Entity {
  id: string;
  name: string;
  type: 'customer' | 'company';
  isNew: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: {
    id: string;
    name: string;
    email: string;
    role?: string;
  } | null;
  poRuptureDiscs: boolean;
  poThermowells: boolean;
  poHeatExchanger: boolean;
  poMiscellaneous: boolean;
  poWaterJetSteamJet: boolean;
  existingGraphiteSuppliers?: string | null;
  problemsFaced?: string | null;
  locations?: Location[];
  offices?: Office[];
  plants?: Plant[];
}

interface EntityEditFormProps {
  entity: Entity;
  onCancel: () => void;
  onSuccess: () => void;
}

export function EntityEditForm({ entity, onCancel, onSuccess }: EntityEditFormProps) {
  const [formData, setFormData] = useState({
    name: entity.name,
    poRuptureDiscs: entity.poRuptureDiscs,
    poThermowells: entity.poThermowells,
    poHeatExchanger: entity.poHeatExchanger,
    poMiscellaneous: entity.poMiscellaneous,
    poWaterJetSteamJet: entity.poWaterJetSteamJet,
    existingGraphiteSuppliers: entity.existingGraphiteSuppliers ?? '',
    problemsFaced: entity.problemsFaced ?? '',
    offices: entity.offices ?? [],
    plants: entity.plants ?? [],
  });

  const [isLoading, setIsLoading] = useState(false);

  // Update company mutation
  const updateCompany = api.company.update.useMutation({
    onSuccess: () => {
      onSuccess();
    },
    onError: (error) => {
      console.error('Error updating company:', error);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (entity.type === 'company') {
        await updateCompany.mutateAsync({
          id: entity.id,
          name: formData.name,
          poRuptureDiscs: formData.poRuptureDiscs,
          poThermowells: formData.poThermowells,
          poHeatExchanger: formData.poHeatExchanger,
          poMiscellaneous: formData.poMiscellaneous,
          poWaterJetSteamJet: formData.poWaterJetSteamJet,
          existingGraphiteSuppliers: formData.existingGraphiteSuppliers ?? null,
          problemsFaced: formData.problemsFaced ?? null,
        });
      }
    } catch (error) {
      console.error('Error updating entity:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleOfficeChange = (officeIndex: number, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      offices: prev.offices.map((office, index) => 
        index === officeIndex 
          ? { ...office, [field]: value }
          : office
      )
    }));
  };

  const handlePlantChange = (plantIndex: number, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      plants: prev.plants.map((plant, index) => 
        index === plantIndex 
          ? { ...plant, [field]: value }
          : plant
      )
    }));
  };

  const handleOfficeContactChange = (officeIndex: number, contactIndex: number, field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      offices: prev.offices.map((office, oIndex) => 
        oIndex === officeIndex 
          ? {
              ...office,
              contactPersons: office.contactPersons.map((contact, cIndex) => 
                cIndex === contactIndex 
                  ? { ...contact, [field]: value }
                  : contact
              )
            }
          : office
      )
    }));
  };

  const handlePlantContactChange = (plantIndex: number, contactIndex: number, field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      plants: prev.plants.map((plant, pIndex) => 
        pIndex === plantIndex 
          ? {
              ...plant,
              contactPersons: plant.contactPersons.map((contact, cIndex) => 
                cIndex === contactIndex 
                  ? { ...contact, [field]: value }
                  : contact
              )
            }
          : plant
      )
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto transform transition-all">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <Building className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Edit {entity.type === 'company' ? 'Company' : 'Customer'}
              </h3>
              <p className="text-sm text-gray-500">
                Update {entity.type === 'company' ? 'company' : 'customer'} information
              </p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Building className="w-5 h-5 mr-2 text-blue-600" />
              Basic Information
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {entity.type === 'company' ? 'Company' : 'Customer'} Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
            </div>
          </div>

          {/* Purchase Order Information */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Building className="w-5 h-5 mr-2 text-blue-600" />
              Purchase Order Information
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.poRuptureDiscs}
                  onChange={(e) => handleInputChange('poRuptureDiscs', e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm text-gray-700">Rupture Discs</span>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.poThermowells}
                  onChange={(e) => handleInputChange('poThermowells', e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm text-gray-700">Thermowells</span>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.poHeatExchanger}
                  onChange={(e) => handleInputChange('poHeatExchanger', e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm text-gray-700">Heat Exchanger</span>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.poMiscellaneous}
                  onChange={(e) => handleInputChange('poMiscellaneous', e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm text-gray-700">Miscellaneous</span>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.poWaterJetSteamJet}
                  onChange={(e) => handleInputChange('poWaterJetSteamJet', e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm text-gray-700">Water Jet/Steam Jet</span>
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <div className="bg-green-50 rounded-lg p-4">
            <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Building className="w-5 h-5 mr-2 text-green-600" />
              Additional Information
            </h4>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Existing Graphite Suppliers
                </label>
                <textarea
                  value={formData.existingGraphiteSuppliers}
                  onChange={(e) => handleInputChange('existingGraphiteSuppliers', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="List existing graphite suppliers..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Problems Faced
                </label>
                <textarea
                  value={formData.problemsFaced}
                  onChange={(e) => handleInputChange('problemsFaced', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Describe any problems faced..."
                />
              </div>
            </div>
          </div>

          {/* Company-specific sections */}
          {entity.type === 'company' && (
            <>
              {/* Note about office/plant editing */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800">
                      Office and Plant Editing
                    </h3>
                    <div className="mt-2 text-sm text-yellow-700">
                      <p>You can edit office, plant, and contact person information below, but these changes will not be saved to the database yet. Only basic company information (name, purchase orders, additional info) will be saved.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Offices */}
              {entity.offices && entity.offices.length > 0 && (
                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Building className="w-5 h-5 mr-2 text-blue-600" />
                    Offices ({formData.offices.length})
                  </h4>
                  <div className="space-y-4">
                    {formData.offices.map((office, _index) => (
                      <div key={office.id} className="bg-white rounded-lg p-4 border">
                        <div className="flex items-center justify-between mb-3">
                          <h5 className="font-medium text-gray-900 flex items-center">
                            <Building className="w-4 h-4 mr-2 text-blue-600" />
                            {office.name}
                            {office.isHeadOffice && (
                              <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                                Head Office
                              </span>
                            )}
                          </h5>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                            <input
                              type="text"
                              value={office.address ?? ''}
                              onChange={(e) => handleOfficeChange(_index, 'address', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Area</label>
                            <input
                              type="text"
                              value={office.area ?? ''}
                              onChange={(e) => handleOfficeChange(_index, 'area', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                            <input
                              type="text"
                              value={office.city ?? ''}
                              onChange={(e) => handleOfficeChange(_index, 'city', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                            <input
                              type="text"
                              value={office.state ?? ''}
                              onChange={(e) => handleOfficeChange(_index, 'state', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                            <input
                              type="text"
                              value={office.country ?? ''}
                              onChange={(e) => handleOfficeChange(_index, 'country', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">PIN Code</label>
                            <input
                              type="text"
                              value={office.pincode ?? ''}
                              onChange={(e) => handleOfficeChange(_index, 'pincode', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                        </div>

                        {/* Office Contact Persons */}
                        {office.contactPersons && office.contactPersons.length > 0 && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Contact Persons</label>
                            <div className="space-y-3">
                              {office.contactPersons.map((contact, contactIndex) => (
                                <div key={contact.id} className="bg-gray-50 rounded-lg p-4 border">
                                  <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center space-x-2">
                                      <Users className="w-4 h-4 text-gray-500" />
                                      <span className="font-medium text-sm text-gray-900">Contact Person {contactIndex + 1}</span>
                                      {contact.isPrimary && (
                                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                                          Primary
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                      <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                                      <input
                                        type="text"
                                        value={contact.name}
                                        onChange={(e) => handleOfficeContactChange(_index, contactIndex, 'name', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        required
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-sm font-medium text-gray-700 mb-1">Designation</label>
                                      <input
                                        type="text"
                                        value={contact.designation ?? ''}
                                        onChange={(e) => handleOfficeContactChange(_index, contactIndex, 'designation', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                                      <input
                                        type="tel"
                                        value={contact.phoneNumber ?? ''}
                                        onChange={(e) => handleOfficeContactChange(_index, contactIndex, 'phoneNumber', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-sm font-medium text-gray-700 mb-1">Email ID</label>
                                      <input
                                        type="email"
                                        value={contact.emailId ?? ''}
                                        onChange={(e) => handleOfficeContactChange(_index, contactIndex, 'emailId', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                      />
                                    </div>
                                    <div className="md:col-span-2">
                                      <div className="flex items-center space-x-2">
                                        <input
                                          type="checkbox"
                                          checked={contact.isPrimary}
                                          onChange={(e) => handleOfficeContactChange(_index, contactIndex, 'isPrimary', e.target.checked)}
                                          className="rounded"
                                        />
                                        <label className="text-sm font-medium text-gray-700">Primary Contact</label>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Plants */}
              {entity.plants && entity.plants.length > 0 && (
                <div className="bg-green-50 rounded-lg p-4">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Factory className="w-5 h-5 mr-2 text-green-600" />
                    Plants ({formData.plants.length})
                  </h4>
                  <div className="space-y-4">
                    {formData.plants.map((plant, _index) => (
                      <div key={plant.id} className="bg-white rounded-lg p-4 border">
                        <div className="flex items-center justify-between mb-3">
                          <h5 className="font-medium text-gray-900 flex items-center">
                            <Factory className="w-4 h-4 mr-2 text-green-600" />
                            {plant.name}
                            <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                              {plant.plantType}
                            </span>
                          </h5>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                            <input
                              type="text"
                              value={plant.address ?? ''}
                              onChange={(e) => handlePlantChange(_index, 'address', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Area</label>
                            <input
                              type="text"
                              value={plant.area ?? ''}
                              onChange={(e) => handlePlantChange(_index, 'area', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                            <input
                              type="text"
                              value={plant.city ?? ''}
                              onChange={(e) => handlePlantChange(_index, 'city', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                            <input
                              type="text"
                              value={plant.state ?? ''}
                              onChange={(e) => handlePlantChange(_index, 'state', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                            <input
                              type="text"
                              value={plant.country ?? ''}
                              onChange={(e) => handlePlantChange(_index, 'country', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">PIN Code</label>
                            <input
                              type="text"
                              value={plant.pincode ?? ''}
                              onChange={(e) => handlePlantChange(_index, 'pincode', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            />
                          </div>
                        </div>

                        {/* Plant Contact Persons */}
                        {plant.contactPersons && plant.contactPersons.length > 0 && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Contact Persons</label>
                            <div className="space-y-3">
                              {plant.contactPersons.map((contact, contactIndex) => (
                                <div key={contact.id} className="bg-gray-50 rounded-lg p-4 border">
                                  <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center space-x-2">
                                      <Users className="w-4 h-4 text-gray-500" />
                                      <span className="font-medium text-sm text-gray-900">Contact Person {contactIndex + 1}</span>
                                      {contact.isPrimary && (
                                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                                          Primary
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                      <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                                      <input
                                        type="text"
                                        value={contact.name}
                                        onChange={(e) => handlePlantContactChange(_index, contactIndex, 'name', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                        required
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-sm font-medium text-gray-700 mb-1">Designation</label>
                                      <input
                                        type="text"
                                        value={contact.designation ?? ''}
                                        onChange={(e) => handlePlantContactChange(_index, contactIndex, 'designation', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                                      <input
                                        type="tel"
                                        value={contact.phoneNumber ?? ''}
                                        onChange={(e) => handlePlantContactChange(_index, contactIndex, 'phoneNumber', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-sm font-medium text-gray-700 mb-1">Email ID</label>
                                      <input
                                        type="email"
                                        value={contact.emailId ?? ''}
                                        onChange={(e) => handlePlantContactChange(_index, contactIndex, 'emailId', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                      />
                                    </div>
                                    <div className="md:col-span-2">
                                      <div className="flex items-center space-x-2">
                                        <input
                                          type="checkbox"
                                          checked={contact.isPrimary}
                                          onChange={(e) => handlePlantContactChange(_index, contactIndex, 'isPrimary', e.target.checked)}
                                          className="rounded"
                                        />
                                        <label className="text-sm font-medium text-gray-700">Primary Contact</label>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Customer-specific sections (legacy) */}
          {entity.type === 'customer' && entity.locations && entity.locations.length > 0 && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Building className="w-5 h-5 mr-2 text-gray-600" />
                Locations ({entity.locations.length})
              </h4>
              <div className="space-y-3">
                {entity.locations.map((location, _index) => (
                  <div key={location.id} className="bg-white rounded-lg p-4 border">
                    <div className="flex items-center justify-between">
                      <h5 className="font-medium text-gray-900 flex items-center">
                        {location.type === 'OFFICE' ? (
                          <Building className="w-4 h-4 mr-2 text-blue-600" />
                        ) : (
                          <Factory className="w-4 h-4 mr-2 text-green-600" />
                        )}
                        {location.name}
                      </h5>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        location.type === 'OFFICE' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {location.type}
                      </span>
                    </div>
                    <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                      <div>
                        <span className="font-medium">Address:</span> {location.address ?? 'Not provided'}
                      </div>
                      <div>
                        <span className="font-medium">City:</span> {location.city ?? 'Not provided'}
                      </div>
                      <div>
                        <span className="font-medium">State:</span> {location.state ?? 'Not provided'}
                      </div>
                      <div>
                        <span className="font-medium">Country:</span> {location.country ?? 'Not provided'}
                      </div>
                      {location.receptionNumber && (
                        <div>
                          <span className="font-medium">Reception:</span> {location.receptionNumber}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="flex justify-end space-x-3 p-6 border-t border-gray-200">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center disabled:opacity-50"
          >
            <Save className="w-4 h-4 mr-2" />
            {isLoading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
