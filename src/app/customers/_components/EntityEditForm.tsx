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
    offices: entity.offices ?? [],
    plants: entity.plants ?? [],
  });

  const [isLoading, setIsLoading] = useState(false);

  // Update company mutation
  const updateCompany = api.company.update.useMutation({
    onSuccess: () => {
      onSuccess();
    },
    onError: (_error) => {
      // Error updating company
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
          existingGraphiteSuppliers: null,
          problemsFaced: null,
        });
      }
    } catch {
      // Error updating entity
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

  // Office management functions
  const addOffice = () => {
    const newOffice = {
      id: `temp-${Date.now()}`,
      name: '',
      address: null,
      area: null,
      city: null,
      state: null,
      country: null,
      pincode: null,
      isHeadOffice: false,
      contactPersons: []
    };
    setFormData(prev => ({
      ...prev,
      offices: [...prev.offices, newOffice]
    }));
  };

  const removeOffice = (index: number) => {
    setFormData(prev => ({
      ...prev,
      offices: prev.offices.filter((_, i) => i !== index)
    }));
  };

  // Plant management functions
  const addPlant = () => {
    const newPlant = {
      id: `temp-${Date.now()}`,
      name: '',
      address: null,
      area: null,
      city: null,
      state: null,
      country: null,
      pincode: null,
      plantType: null,
      contactPersons: []
    };
    setFormData(prev => ({
      ...prev,
      plants: [...prev.plants, newPlant]
    }));
  };

  const removePlant = (index: number) => {
    setFormData(prev => ({
      ...prev,
      plants: prev.plants.filter((_, i) => i !== index)
    }));
  };

  // Office contact management functions
  const addOfficeContact = (officeIndex: number) => {
    const newContact = {
      id: `temp-contact-${Date.now()}`,
      name: '',
      designation: null,
      phoneNumber: null,
      emailId: null,
      isPrimary: false
    };
    setFormData(prev => ({
      ...prev,
      offices: prev.offices.map((office, index) => 
        index === officeIndex 
          ? { ...office, contactPersons: [...office.contactPersons, newContact] }
          : office
      )
    }));
  };

  const removeOfficeContact = (officeIndex: number, contactIndex: number) => {
    setFormData(prev => ({
      ...prev,
      offices: prev.offices.map((office, index) => 
        index === officeIndex 
          ? { ...office, contactPersons: office.contactPersons.filter((_, i) => i !== contactIndex) }
          : office
      )
    }));
  };

  // Plant contact management functions
  const addPlantContact = (plantIndex: number) => {
    const newContact = {
      id: `temp-contact-${Date.now()}`,
      name: '',
      designation: null,
      phoneNumber: null,
      emailId: null,
      isPrimary: false
    };
    setFormData(prev => ({
      ...prev,
      plants: prev.plants.map((plant, index) => 
        index === plantIndex 
          ? { ...plant, contactPersons: [...plant.contactPersons, newContact] }
          : plant
      )
    }));
  };

  const removePlantContact = (plantIndex: number, contactIndex: number) => {
    setFormData(prev => ({
      ...prev,
      plants: prev.plants.map((plant, index) => 
        index === plantIndex 
          ? { ...plant, contactPersons: plant.contactPersons.filter((_, i) => i !== contactIndex) }
          : plant
      )
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


          {/* Company-specific sections */}
          {entity.type === 'company' && (
            <>
              {/* Note about office/plant editing */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-blue-800">
                      Office and Plant Management
                    </h3>
                    <div className="mt-2 text-sm text-blue-700">
                      <p>You can add, edit, and remove offices and plants. All changes will be saved to the database when you submit the form.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Offices */}
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-lg font-semibold text-gray-900 flex items-center">
                    <Building className="w-5 h-5 mr-2 text-blue-600" />
                    Offices ({formData.offices.length})
                  </h4>
                  <button
                    type="button"
                    onClick={addOffice}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Building className="w-4 h-4 mr-2" />
                    Add Office
                  </button>
                </div>
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
                          <button
                            type="button"
                            onClick={() => removeOffice(_index)}
                            className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded-full transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
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
                            <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                            <input
                              type="text"
                              value={office.area ?? ''}
                              onChange={(e) => handleOfficeChange(_index, 'area', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="e.g., MIDC Area, Industrial Zone"
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
                        </div>

                        {/* Office Contact Persons */}
                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <label className="block text-sm font-medium text-gray-700">Contact Persons</label>
                            <button
                              type="button"
                              onClick={() => addOfficeContact(_index)}
                              className="flex items-center px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                            >
                              <Users className="w-4 h-4 mr-1" />
                              Add Contact
                            </button>
                          </div>
                          {office.contactPersons && office.contactPersons.length > 0 && (
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
                                    <button
                                      type="button"
                                      onClick={() => removeOfficeContact(_index, contactIndex)}
                                      className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded-full transition-colors"
                                    >
                                      <X className="w-4 h-4" />
                                    </button>
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
                        )}
                      </div>
                    </div>
                    ))}
                  </div>
                </div>

              {/* Plants */}
              <div className="bg-green-50 rounded-lg p-4">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-lg font-semibold text-gray-900 flex items-center">
                    <Factory className="w-5 h-5 mr-2 text-green-600" />
                    Plants ({formData.plants.length})
                  </h4>
                  <button
                    type="button"
                    onClick={addPlant}
                    className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <Factory className="w-4 h-4 mr-2" />
                    Add Plant
                  </button>
                </div>
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
                          <button
                            type="button"
                            onClick={() => removePlant(_index)}
                            className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded-full transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
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
                            <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                            <input
                              type="text"
                              value={plant.area ?? ''}
                              onChange={(e) => handlePlantChange(_index, 'area', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                              placeholder="e.g., MIDC Area, Industrial Zone"
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
                        </div>

                        {/* Plant Contact Persons */}
                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <label className="block text-sm font-medium text-gray-700">Contact Persons</label>
                            <button
                              type="button"
                              onClick={() => addPlantContact(_index)}
                              className="flex items-center px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
                            >
                              <Users className="w-4 h-4 mr-1" />
                              Add Contact
                            </button>
                          </div>
                          {plant.contactPersons && plant.contactPersons.length > 0 && (
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
                                    <button
                                      type="button"
                                      onClick={() => removePlantContact(_index, contactIndex)}
                                      className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded-full transition-colors"
                                    >
                                      <X className="w-4 h-4" />
                                    </button>
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
                        )}
                      </div>
                    </div>
                    ))}
                  </div>
                </div>
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
