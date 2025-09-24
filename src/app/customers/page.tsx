'use client';

import { api } from '@/trpc/client';
import { EntityDetailView } from './_components/EntityDetailView';
import { EntityEditForm } from './_components/EntityEditForm';
import { DeleteConfirmationDialog } from './_components/DeleteConfirmationDialog';
import { AddLocationModal } from './_components/AddLocationModal';
import { ToastContainer, useToast } from '@/components/ui/toast';
import { useState, useEffect } from 'react';
import { 
  Search, 
  Plus, 
  Eye, 
  Edit, 
  Trash2,
  Filter,
  Users,
  Building,
  MapPin
} from 'lucide-react';

interface Customer {
  id: string;
  name: string;
  isNew: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: {
    id: string;
    name: string;
    email: string;
    role: string;
  } | null;
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
  contacts?: Array<{
    id: string;
    name: string;
    designation?: string | null;
    officialCellNumber?: string | null;
    personalCellNumber?: string | null;
    location?: {
      id: string;
      name: string;
      type: 'OFFICE' | 'PLANT';
    };
  }>;
}


// Combined interface for display
interface CombinedEntity {
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
  offices?: Array<{
    id: string;
    name: string;
    address: string | null;
    area?: string | null;
    city: string;
    state: string;
    country: string;
    pincode?: string | null;
    isHeadOffice: boolean;
    contactPersons: Array<{
      id: string;
      name: string;
      designation: string | null;
      phoneNumber: string | null;
      emailId: string | null;
      isPrimary: boolean;
    }>;
  }>;
  plants?: Array<{
    id: string;
    name: string;
    address: string | null;
    area?: string | null;
    city: string;
    state: string;
    country: string;
    pincode?: string | null;
    plantType: string;
    contactPersons: Array<{
      id: string;
      name: string;
      designation: string | null;
      phoneNumber: string | null;
      emailId: string | null;
      isPrimary: boolean;
    }>;
  }>;
}

