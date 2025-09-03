'use client';

import { api } from '@/trpc/client';
import { CreateCustomerFormWithLocations } from './_components/CreateCustomerFormWithLocations';
import { CustomerDetailView } from './_components/CustomerDetailView';
import { EditCustomerForm } from './_components/EditCustomerForm';
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
  officeName?: string | null;
  officeAddress?: string | null;
  officeCity?: string | null;
  officeState?: string | null;
  officeCountry?: string | null;
  officeReceptionNumber?: string | null;
  plantName?: string | null;
  plantAddress?: string | null;
  plantCity?: string | null;
  plantState?: string | null;
  plantCountry?: string | null;
  plantReceptionNumber?: string | null;
  createdAt: Date;
  updatedAt: Date;
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
}

export default function CustomersPage() {
  // Fetch the list of customers using our new tRPC hook
  const { data: customers, isLoading, error } = api.customer.getAllWithLocations.useQuery();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState<'all' | 'office' | 'plant'>('all');
  const [showForm, setShowForm] = useState(false);
  
  // Advanced search using the new searchByOfficeOrPlant endpoint
  const { data: searchResults, isLoading: isSearching } = api.customer.searchByOfficeOrPlant.useQuery(
    {
      searchTerm: searchTerm,
      searchType: searchType === 'all' ? 'both' : searchType,
    },
    {
      enabled: searchTerm.length > 0,
    }
  );
  
  // State for modals
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showDetailView, setShowDetailView] = useState(false);

  const [customerToEdit, setCustomerToEdit] = useState<Customer | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);

  // State for AddLocationModal
  const [showAddLocationModal, setShowAddLocationModal] = useState(false);
  const [customerForLocation, setCustomerForLocation] = useState<Customer | null>(null);

  // Toast notifications
  const { toasts, success, error: showError, removeToast } = useToast();

  // tRPC utility to manually refetch data
  const utils = api.useUtils();

  // Delete customer mutation
  const deleteCustomer = api.customer.delete.useMutation({
    onSuccess: () => {
      // Invalidate and refetch customers
      utils.customer.getAllWithLocations.invalidate();
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

  // Reset form state when page loads (when user clicks on customers sidebar)
  useEffect(() => {
    setShowForm(false);
  }, []);

  if (error) return <div>Error: {error.message}</div>;

  // Use search results if searching, otherwise use all customers
      const filteredCustomers = searchTerm.length > 0 ? (searchResults ?? []) : (customers ?? []);

  // Calculate stats
      const totalCustomers = customers?.length ?? 0;
    const newCustomers = customers?.filter((c: Customer) => c.isNew).length ?? 0;
    const activeRegions = new Set(customers?.map((c: Customer) => c.officeCountry).filter(Boolean)).size;

  // Handle view customer
  const handleViewCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowDetailView(true);
  };

  // Handle edit customer
  const handleEditCustomer = (customer: Customer) => {
    setCustomerToEdit(customer);
  };

  // Handle delete customer
  const handleDeleteCustomer = (customer: Customer) => {
    setCustomerToDelete(customer);
    setShowDeleteDialog(true);
  };

  // Handle add location
  const handleAddLocation = (customer: Customer) => {
    setCustomerForLocation(customer);
    setShowAddLocationModal(true);
  };

  // Confirm delete
  const confirmDelete = (customerId: string) => {
    if (customerToDelete) {
      deleteCustomer.mutate({ id: customerId });
    }
  };

  if (showForm) {
    return (
      <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl text-gray-900 font-bold">New Customer</h1>
          <p className="text-gray-600 mt-1">Add a new customer to your database</p>
        </div>
        <CreateCustomerFormWithLocations onSuccess={() => setShowForm(false)} />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl text-gray-900 font-bold">Customers</h1>
          <p className="text-gray-600 mt-1">
            Manage your customer database and relationships
          </p>
        </div>
        <button 
          onClick={() => setShowForm(true)}
          className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all bg-blue-600 text-white hover:bg-blue-700 px-4 py-2"
        >
          <Plus className="h-4 w-4" />
          New Customer
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl border shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Customers</p>
              <p className="text-2xl text-gray-900 mt-1 font-semibold">{totalCustomers}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">New Customers</p>
              <p className="text-2xl text-gray-900 mt-1 font-semibold">{newCustomers}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <Building className="w-6 h-6 text-green-600" />
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
              <h4 className="text-lg font-semibold text-gray-900">Customer Directory</h4>
              <p className="text-gray-600 text-sm">Browse and manage all customer information</p>
            </div>
          </div>
        </div>
        
        <div className="px-6 pb-6">
          {/* Search and Filters */}
          <div className="flex items-center space-x-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                placeholder="Search by office name, plant name, or customer details..."
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
                    <th className="text-background h-10 px-4 text-left align-middle font-medium bg-white">Customer & Locations</th>
                    <th className="text-background h-10 px-4 text-left align-middle font-medium bg-white">Office Location</th>
                    <th className="text-background h-10 px-4 text-left align-middle font-medium bg-white">Contact</th>
                    <th className="text-background h-10 px-4 text-left align-middle font-medium bg-white">Status</th>
                    <th className="text-background h-10 px-4 text-left align-middle font-medium bg-white">Created</th>
                    <th className="text-background h-10 px-4 text-left align-middle font-medium bg-white">Actions</th>
                  </tr>
                </thead>
                <tbody className="[&_tr:last-child]:border-0">
                  {isLoading || isSearching ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center">
                        <div className="animate-pulse space-y-4">
                          <div className="h-4 bg-gray-200 rounded w-1/3 mx-auto"></div>
                          <div className="h-4 bg-gray-200 rounded w-1/4 mx-auto"></div>
                        </div>
                      </td>
                    </tr>
                  ) : filteredCustomers.length > 0 ? (
                    filteredCustomers.map((customer: Customer) => (
                      <tr key={customer.id} className="hover:bg-gray-50 data-[state=selected]:bg-muted border-b transition-colors">
                        <td className="p-4 align-middle whitespace-nowrap">
                          <div>
                            <div className="text-sm text-gray-900 font-medium">{customer.name}</div>
                            {/* Show locations from the new Location model */}
                            {customer.locations && customer.locations.length > 0 ? (
                              customer.locations.map((location) => (
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
                            ) : (
                              // Fallback to old single office/plant display
                              <>
                                {customer.officeName && (
                                  <div className="text-xs text-blue-600 font-medium">🏢 {customer.officeName}</div>
                                )}
                                {customer.plantName && (
                                  <div className="text-xs text-green-600 font-medium">🏭 {customer.plantName}</div>
                                )}
                              </>
                            )}
                          </div>
                        </td>
                        <td className="p-4 align-middle whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {customer.officeCity}, {customer.officeState}
                          </div>
                          <div className="text-xs text-gray-500">{customer.officeCountry}</div>
                        </td>
                        <td className="p-4 align-middle whitespace-nowrap">
                          <div className="text-sm text-gray-900">{customer.officeReceptionNumber}</div>
                        </td>
                        <td className="p-4 align-middle whitespace-nowrap">
                          <span className="inline-flex items-center justify-center rounded-md border px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 border-transparent bg-blue-100 text-blue-800">
                            {customer.isNew ? 'New' : 'Existing'}
                          </span>
                        </td>
                        <td className="p-4 align-middle whitespace-nowrap text-sm text-gray-500">
                          {new Date(customer.createdAt).toLocaleDateString()}
                        </td>
                        <td className="p-4 align-middle whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            {/* Add Location Button */}
                            <button 
                              onClick={() => handleAddLocation(customer)}
                              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all hover:bg-green-100 h-8 w-8 rounded-md text-green-600 hover:text-green-700"
                              title="Add Office or Plant"
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                            
                            {/* View Button */}
                            <button 
                              onClick={() => handleViewCustomer(customer)}
                              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all hover:bg-blue-100 h-8 w-8 rounded-md text-blue-600 hover:text-blue-700"
                              title="View Customer Details"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            
                            {/* Edit Button */}
                            <button 
                              onClick={() => handleEditCustomer(customer)}
                              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all hover:bg-yellow-100 h-8 w-8 rounded-md text-yellow-600 hover:text-yellow-700"
                              title="Edit Customer"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            
                            {/* Delete Button */}
                            <button 
                              onClick={() => handleDeleteCustomer(customer)}
                              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all hover:bg-red-100 h-8 w-8 rounded-md text-red-600 hover:text-red-700"
                              title="Delete Customer"
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
                          {searchTerm ? 'No customers found matching your search.' : 'No customers found.'}
                        </div>
                        {!searchTerm && (
                          <button 
                            onClick={() => setShowForm(true)}
                            className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 mt-4 px-4 py-2"
                          >
                            <Plus className="h-4 w-4" />
                            Add First Customer
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
          {filteredCustomers.length > 0 && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-gray-500">
                {searchTerm.length > 0 
                  ? `Found ${filteredCustomers.length} matching customers`
                  : `Showing ${filteredCustomers.length} of ${customers?.length ?? 0} customers`
                }
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Customer Detail View Modal */}
      {selectedCustomer && (
        <CustomerDetailView
          customer={selectedCustomer}
          isOpen={showDetailView}
          onClose={() => {
            setShowDetailView(false);
            setSelectedCustomer(null);
          }}
        />
      )}

      {/* Edit Customer Modal */}
      {customerToEdit && (
        <EditCustomerForm
          customer={customerToEdit}
          onCancel={() => {
            setCustomerToEdit(null);
          }}
          onSuccess={() => {
            setCustomerToEdit(null);
          }}
        />
      )}

      {/* Delete Confirmation Dialog */}
      {customerToDelete && (
        <DeleteConfirmationDialog
          customerName={customerToDelete.name}
          isOpen={showDeleteDialog}
          onClose={() => {
            setShowDeleteDialog(false);
            setCustomerToDelete(null);
          }}
          onConfirm={() => confirmDelete(customerToDelete.id)}
          isDeleting={deleteCustomer.isPending}
        />
      )}

      {/* Add Location Modal */}
      {customerForLocation && (
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
            utils.customer.getAllWithLocations.invalidate();
          }}
        />
      )}

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </div>
  );
}
