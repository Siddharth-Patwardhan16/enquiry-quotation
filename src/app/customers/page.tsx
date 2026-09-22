'use client';

import { api } from '@/trpc/client';
import { EntityDetailView } from './_components/EntityDetailView';
import { EntityEditForm } from './_components/EntityEditForm';
import { DeleteConfirmationDialog } from './_components/DeleteConfirmationDialog';
import { ToastContainer, useToast } from '@/components/ui/toast';
import { useState, useEffect } from 'react';
import { keepPreviousData } from '@tanstack/react-query';
import { useDebounce } from '@/app/customer-details/_hooks/useDebounce';
import {
  Search,
  Plus,
  Eye,
  Edit,
  Trash2,
  Building,
  MapPin,
  ChevronLeft,
  ChevronRight
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
    email?: string;
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
  // Sort state
  const [sortBy, setSortBy] = useState<'name' | 'createdAt' | 'updatedAt' | 'type'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState<'all' | 'office' | 'plant'>('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const debouncedSearchTerm = useDebounce(searchTerm, 350);

  // Reset to page 1 whenever search/sort/searchType changes.
  useEffect(() => {
    setPage(1);
  }, [debouncedSearchTerm, searchType, sortBy, sortOrder]);

  // Fetch companies only (new company-based structure) with server-side search/sort/pagination
  const { data: paginatedData, isLoading: companiesLoading, error: companiesError } = api.company.getPaginated.useQuery(
    {
      page,
      pageSize,
      search: debouncedSearchTerm.trim() || undefined,
      searchType,
      sortBy,
      sortOrder,
    },
    { placeholderData: keepPreviousData },
  );
  const companies = paginatedData?.items;
  const totalCompaniesServer = paginatedData?.total ?? 0;
  const totalPages = Math.max(1, paginatedData?.totalPages ?? 1);

  // Server-computed count of distinct countries across all offices/plants (not just the
  // current page).
  const { data: regionCountData } = api.company.getRegionCount.useQuery();

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
      utils.company.getPaginated.invalidate();
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

  // Update selectedCustomer when companies data changes (e.g., after edit)
  useEffect(() => {
    if (selectedCustomer && companies && companies.length > 0) {
      const updatedCompany = companiesList.find(c => c.id === selectedCustomer.id);
      if (updatedCompany) {
        setSelectedCustomer({
          ...updatedCompany,
          type: 'company' as const,
          isNew: false
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companies]);

  if (companiesError) {
    return <div>Error: {companiesError?.message}</div>;
  }

  // Search/sort are now done server-side by company.getPaginated; this page's list is
  // already the current, filtered page of results.
  const filteredCompanies = companiesList;

  // Calculate stats. Both are server-reported aggregates across all companies, not just
  // the current page.
  const totalCompanies = totalCompaniesServer;
  const activeRegions = regionCountData?.count ?? 0;

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

  const formatPrimaryAddress = (location?: {
    address?: string | null;
    area?: string | null;
    city?: string | null;
    state?: string | null;
  } | null) => {
    if (!location) return 'No address';
    if (location.address) return location.address;
    const combined = [location.area, location.city, location.state].filter(Boolean).join(', ');
    return combined || 'No address';
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
          <div className="flex flex-col gap-4 mb-6">
            <div className="flex items-center space-x-4">
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
              
            </div>
            
            {/* Sort Dropdown */}
            <div className="flex items-center space-x-2">
              <label htmlFor="sort-by" className="text-sm font-medium text-gray-700 whitespace-nowrap">
                Sort by:
              </label>
              <select
                id="sort-by"
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [field, order] = e.target.value.split('-') as ['name' | 'createdAt' | 'updatedAt' | 'type', 'asc' | 'desc'];
                  setSortBy(field);
                  setSortOrder(order);
                }}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-700"
              >
                <option value="name-asc">Name (A-Z)</option>
                <option value="name-desc">Name (Z-A)</option>
                <option value="createdAt-desc">Created Date (Newest)</option>
                <option value="createdAt-asc">Created Date (Oldest)</option>
                <option value="updatedAt-desc">Updated Date (Newest)</option>
                <option value="updatedAt-asc">Updated Date (Oldest)</option>
                <option value="type-asc">Type (Company/Customer)</option>
              </select>
            </div>
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
                                {formatPrimaryAddress(company.offices[0])}
                              </>
                            ) : company.plants && company.plants.length > 0 ? (
                              <>
                                {formatPrimaryAddress(company.plants[0])}
                              </>
                            ) : (
                              <span className="text-gray-500">No address</span>
                            )}
                          </div>
                          <div className="text-xs text-gray-500">
                            {(company.offices && company.offices.length > 0
                              ? company.offices[0].country
                              : company.plants && company.plants.length > 0
                                ? company.plants[0].country
                                : null) ?? 'No country'}
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

          {/* Pagination Controls */}
          {totalCompaniesServer > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t border-gray-200">
              <div className="text-sm text-gray-500">
                Showing <span className="font-medium text-gray-900">{((page - 1) * pageSize) + 1}</span> to{' '}
                <span className="font-medium text-gray-900">{Math.min(page * pageSize, totalCompaniesServer)}</span> of{' '}
                <span className="font-medium text-gray-900">{totalCompaniesServer}</span> companies
              </div>

              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <span>Rows per page:</span>
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value));
                      setPage(1);
                    }}
                    className="border border-gray-300 rounded px-2 py-1 text-sm bg-white focus:ring-blue-500 focus:outline-none"
                  >
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </div>

                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => setPage((p) => Math.max(p - 1, 1))}
                    disabled={page <= 1 || companiesLoading}
                    className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:pointer-events-none transition-colors"
                    title="Previous Page"
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Prev
                  </button>
                  <span className="px-3 text-sm text-gray-700 font-medium">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                    disabled={page >= totalPages || companiesLoading}
                    className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:pointer-events-none transition-colors"
                    title="Next Page"
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </button>
                </div>
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
          onSuccess={async () => {
            setCustomerToEdit(null);
            // Refresh data and wait for it to complete
            await utils.company.getPaginated.invalidate();
            await utils.company.getAll.invalidate();
            // Refetch to ensure we have the latest data
            await utils.company.getPaginated.refetch();
            // Show success toast
            success('Company Updated', 'The company information has been successfully updated.');
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