export default function CustomersPage() {
  // Fetch both old customers and new companies
  const { data: customers, isLoading: customersLoading, error: customersError } = api.customer.getAll.useQuery();
  const { data: companies, isLoading: companiesLoading, error: companiesError } = api.company.getAll.useQuery();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState<'all' | 'office' | 'plant'>('all');
  const [showForm, setShowForm] = useState(false);
  
  // Advanced search using the search endpoint
  const { data: searchResults, isLoading: isSearching } = api.customer.search.useQuery(
    { searchTerm: searchTerm },
    {
      enabled: searchTerm.length > 0,
    }
  );
  
  // State for modals
  const [selectedCustomer, setSelectedCustomer] = useState<CombinedEntity | null>(null);
  const [showDetailView, setShowDetailView] = useState(false);

  const [customerToEdit, setCustomerToEdit] = useState<CombinedEntity | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<CombinedEntity | null>(null);

  // State for AddLocationModal
  const [showAddLocationModal, setShowAddLocationModal] = useState(false);
  const [customerForLocation, setCustomerForLocation] = useState<CombinedEntity | null>(null);

  // Toast notifications
  const { toasts, success, error: showError, removeToast } = useToast();

  // tRPC utility to manually refetch data
  const utils = api.useUtils();

  // Delete customer mutation
  const deleteCustomer = api.customer.delete.useMutation({
    onSuccess: () => {
      // Invalidate and refetch customers
      utils.customer.getAll.invalidate();
      // Close delete dialog
      setShowDeleteDialog(false);
      setCustomerToDelete(null);
      // Show success toast
      success('Customer Deleted', 'The customer has been successfully removed from your database.');
    },
    onError: (error) => {
      showError('Delete Failed', `Failed to delete customer: ${error.message}`);
    },
  });

  // Delete company mutation
  const deleteCompany = api.company.delete.useMutation({
    onSuccess: () => {
      // Invalidate and refetch companies
      utils.company.getAll.invalidate();
      // Close delete dialog
      setShowDeleteDialog(false);
      setCustomerToDelete(null);
      // Show success toast
      success('Company Deleted', 'The company has been successfully removed from your database.');
    },
    onError: (error) => {
      showError('Delete Failed', `Failed to delete company: ${error.message}`);
    },
  });

  // Reset form state when page loads (when user clicks on customers sidebar)
  useEffect(() => {
    setShowForm(false);
  }, []);

  // Combine customers and companies into a unified list with deduplication
  const combinedEntities: CombinedEntity[] = (() => {
    const allEntities: CombinedEntity[] = [];
    const seenNames = new Set<string>();
    
    // First, add all companies (new structure takes priority)
    /* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call */
    (companies ?? []).forEach((company: any) => {
      const normalizedName = company.name.trim().toLowerCase();
      if (!seenNames.has(normalizedName)) {
        seenNames.add(normalizedName);
        allEntities.push({
          id: company.id,
          name: company.name,
          type: 'company',
          isNew: true, // All companies are considered "new" for now
          createdAt: company.createdAt,
          updatedAt: company.updatedAt,
          createdBy: company.createdBy,
          poRuptureDiscs: company.poRuptureDiscs,
          poThermowells: company.poThermowells,
          poHeatExchanger: company.poHeatExchanger,
          poMiscellaneous: company.poMiscellaneous,
          poWaterJetSteamJet: company.poWaterJetSteamJet,
          existingGraphiteSuppliers: company.existingGraphiteSuppliers,
          problemsFaced: company.problemsFaced,
          offices: company.offices,
          plants: company.plants,
        });
      }
    });
    /* eslint-enable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call */
    
    // Then, add customers that don't have duplicate names
    (customers ?? []).forEach((customer: Customer) => {
      const normalizedName = customer.name.trim().toLowerCase();
      if (!seenNames.has(normalizedName)) {
        seenNames.add(normalizedName);
        allEntities.push({
          id: customer.id,
          name: customer.name,
          type: 'customer',
          isNew: customer.isNew,
          createdAt: customer.createdAt,
          updatedAt: customer.updatedAt,
          createdBy: customer.createdBy,
          poRuptureDiscs: customer.poRuptureDiscs,
          poThermowells: customer.poThermowells,
          poHeatExchanger: customer.poHeatExchanger,
          poMiscellaneous: customer.poMiscellaneous,
          poWaterJetSteamJet: customer.poWaterJetSteamJet,
          existingGraphiteSuppliers: customer.existingGraphiteSuppliers,
          problemsFaced: customer.problemsFaced,
          locations: customer.locations,
        });
      }
    });
    
    return allEntities.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  })();

  if (customersError || companiesError) {
    return <div>Error: {customersError?.message || companiesError?.message}</div>;
  }

  // Use search results if searching, otherwise use all combined entities
  // Note: searchResults are still in old customer format, so we need to convert them
  const filteredEntities = searchTerm.length > 0 ? (() => {
    const searchEntities: CombinedEntity[] = [];
    const seenNames = new Set<string>();
    
    // Convert search results to combined format with deduplication
    /* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call */
    (searchResults ?? []).forEach((customer: any) => {
      const normalizedName = customer.name.trim().toLowerCase();
      if (!seenNames.has(normalizedName)) {
        seenNames.add(normalizedName);
        searchEntities.push({
          id: customer.id,
          name: customer.name,
          type: 'customer',
          isNew: customer.isNew,
          createdAt: customer.createdAt,
          updatedAt: customer.updatedAt,
          createdBy: customer.createdBy,
          poRuptureDiscs: customer.poRuptureDiscs,
          poThermowells: customer.poThermowells,
          poHeatExchanger: customer.poHeatExchanger,
          poMiscellaneous: customer.poMiscellaneous,
          poWaterJetSteamJet: customer.poWaterJetSteamJet,
          existingGraphiteSuppliers: customer.existingGraphiteSuppliers,
          problemsFaced: customer.problemsFaced,
          locations: customer.locations,
        });
      }
    });
    /* eslint-enable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call */
    
    return searchEntities;
  })() : combinedEntities;

  // Calculate stats
  const totalEntities = combinedEntities.length;
  const newEntities = combinedEntities.filter((e: CombinedEntity) => e.isNew).length;
  const activeRegions = new Set(
    combinedEntities.flatMap((e: CombinedEntity) => {
      if (e.type === 'customer' && e.locations) {
        return e.locations.map(loc => loc.country).filter(Boolean);
      } else if (e.type === 'company') {
        const officeCountries = e.offices?.map(office => office.country).filter(Boolean) ?? [];
        const plantCountries = e.plants?.map(plant => plant.country).filter(Boolean) ?? [];
        return [...officeCountries, ...plantCountries];
      }
      return [];
    })
  ).size;

  // Handle view customer
  const handleViewCustomer = (entity: CombinedEntity) => {
    setSelectedCustomer(entity);
    setShowDetailView(true);
  };

  // Handle edit customer
  const handleEditCustomer = (entity: CombinedEntity) => {
    setCustomerToEdit(entity);
  };

  // Handle delete customer
  const handleDeleteCustomer = (entity: CombinedEntity) => {
    setCustomerToDelete(entity);
    setShowDeleteDialog(true);
  };

  // Handle add location
  const handleAddLocation = (entity: CombinedEntity) => {
    setCustomerForLocation(entity);
    setShowAddLocationModal(true);
  };

  // Confirm delete
  const confirmDelete = (entityId: string) => {
    if (customerToDelete) {
      if (customerToDelete.type === 'customer') {
        deleteCustomer.mutate({ id: entityId });
      } else if (customerToDelete.type === 'company') {
        deleteCompany.mutate({ id: entityId });
      }
    }
  };

  if (showForm) {
    // Redirect to the new company-based form
    window.location.href = '/customers/new-with-locations';
    return null;
  }

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl text-gray-900 font-bold">Companies & Customers</h1>
          <p className="text-gray-600 mt-1">
            Manage your company database with offices, plants, and contacts
          </p>
        </div>
        <button 
          onClick={() => setShowForm(true)}
          className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all bg-blue-600 text-white hover:bg-blue-700 px-4 py-2"
        >
          <Plus className="h-4 w-4" />
          New Company
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl border shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Companies</p>
              <p className="text-2xl text-gray-900 mt-1 font-semibold">{totalEntities}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <Building className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">New Companies</p>
              <p className="text-2xl text-gray-900 mt-1 font-semibold">{newEntities}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <Users className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Regions</p>
              <p className="text-2xl text-gray-900 mt-1 font-semibold">{activeRegions}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
              <MapPin className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Customer Directory Card */}
      <div className="bg-white rounded-xl border shadow-sm">
        <div className="px-6 pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-lg font-semibold text-gray-900">Company Directory</h4>
              <p className="text-gray-600 text-sm">Browse and manage all company information with offices and plants</p>
            </div>
          </div>
        </div>
        
        <div className="px-6 pb-6">
          {/* Search and Filters */}
          <div className="flex items-center space-x-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                placeholder="Search by company name, office name, or plant name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            {/* Search Type Selector */}
            <select
              value={searchType}
              onChange={(e) => setSearchType(e.target.value as 'all' | 'office' | 'plant')}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-700"
            >
              <option value="all">All Fields</option>
              <option value="office">Office Name</option>
              <option value="plant">Plant Name</option>
            </select>
            
            <button className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 px-4 py-2">
              <Filter className="h-4 w-4" />
              Filters
            </button>
          </div>

          {/* Customer Table */}
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="relative w-full overflow-x-auto">
              <table className="w-full caption-bottom text-sm">
                <thead className="[&_tr]:border-b bg-black">
                  <tr>
                    <th className="text-background h-10 px-4 text-left align-middle font-medium bg-white">Company & Locations</th>
                    <th className="text-background h-10 px-4 text-left align-middle font-medium bg-white">Office Location</th>
                    <th className="text-background h-10 px-4 text-left align-middle font-medium bg-white">Contact</th>
                    <th className="text-background h-10 px-4 text-left align-middle font-medium bg-white">Status</th>
                    <th className="text-background h-10 px-4 text-left align-middle font-medium bg-white">Created By</th>
                    <th className="text-background h-10 px-4 text-left align-middle font-medium bg-white">Actions</th>
                  </tr>
                </thead>
                <tbody className="[&_tr:last-child]:border-0">
                  {customersLoading || companiesLoading || isSearching ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center">
                        <div className="animate-pulse space-y-4">
                          <div className="h-4 bg-gray-200 rounded w-1/3 mx-auto"></div>
                          <div className="h-4 bg-gray-200 rounded w-1/4 mx-auto"></div>
                        </div>
                      </td>
                    </tr>
                  ) : filteredEntities.length > 0 ? (
                    filteredEntities.map((entity: CombinedEntity) => (
                      <tr key={entity.id} className="hover:bg-gray-50 data-[state=selected]:bg-muted border-b transition-colors">
                        <td className="p-4 align-middle whitespace-nowrap">
                          <div>
                            <div className="text-sm text-gray-900 font-medium flex items-center gap-2">
                              {entity.name}
                              <span className={`text-xs px-2 py-1 rounded-full ${
                                entity.type === 'company' 
                                  ? 'bg-blue-100 text-blue-800' 
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {entity.type === 'company' ? 'Company' : 'Customer'}
                              </span>
                            </div>
                            {/* Show locations/offices/plants */}
                            {entity.type === 'customer' && entity.locations && entity.locations.length > 0 ? (
                              entity.locations.map((location) => (
                                <div 
                                  key={location.id} 
                                  className={`text-xs font-medium ${
                                    location.type === 'OFFICE' 
                                      ? 'text-blue-600' 
                                      : 'text-green-600'
                                  }`}
                                >
                                  {location.type === 'OFFICE' ? '🏢' : '🏭'} {location.name}
                                  {location.city && location.state && (
                                    <span className="text-gray-500 ml-1">
                                      ({location.city}, {location.state})
                                    </span>
                                  )}
                                </div>
                              ))
                            ) : entity.type === 'company' && (entity.offices?.length || entity.plants?.length) ? (
                              <>
                                {entity.offices?.map((office) => (
                                  <div key={office.id} className="text-xs font-medium text-blue-600">
                                    🏢 {office.name}
                                    {office.city && office.state && (
                                      <span className="text-gray-500 ml-1">
                                        ({office.city}, {office.state})
                                      </span>
                                    )}
                                  </div>
                                ))}
                                {entity.plants?.map((plant) => (
                                  <div key={plant.id} className="text-xs font-medium text-green-600">
                                    🏭 {plant.name}
                                    {plant.city && plant.state && (
                                      <span className="text-gray-500 ml-1">
                                        ({plant.city}, {plant.state})
                                      </span>
                                    )}
                                  </div>
                                ))}
                              </>
                            ) : (
                              <div className="text-xs text-gray-500">No locations added</div>
                            )}
                          </div>
                        </td>
                        <td className="p-4 align-middle whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {entity.type === 'customer' && entity.locations && entity.locations.length > 0 ? (
                              <>
                                {entity.locations[0].city && entity.locations[0].state && (
                                  <>{entity.locations[0].city}, {entity.locations[0].state}</>
                                )}
                                {!entity.locations[0].city && !entity.locations[0].state && (
                                  <span className="text-gray-500">No address</span>
                                )}
                              </>
                            ) : entity.type === 'company' && entity.offices && entity.offices.length > 0 ? (
                              <>
                                {entity.offices[0].city}, {entity.offices[0].state}
                              </>
                            ) : (
                              <span className="text-gray-500">No address</span>
                            )}
                          </div>
                          <div className="text-xs text-gray-500">
                            {entity.type === 'customer' && entity.locations && entity.locations.length > 0 ? 
                              entity.locations[0].country : 
                              entity.type === 'company' && entity.offices && entity.offices.length > 0 ?
                                entity.offices[0].country : 'No country'
                            }
                          </div>
                        </td>
                        <td className="p-4 align-middle whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {entity.type === 'customer' && entity.locations && entity.locations.length > 0 ? 
                              entity.locations[0].receptionNumber ?? 'No number' : 
                              entity.type === 'company' && entity.offices && entity.offices.length > 0 ?
                                'Contact available' : 'No number'
                            }
                          </div>
                        </td>
                        <td className="p-4 align-middle whitespace-nowrap">
                          <span className="inline-flex items-center justify-center rounded-md border px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 border-transparent bg-blue-100 text-blue-800">
                            {entity.isNew ? 'New' : 'Existing'}
                          </span>
                        </td>
                        <td className="p-4 align-middle whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {new Date(entity.createdAt).toLocaleDateString()}
                          </div>
                          {entity.createdBy && (
                            <div className="text-xs text-gray-500">
                              by {entity.createdBy.name}
                            </div>
                          )}
                        </td>
                        <td className="p-4 align-middle whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            {/* Add Location Button - only for customers */}
                            {entity.type === 'customer' && (
                              <button 
                                onClick={() => handleAddLocation(entity)}
                                className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all hover:bg-green-100 h-8 w-8 rounded-md text-green-600 hover:text-green-700"
                                title="Add Office or Plant"
                              >
                                <Plus className="h-4 w-4" />
                              </button>
                            )}
                            
                            {/* View Button - for both customers and companies */}
                            <button 
                              onClick={() => handleViewCustomer(entity)}
                              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all hover:bg-blue-100 h-8 w-8 rounded-md text-blue-600 hover:text-blue-700"
                              title={`View ${entity.type === 'company' ? 'Company' : 'Customer'} Details`}
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            
                            {/* Edit Button - for both customers and companies */}
                            <button 
                              onClick={() => handleEditCustomer(entity)}
                              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all hover:bg-yellow-100 h-8 w-8 rounded-md text-yellow-600 hover:text-yellow-700"
                              title={`Edit ${entity.type === 'company' ? 'Company' : 'Customer'}`}
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            
                            {/* Delete Button - for both customers and companies */}
                            <button 
                              onClick={() => handleDeleteCustomer(entity)}
                              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all hover:bg-red-100 h-8 w-8 rounded-md text-red-600 hover:text-red-700"
                              title={`Delete ${entity.type === 'company' ? 'Company' : 'Customer'}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="text-center py-8">
                        <div className="text-gray-500">
                          {searchTerm ? 'No companies found matching your search.' : 'No companies found.'}
                        </div>
                        {!searchTerm && (
                          <button 
                            onClick={() => setShowForm(true)}
                            className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 mt-4 px-4 py-2"
                          >
                            <Plus className="h-4 w-4" />
                            Add First Company
                          </button>
                        )}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Search Results Info */}
          {searchTerm.length > 0 && (
            <div className="flex items-center justify-between mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <Search className="w-4 h-4 text-blue-600" />
                <span className="text-sm text-blue-800">
                  Search results for &quot;{searchTerm}&quot; in {searchType === 'all' ? 'all fields' : searchType + ' names'}
                </span>
              </div>
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSearchType('all');
                }}
                className="text-sm text-blue-600 hover:text-blue-800 underline"
              >
                Clear Search
              </button>
            </div>
          )}

          {/* Pagination */}
          {filteredEntities.length > 0 && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-gray-500">
                {searchTerm.length > 0 
                  ? `Found ${filteredEntities.length} matching companies`
                  : `Showing ${filteredEntities.length} of ${combinedEntities.length} companies`
                }
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Entity Detail View Modal - for both customers and companies */}
      {selectedCustomer && (
        <EntityDetailView
          entity={selectedCustomer}
          isOpen={showDetailView}
          onClose={() => {
            setShowDetailView(false);
            setSelectedCustomer(null);
          }}
        />
      )}

      {/* Edit Modal - for both customers and companies */}
      {customerToEdit && (
        <EntityEditForm
          entity={customerToEdit}
          onCancel={() => {
            setCustomerToEdit(null);
          }}
          onSuccess={() => {
            setCustomerToEdit(null);
            // Refresh data
            utils.customer.getAll.invalidate();
            utils.company.getAll.invalidate();
          }}
        />
      )}

      {/* Delete Confirmation Dialog - for both customers and companies */}
      {customerToDelete && (
        <DeleteConfirmationDialog
          customerName={customerToDelete.name}
          isOpen={showDeleteDialog}
          onClose={() => {
            setShowDeleteDialog(false);
            setCustomerToDelete(null);
          }}
          onConfirm={() => confirmDelete(customerToDelete.id)}
          isDeleting={customerToDelete.type === 'customer' ? deleteCustomer.isPending : deleteCompany.isPending}
        />
      )}

      {/* Add Location Modal - only for customers */}
      {customerForLocation && customerForLocation.type === 'customer' && (
        <AddLocationModal
          isOpen={showAddLocationModal}
          onClose={() => {
            setShowAddLocationModal(false);
            setCustomerForLocation(null);
          }}
          customerId={customerForLocation.id}
          customerName={customerForLocation.name}
          onSuccess={() => {
            // Refresh the customer data
            utils.customer.getAll.invalidate();
          }}
        />
      )}

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </div>
  );
}
