'use client';

import { memo, useState } from 'react';
import { 
  Users, 
  ChevronDown,
  ChevronRight,
  Building,
  Factory
} from 'lucide-react';
import { CustomerRowProps, CompanyApiResponse } from '../_types/customer.types';
import { 
  formatCustomerName, 
  getCustomerInitials 
} from '../_utils/customerHelpers';

export const CustomerRow = memo(function CustomerRow({
  customer,
}: CustomerRowProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  // Determine if this is a customer (with locations) or company (with offices/plants)
  // Priority: check type field first, then check for actual data
  const isCustomer = customer.type === 'customer' || 
    (customer.type !== 'company' && 'locations' in customer && Array.isArray(customer.locations) && customer.locations.length > 0);
  const isCompany = customer.type === 'company' || 
    (customer.type !== 'customer' && 'offices' in customer && Array.isArray(customer.offices) && customer.offices.length > 0);

  // Get contact persons from the customer/company data
  // Only companies have contactPersons at the top level
  const contactPersons = (isCompany && 'contactPersons' in customer && Array.isArray(customer.contactPersons))
    ? customer.contactPersons
    : [];
  const hasContactPersons = contactPersons.length > 0;
  
  // For customers, get contacts
  const contacts = isCustomer && 'contacts' in customer && Array.isArray(customer.contacts) 
    ? customer.contacts 
    : [];
  const hasContacts = contacts.length > 0;
  
  // For customers, get locations
  const locations = isCustomer && 'locations' in customer && Array.isArray(customer.locations) 
    ? customer.locations 
    : [];
  const hasLocations = locations.length > 0;
  
  // Check if there are offices/plants (regardless of contact persons)
  // Only companies have offices and plants
  const offices = (isCompany && 'offices' in customer && Array.isArray(customer.offices)) ? customer.offices : [];
  const plants = (isCompany && 'plants' in customer && Array.isArray(customer.plants)) ? customer.plants : [];
  const hasOffices = offices.length > 0;
  const hasPlants = plants.length > 0;
  const hasUnassignedLocations = 
    (hasOffices && offices.some(office => 
      !contactPersons.some(cp => cp.office?.id === office.id)
    )) ||
    (hasPlants && plants.some(plant => 
      !contactPersons.some(cp => cp.plant?.id === plant.id)
    ));
  
  // Show expand button if there are contact persons, contacts, locations, offices, or plants
  const hasContentToShow = hasContactPersons || hasContacts || hasLocations || hasOffices || hasPlants;

  // Helper function to get location string from office/plant
  // Location should be fetched from the "area" field (labeled as "Location" in the form)
  // Always returns a location string - location is important and should always be shown
  const getLocationString = (contact: typeof contactPersons[0]): string => {
    // Try to get location from office - prioritize "area" field (which is the Location field)
    if (contact.office?.id && hasOffices) {
      const foundOffice = offices.find(o => o.id === contact.office?.id);
      if (foundOffice) {
        const office = foundOffice as CompanyApiResponse['offices'][0];
        // First priority: use the "area" field (Location field)
        if (office.area) {
          return office.area;
        }
        // Fallback: if no area, try to build from other location fields
        const locationParts: string[] = [];
        if (office.city) locationParts.push(office.city);
        if (office.state) locationParts.push(office.state);
        if (office.country) locationParts.push(office.country);
        // Return location if we have any parts, otherwise return office name
        if (locationParts.length > 0) {
          return locationParts.filter(Boolean).join(', ');
        }
        // If no location parts but we have office name, return it
        if (office.name) {
          return office.name;
        }
      }
    }
    
    // Try to get location from plant - prioritize "area" field (which is the Location field)
    if (contact.plant?.id && hasPlants) {
      const foundPlant = plants.find(p => p.id === contact.plant?.id);
      if (foundPlant) {
        const plant = foundPlant as CompanyApiResponse['plants'][0];
        // First priority: use the "area" field (Location field)
        if (plant.area) {
          return plant.area;
        }
        // Fallback: if no area, try to build from other location fields
        const locationParts: string[] = [];
        if (plant.city) locationParts.push(plant.city);
        if (plant.state) locationParts.push(plant.state);
        if (plant.country) locationParts.push(plant.country);
        // Return location if we have any parts, otherwise return plant name
        if (locationParts.length > 0) {
          return locationParts.filter(Boolean).join(', ');
        }
        // If no location parts but we have plant name, return it
        if (plant.name) {
          return plant.name;
        }
      }
    }
    
    // Fallback: try to get name from contact's office/plant reference
    if (contact.office?.name) {
      return contact.office.name;
    }
    if (contact.plant?.name) {
      return contact.plant.name;
    }
    
    // Last fallback: show that location is not assigned
    return 'Location not assigned';
  };

  return (
    <>
      <tr className="hover:bg-gray-50 transition-colors">
        {/* Customer Name with Expand Button */}
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="flex items-center">
            <div className="flex-shrink-0 h-10 w-10">
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                <span className="text-sm font-medium text-blue-600">
                  {getCustomerInitials(customer)}
                </span>
              </div>
            </div>
            <div className="ml-4 flex-1">
              <div className="flex items-center">
                <Users className="w-4 h-4 text-gray-400 mr-2" />
                <div className="text-sm font-medium text-gray-900">
                  {formatCustomerName(customer)}
                </div>
                {hasContentToShow && (
                  <button
                    onClick={toggleExpanded}
                    className="ml-2 p-1 hover:bg-gray-200 rounded transition-colors"
                    title={isExpanded ? "Hide details" : "Show contact persons and locations"}
                  >
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-gray-500" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-gray-500" />
                    )}
                  </button>
                )}
              </div>
              {customer.type === 'company' && (
                <div className="text-xs text-green-600 font-medium">
                  Company
                </div>
              )}
              {customer.type === 'customer' && (
                <div className="text-xs text-blue-600 font-medium">
                  Customer
                </div>
              )}
              {hasContentToShow && (
                <div className="text-xs text-blue-600 font-medium">
                  {hasContactPersons && `${contactPersons.length} contact person${contactPersons.length !== 1 ? 's' : ''}`}
                  {hasContacts && `${contacts.length} contact${contacts.length !== 1 ? 's' : ''}`}
                  {hasLocations && `${locations.length} location${locations.length !== 1 ? 's' : ''}`}
                  {hasContactPersons && (hasContacts || hasLocations || hasUnassignedLocations) && ' • '}
                  {hasContacts && (hasLocations || hasUnassignedLocations) && ' • '}
                  {hasLocations && hasUnassignedLocations && ' • '}
                  {hasUnassignedLocations && 'Locations'}
                </div>
              )}
            </div>
          </div>
        </td>
      </tr>

      {/* Expanded Contact Persons Row - Show all contact persons and locations */}
      {isExpanded && (
        <tr className="bg-gray-50">
          <td colSpan={1} className="px-6 py-4">
            <div className="space-y-3">
              {/* Contact Persons Section */}
              {hasContactPersons && (
                <>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">
                    Contact Persons
                  </h4>
                  <div className="grid gap-3 mb-6">
                    {contactPersons.map((contact, index: number) => {
                      const location = getLocationString(contact);
                      return (
                        <div key={contact.id ?? index} className="bg-white p-4 rounded-lg border border-gray-200">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center mb-2">
                                <div className="flex items-center">
                                  {contact.office ? (
                                    <Building className="w-4 h-4 text-blue-500 mr-2" />
                                  ) : contact.plant ? (
                                    <Factory className="w-4 h-4 text-green-500 mr-2" />
                                  ) : (
                                    <Building className="w-4 h-4 text-gray-500 mr-2" />
                                  )}
                                  <span className="text-sm font-medium text-gray-900">
                                    {contact.name}
                                  </span>
                                  {contact.isPrimary && (
                                    <span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                                      Primary
                                    </span>
                                  )}
                                </div>
                              </div>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                                {/* Location is always shown first as it's important - even if other details are missing */}
                                <div className="md:col-span-2">
                                  <span className="font-medium">Location:</span> {location}
                                </div>
                                <div>
                                  <span className="font-medium">Type:</span> 
                                  <span className={`ml-1 px-2 py-1 text-xs rounded-full ${
                                    contact.office 
                                      ? 'bg-blue-100 text-blue-800' 
                                      : contact.plant
                                      ? 'bg-green-100 text-green-800'
                                      : 'bg-gray-100 text-gray-800'
                                  }`}>
                                    {contact.office ? 'Office' : contact.plant ? 'Plant' : 'Not assigned'}
                                  </span>
                                </div>
                                <div>
                                  <span className="font-medium">Designation:</span> {contact.designation ?? '-'}
                                </div>
                                <div>
                                  <span className="font-medium">Phone:</span> {contact.phoneNumber ?? '-'}
                                </div>
                                <div>
                                  <span className="font-medium">Email:</span> {contact.emailId ?? '-'}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
              
              {/* Offices and Plants - Show all locations */}
              {(hasOffices || hasPlants) && (
                <>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">
                    Locations
                  </h4>
                  <div className="grid gap-3">
                    {/* Show all offices */}
                    {offices.map((office) => {
                      const locationParts: string[] = [];
                      if (office.area) locationParts.push(office.area);
                      if (office.city) locationParts.push(office.city);
                      if (office.state) locationParts.push(office.state);
                      if (office.country) locationParts.push(office.country);
                      const location = locationParts.length > 0 
                        ? locationParts.join(', ') 
                        : office.address ?? office.name ?? 'Location not specified';
                      
                      return (
                        <div key={office.id} className="bg-white p-4 rounded-lg border border-gray-200">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center mb-2">
                                <Building className="w-4 h-4 text-blue-500 mr-2" />
                                <span className="text-sm font-medium text-gray-900">
                                  {office.name}
                                </span>
                                {office.isHeadOffice && (
                                  <span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                                    Head Office
                                  </span>
                                )}
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                                <div className="md:col-span-2">
                                  <span className="font-medium">Location:</span> {location}
                                </div>
                                {office.address && (
                                  <div className="md:col-span-2">
                                    <span className="font-medium">Address:</span> {office.address}
                                  </div>
                                )}
                                {office.city && (
                                  <div>
                                    <span className="font-medium">City:</span> {office.city}
                                  </div>
                                )}
                                {office.state && (
                                  <div>
                                    <span className="font-medium">State:</span> {office.state}
                                  </div>
                                )}
                                {office.country && (
                                  <div>
                                    <span className="font-medium">Country:</span> {office.country}
                                  </div>
                                )}
                                {office.pincode && (
                                  <div>
                                    <span className="font-medium">PIN Code:</span> {office.pincode}
                                  </div>
                                )}
                                <div>
                                  <span className="font-medium">Type:</span> 
                                  <span className="ml-1 px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                                    Office
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    
                    {/* Show all plants */}
                    {plants.map((plant) => {
                      const locationParts: string[] = [];
                      if (plant.area) locationParts.push(plant.area);
                      if (plant.city) locationParts.push(plant.city);
                      if (plant.state) locationParts.push(plant.state);
                      if (plant.country) locationParts.push(plant.country);
                      const location = locationParts.length > 0 
                        ? locationParts.join(', ') 
                        : plant.address ?? plant.name ?? 'Location not specified';
                      
                      return (
                        <div key={plant.id} className="bg-white p-4 rounded-lg border border-gray-200">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center mb-2">
                                <Factory className="w-4 h-4 text-green-500 mr-2" />
                                <span className="text-sm font-medium text-gray-900">
                                  {plant.name}
                                </span>
                                {plant.plantType && (
                                  <span className="ml-2 px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                                    {plant.plantType}
                                  </span>
                                )}
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                                <div className="md:col-span-2">
                                  <span className="font-medium">Location:</span> {location}
                                </div>
                                {plant.address && (
                                  <div className="md:col-span-2">
                                    <span className="font-medium">Address:</span> {plant.address}
                                  </div>
                                )}
                                {plant.city && (
                                  <div>
                                    <span className="font-medium">City:</span> {plant.city}
                                  </div>
                                )}
                                {plant.state && (
                                  <div>
                                    <span className="font-medium">State:</span> {plant.state}
                                  </div>
                                )}
                                {plant.country && (
                                  <div>
                                    <span className="font-medium">Country:</span> {plant.country}
                                  </div>
                                )}
                                {plant.pincode && (
                                  <div>
                                    <span className="font-medium">PIN Code:</span> {plant.pincode}
                                  </div>
                                )}
                                <div>
                                  <span className="font-medium">Type:</span> 
                                  <span className="ml-1 px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                                    Plant
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}

              {/* Customer Contacts Section */}
              {hasContacts && (
                <>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">
                    Contacts
                  </h4>
                  <div className="grid gap-3 mb-6">
                    {contacts.map((contact, index: number) => {
                      const locationName = contact.location?.name ?? 'Location not assigned';
                      return (
                        <div key={contact.id ?? index} className="bg-white p-4 rounded-lg border border-gray-200">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center mb-2">
                                <div className="flex items-center">
                                  {contact.location?.type === 'OFFICE' ? (
                                    <Building className="w-4 h-4 text-blue-500 mr-2" />
                                  ) : contact.location?.type === 'PLANT' ? (
                                    <Factory className="w-4 h-4 text-green-500 mr-2" />
                                  ) : (
                                    <Building className="w-4 h-4 text-gray-500 mr-2" />
                                  )}
                                  <span className="text-sm font-medium text-gray-900">
                                    {contact.name}
                                  </span>
                                </div>
                              </div>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                                <div className="md:col-span-2">
                                  <span className="font-medium">Location:</span> {locationName}
                                </div>
                                <div>
                                  <span className="font-medium">Type:</span> 
                                  <span className={`ml-1 px-2 py-1 text-xs rounded-full ${
                                    contact.location?.type === 'OFFICE'
                                      ? 'bg-blue-100 text-blue-800' 
                                      : contact.location?.type === 'PLANT'
                                      ? 'bg-green-100 text-green-800'
                                      : 'bg-gray-100 text-gray-800'
                                  }`}>
                                    {contact.location?.type ?? 'Not assigned'}
                                  </span>
                                </div>
                                <div>
                                  <span className="font-medium">Designation:</span> {contact.designation ?? '-'}
                                </div>
                                <div>
                                  <span className="font-medium">Official Phone:</span> {contact.officialCellNumber ?? '-'}
                                </div>
                                <div>
                                  <span className="font-medium">Personal Phone:</span> {contact.personalCellNumber ?? '-'}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}

              {/* Customer Locations Section */}
              {hasLocations && (
                <>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">
                    Locations
                  </h4>
                  <div className="grid gap-3">
                    {locations.map((location) => {
                      const locationParts: string[] = [];
                      if (location.city) locationParts.push(location.city);
                      if (location.state) locationParts.push(location.state);
                      if (location.country) locationParts.push(location.country);
                      const locationString = locationParts.length > 0 
                        ? locationParts.join(', ') 
                        : location.address ?? location.name ?? 'Location not specified';
                      return (
                        <div key={location.id} className="bg-white p-4 rounded-lg border border-gray-200">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center mb-2">
                                {location.type === 'OFFICE' ? (
                                  <Building className="w-4 h-4 text-blue-500 mr-2" />
                                ) : (
                                  <Factory className="w-4 h-4 text-green-500 mr-2" />
                                )}
                                <span className="text-sm font-medium text-gray-900">
                                  {location.name}
                                </span>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                                <div className="md:col-span-2">
                                  <span className="font-medium">Location:</span> {locationString}
                                </div>
                                {location.address && (
                                  <div className="md:col-span-2">
                                    <span className="font-medium">Address:</span> {location.address}
                                  </div>
                                )}
                                {location.city && (
                                  <div>
                                    <span className="font-medium">City:</span> {location.city}
                                  </div>
                                )}
                                {location.state && (
                                  <div>
                                    <span className="font-medium">State:</span> {location.state}
                                  </div>
                                )}
                                {location.country && (
                                  <div>
                                    <span className="font-medium">Country:</span> {location.country}
                                  </div>
                                )}
                                {location.receptionNumber && (
                                  <div>
                                    <span className="font-medium">Reception:</span> {location.receptionNumber}
                                  </div>
                                )}
                                <div>
                                  <span className="font-medium">Type:</span> 
                                  <span className={`ml-1 px-2 py-1 text-xs rounded-full ${
                                    location.type === 'OFFICE' 
                                      ? 'bg-blue-100 text-blue-800' 
                                      : 'bg-green-100 text-green-800'
                                  }`}>
                                    {location.type}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
});

