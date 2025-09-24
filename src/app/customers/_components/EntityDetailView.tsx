'use client';

import { X, MapPin, Phone, Building, Calendar, Users, Factory, Mail, Globe } from 'lucide-react';

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

interface EntityDetailViewProps {
  entity: Entity;
  isOpen: boolean;
  onClose: () => void;
}

export function EntityDetailView({ entity, isOpen, onClose }: EntityDetailViewProps) {
  if (!isOpen) return null;

  const getStatusBadge = (isNew: boolean, type: 'customer' | 'company') => {
    return (
      <span className={`inline-flex items-center justify-center rounded-md border px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 border-transparent ${
        isNew ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
      }`}>
        {isNew ? `New ${type === 'company' ? 'Company' : 'Customer'}` : `Existing ${type === 'company' ? 'Company' : 'Customer'}`}
      </span>
    );
  };

  const getTypeIcon = (type: 'customer' | 'company') => {
    return type === 'company' ? <Building className="w-5 h-5 text-blue-600" /> : <Users className="w-5 h-5 text-green-600" />;
  };

  const getTypeTitle = (type: 'customer' | 'company') => {
    return type === 'company' ? 'Company Details' : 'Customer Details';
  };

  const getTypeSubtitle = (type: 'customer' | 'company') => {
    return type === 'company' ? 'View company information with offices and plants' : 'View customer information';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto transform transition-all">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              {getTypeIcon(entity.type)}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{getTypeTitle(entity.type)}</h3>
              <p className="text-sm text-gray-500">{getTypeSubtitle(entity.type)}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Building className="w-5 h-5 mr-2 text-blue-600" />
              Basic Information
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <p className="text-sm text-gray-900 font-medium">{entity.name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <div className="mt-1">
                  {getStatusBadge(entity.isNew, entity.type)}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Created Date</label>
                <p className="text-sm text-gray-900 flex items-center">
                  <Calendar className="w-4 h-4 mr-1 text-gray-400" />
                  {new Date(entity.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Last Updated</label>
                <p className="text-sm text-gray-900 flex items-center">
                  <Calendar className="w-4 h-4 mr-1 text-gray-400" />
                  {new Date(entity.updatedAt).toLocaleDateString()}
                </p>
              </div>
              {entity.createdBy && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Created By</label>
                  <p className="text-sm text-gray-900">{entity.createdBy.name} ({entity.createdBy.email})</p>
                </div>
              )}
            </div>
          </div>

          {/* Company-specific information */}
          {entity.type === 'company' && (
            <>
              {/* Purchase Order Information */}
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Building className="w-5 h-5 mr-2 text-blue-600" />
                  Purchase Order Information
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" checked={entity.poRuptureDiscs} readOnly className="rounded" />
                    <span className="text-sm text-gray-700">Rupture Discs</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" checked={entity.poThermowells} readOnly className="rounded" />
                    <span className="text-sm text-gray-700">Thermowells</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" checked={entity.poHeatExchanger} readOnly className="rounded" />
                    <span className="text-sm text-gray-700">Heat Exchanger</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" checked={entity.poMiscellaneous} readOnly className="rounded" />
                    <span className="text-sm text-gray-700">Miscellaneous</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" checked={entity.poWaterJetSteamJet} readOnly className="rounded" />
                    <span className="text-sm text-gray-700">Water Jet/Steam Jet</span>
                  </div>
                </div>
              </div>

              {/* Additional Information */}
              {(entity.existingGraphiteSuppliers ?? entity.problemsFaced) && (
                <div className="bg-green-50 rounded-lg p-4">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Globe className="w-5 h-5 mr-2 text-green-600" />
                    Additional Information
                  </h4>
                  <div className="space-y-4">
                    {entity.existingGraphiteSuppliers && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Existing Graphite Suppliers</label>
                        <p className="text-sm text-gray-900 bg-white p-3 rounded border">{entity.existingGraphiteSuppliers}</p>
                      </div>
                    )}
                    {entity.problemsFaced && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Problems Faced</label>
                        <p className="text-sm text-gray-900 bg-white p-3 rounded border">{entity.problemsFaced}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Offices */}
              {entity.offices && entity.offices.length > 0 && (
                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Building className="w-5 h-5 mr-2 text-blue-600" />
                    Offices ({entity.offices.length})
                  </h4>
                  <div className="space-y-4">
                    {entity.offices.map((office, _index) => (
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
                            <p className="text-sm text-gray-900">{office.address ?? 'Not provided'}</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Area</label>
                            <p className="text-sm text-gray-900">{office.area ?? 'Not provided'}</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                            <p className="text-sm text-gray-900">{office.city}</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                            <p className="text-sm text-gray-900">{office.state}</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                            <p className="text-sm text-gray-900">{office.country}</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">PIN Code</label>
                            <p className="text-sm text-gray-900">{office.pincode ?? 'Not provided'}</p>
                          </div>
                        </div>

                        {/* Office Contact Persons */}
                        {office.contactPersons && office.contactPersons.length > 0 && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Contact Persons</label>
                            <div className="space-y-2">
                              {office.contactPersons.map((contact, _contactIndex) => (
                                <div key={contact.id} className="bg-gray-50 rounded p-3">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-2">
                                      <Users className="w-4 h-4 text-gray-500" />
                                      <span className="font-medium text-sm text-gray-900">{contact.name}</span>
                                      {contact.isPrimary && (
                                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                                          Primary
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-2 text-xs text-gray-600">
                                    <div className="flex items-center">
                                      <span className="font-medium">Designation:</span>
                                      <span className="ml-1">{contact.designation ?? 'Not provided'}</span>
                                    </div>
                                    <div className="flex items-center">
                                      <Phone className="w-3 h-3 mr-1" />
                                      <span>{contact.phoneNumber ?? 'Not provided'}</span>
                                    </div>
                                    <div className="flex items-center">
                                      <Mail className="w-3 h-3 mr-1" />
                                      <span>{contact.emailId ?? 'Not provided'}</span>
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
                    Plants ({entity.plants.length})
                  </h4>
                  <div className="space-y-4">
                    {entity.plants.map((plant, _index) => (
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
                            <p className="text-sm text-gray-900">{plant.address ?? 'Not provided'}</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Area</label>
                            <p className="text-sm text-gray-900">{plant.area ?? 'Not provided'}</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                            <p className="text-sm text-gray-900">{plant.city}</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                            <p className="text-sm text-gray-900">{plant.state}</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                            <p className="text-sm text-gray-900">{plant.country}</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">PIN Code</label>
                            <p className="text-sm text-gray-900">{plant.pincode ?? 'Not provided'}</p>
                          </div>
                        </div>

                        {/* Plant Contact Persons */}
                        {plant.contactPersons && plant.contactPersons.length > 0 && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Contact Persons</label>
                            <div className="space-y-2">
                              {plant.contactPersons.map((contact, _contactIndex) => (
                                <div key={contact.id} className="bg-gray-50 rounded p-3">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-2">
                                      <Users className="w-4 h-4 text-gray-500" />
                                      <span className="font-medium text-sm text-gray-900">{contact.name}</span>
                                      {contact.isPrimary && (
                                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                                          Primary
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-2 text-xs text-gray-600">
                                    <div className="flex items-center">
                                      <span className="font-medium">Designation:</span>
                                      <span className="ml-1">{contact.designation ?? 'Not provided'}</span>
                                    </div>
                                    <div className="flex items-center">
                                      <Phone className="w-3 h-3 mr-1" />
                                      <span>{contact.phoneNumber ?? 'Not provided'}</span>
                                    </div>
                                    <div className="flex items-center">
                                      <Mail className="w-3 h-3 mr-1" />
                                      <span>{contact.emailId ?? 'Not provided'}</span>
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

          {/* Customer-specific information (legacy) */}
          {entity.type === 'customer' && entity.locations && entity.locations.length > 0 && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <MapPin className="w-5 h-5 mr-2 text-gray-600" />
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
        </div>

        {/* Footer */}
        <div className="flex justify-end p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
