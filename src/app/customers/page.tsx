'use client';

import { api } from '@/trpc/client';
import { EntityDetailView } from './_components/EntityDetailView';
import { EntityEditForm } from './_components/EntityEditForm';
import { DeleteConfirmationDialog } from './_components/DeleteConfirmationDialog';
import { ToastContainer, useToast } from '@/components/ui/toast';
import { useState, useEffect } from 'react';
import { 
  Search, 
  Plus,
  Eye, 
  Edit, 
  Trash2,
  Filter,
  Building,
  MapPin
} from 'lucide-react';



// Company type from the API
type Company = {
  id: string;
  name: string;
  type: 'customer' | 'company';
  isNew: boolean;
  website?: string | null;
  industry?: string | null;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: {
    id: string;
    name: string;
    email: string;
  } | null;
  poRuptureDiscs: boolean;
  poThermowells: boolean;
  poHeatExchanger: boolean;
  poMiscellaneous: boolean;
  poWaterJetSteamJet: boolean;
  existingGraphiteSuppliers?: string | null;
  problemsFaced?: string | null;
  offices: Array<{
    id: string;
    name: string;
    address: string | null;
    area?: string | null;
    city: string | null;
    state: string | null;
    country: string | null;
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
  plants: Array<{
    id: string;
    name: string;
    address: string | null;
    area?: string | null;
    city: string | null;
    state: string | null;
    country: string | null;
    pincode?: string | null;
    plantType?: string | null;
    contactPersons: Array<{
      id: string;
      name: string;
      designation: string | null;
      phoneNumber: string | null;
      emailId: string | null;
      isPrimary: boolean;
    }>;
  }>;
  contactPersons: Array<{
    id: string;
    name: string;
    designation: string | null;
    phoneNumber: string | null;
    emailId: string | null;
    isPrimary: boolean;
  }>;
};

export default function CustomersPage() {
  // Fetch companies only (new company-based structure)
  const { data: companies, isLoading: companiesLoading, error: companiesError } = api.company.getAll.useQuery();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState<'all' | 'office' | 'plant'>('all');
  const [showForm, setShowForm] = useState(false);
  
  // State for modals
  const [selectedCustomer, setSelectedCustomer] = useState<Company | null>(null);
  const [showDetailView, setShowDetailView] = useState(false);

  const [customerToEdit, setCustomerToEdit] = useState<Company | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<Company | null>(null);


  // Toast notifications
  const { toasts, success, error: showError, removeToast } = useToast();

  // tRPC utility to manually refetch data
  const utils = api.useUtils();

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

  // Use companies directly (no need for combined entities since we only use company structure)
  const companiesList: Company[] = (companies ?? []).map(company => ({
    ...company,
    type: 'company' as const,
    isNew: false // You can determine this based on your business logic
  }));

  if (companiesError) {
    return <div>Error: {companiesError?.message}</div>;
  }

  // Filter companies based on search term (including location fields)
  const filteredCompanies = searchTerm.length > 0 
    ? companiesList.filter(company => {
        const searchLower = searchTerm.toLowerCase();
        return (
          company.name.toLowerCase().includes(searchLower) ||
          // Search in office locations
          company.offices.some(office => 
            office.city?.toLowerCase().includes(searchLower) ||
            office.state?.toLowerCase().includes(searchLower) ||
            office.area?.toLowerCase().includes(searchLower) ||
            office.country?.toLowerCase().includes(searchLower)
          ) ||
          // Search in plant locations
          company.plants.some(plant => 
            plant.city?.toLowerCase().includes(searchLower) ??
            plant.state?.toLowerCase().includes(searchLower) ??
            plant.area?.toLowerCase().includes(searchLower) ??
            plant.country?.toLowerCase().includes(searchLower)
          )
        );
      })
    : companiesList;

  // Calculate stats
  const totalCompanies = companiesList.length;
  const activeRegions = new Set(
    companiesList.flatMap(company => {
      const officeCountries = company.offices.map(office => office.country).filter(Boolean);
      const plantCountries = company.plants.map(plant => plant.country).filter(Boolean);
      return [...officeCountries, ...plantCountries];
    })
  ).size;

  // Handle view customer
  const handleViewCustomer = (company: Company) => {
    setSelectedCustomer(company);
    setShowDetailView(true);
  };

  // Handle edit customer
  const handleEditCustomer = (company: Company) => {
    setCustomerToEdit(company);
  };

  // Handle delete customer
  const handleDeleteCustomer = (company: Company) => {
    setCustomerToDelete(company);
    setShowDeleteDialog(true);
  };


  // Confirm delete
  const confirmDelete = (entityId: string) => {
    if (customerToDelete) {
      deleteCompany.mutate({ id: entityId });
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
              <p className="text-2xl text-gray-900 mt-1 font-semibold">{totalCompanies}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <Building className="w-6 h-6 text-blue-600" />
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
                placeholder="Search by company name, city, state, location, or country..."
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
                    <th className="text-background h-10 px-4 text-left align-middle font-medium bg-white">Status</th>
                    <th className="text-background h-10 px-4 text-left align-middle font-medium bg-white">Actions</th>
                  </tr>
                </thead>
                <tbody className="[&_tr:last-child]:border-0">
                  {companiesLoading ? (
                    <tr>
                      <td colSpan={4} className="p-8 text-center">
                        <div className="animate-pulse space-y-4">
                          <div className="h-4 bg-gray-200 rounded w-1/3 mx-auto"></div>
                          <div className="h-4 bg-gray-200 rounded w-1/4 mx-auto"></div>
                        </div>
                      </td>
                    </tr>
                  ) : filteredCompanies.length > 0 ? (
                    filteredCompanies.map(company => (
                      <tr key={company.id} className="hover:bg-gray-50 data-[state=selected]:bg-muted border-b transition-colors">
                        <td className="p-4 align-middle whitespace-nowrap">
                          <div>
                            <div className="text-sm text-gray-900 font-medium flex items-center gap-2">
                              {company.name}
                              <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800">
                                Company
                              </span>
                            </div>
                            {/* Show offices and plants */}
                            {company.offices && company.offices.length > 0 ? (
                              company.offices.map(office => (
                                <div 
                                  key={office.id} 
                                  className="text-xs font-medium text-blue-600"
                                >
                                  🏢 {office.name}
                                  {office.city && office.state && (
                                    <span className="text-gray-500 ml-1">
                                      ({office.city}, {office.state})
                                    </span>
                                  )}
                                </div>
                              ))
                            ) : company.plants && company.plants.length > 0 ? (
                              <>
                                {company.plants.map(plant => (
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
                              <div className="text-xs text-gray-500">No offices or plants added</div>
                            )}
                          </div>
                        </td>
                        <td className="p-4 align-middle whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {company.offices && company.offices.length > 0 ? (
                              <>
                                {company.offices[0].city}, {company.offices[0].state}
                              </>
                            ) : (
                              <span className="text-gray-500">No address</span>
                            )}
                          </div>
                          <div className="text-xs text-gray-500">
                            {company.offices && company.offices.length > 0 ? 
                              company.offices[0].country : 'No country'
                            }
                          </div>
                        </td>
                        <td className="p-4 align-middle whitespace-nowrap">
                          <span className="inline-flex items-center justify-center rounded-md border px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 border-transparent bg-blue-100 text-blue-800">
                            New
                          </span>
                        </td>
                        <td className="p-4 align-middle whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            
                            {/* View Button - for both customers and companies */}
                            <button 
                              onClick={() => handleViewCustomer(company)}
                              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all hover:bg-blue-100 h-8 w-8 rounded-md text-blue-600 hover:text-blue-700"
                              title="View Company Details"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            
                            {/* Edit Button - for both customers and companies */}
                            <button 
                              onClick={() => handleEditCustomer(company)}
                              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all hover:bg-yellow-100 h-8 w-8 rounded-md text-yellow-600 hover:text-yellow-700"
                              title="Edit Company"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            
                            {/* Delete Button - for both customers and companies */}
                            <button 
                              onClick={() => handleDeleteCustomer(company)}
                              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all hover:bg-red-100 h-8 w-8 rounded-md text-red-600 hover:text-red-700"
                              title="Delete Company"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="text-center py-8">
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
          {filteredCompanies.length > 0 && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-gray-500">
                {searchTerm.length > 0 
                  ? `Found ${filteredCompanies.length} matching companies`
                  : `Showing ${filteredCompanies.length} of ${companiesList.length} companies`
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
          isDeleting={deleteCompany.isPending}
        />
      )}

      {/* Add Location Modal - temporarily disabled - needs company.addLocation API */}

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </div>
  );
}
