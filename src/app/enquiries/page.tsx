'use client';

import { useState } from 'react';
import { api } from '@/trpc/client';
import { useToastContext } from '@/components/providers/ToastProvider';
import { CreateEnquiryForm } from './_components/CreateEnquiryForm';
import { ReceiptDateModal } from './_components/ReceiptDateModal';
import { EnquiryStatusModal } from './_components/EnquiryStatusModal';
import { EnquiryCommunicationDrawer } from './_components/EnquiryCommunicationDrawer';

import { 
  Search, 
  Plus, 
  Eye, 
  Filter,
  FileText,
  Calendar,
  User,
  Edit,
  Trash2,
  X,
  Building,
  MessageSquare
} from 'lucide-react';


export default function EnquiriesPage() {
  const { success, error: showError } = useToastContext();
  const enquiriesQuery = api.enquiry.getAll.useQuery();
  const { data: stats } = api.enquiry.getStats.useQuery();
  const { data: enquiries, isLoading, error } = enquiriesQuery;
  const { data: employees } = api.employee.getAll.useQuery();
  const updateEnquiryMutation = api.enquiry.update.useMutation({
    onSuccess: () => {
      success('Enquiry Updated', 'The enquiry has been successfully updated.');
      enquiriesQuery.refetch();
      setEditingEnquiry(null);
      setEditData({});
    },
  });

  const updateStatusMutation = api.enquiry.updateStatus.useMutation({
    onSuccess: () => {
      success('Status Updated', 'The enquiry status has been successfully updated.');
      enquiriesQuery.refetch();
    },
    onError: (error) => {
      // Extract error message from tRPC error
      let errorMessage = 'Failed to update enquiry. Please check all fields and try again.';
      
      if (error.message) {
        // Try to parse the error message if it's JSON (tRPC validation errors)
        try {
          const parsed = JSON.parse(error.message) as Array<{ message?: string; path?: string | string[]; code?: string }>;
          if (Array.isArray(parsed) && parsed.length > 0) {
            // Get the first error message
            const firstError = parsed[0];
            if (firstError?.message) {
              errorMessage = firstError.message;
            } else if (firstError?.path && firstError?.code) {
              // Format validation error
              const fieldName = Array.isArray(firstError.path) ? firstError.path.join('.') : firstError.path;
              errorMessage = `Invalid value for ${fieldName}. ${firstError.message ?? 'Please check the field and try again.'}`;
            }
          }
        } catch {
          // If not JSON, use the error message directly
          if (error.message.includes('UUID')) {
            errorMessage = 'Invalid employee selection. Please select a valid employee or leave the field empty.';
          } else {
            errorMessage = error.message;
          }
        }
      }
      
      // Show user-friendly error toast
      showError('Update Failed', errorMessage);
    },
  });
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  // Define the edit data type
  type EditEnquiryData = {
    subject?: string;
    enquiryDate?: string;
    source?: 'Website' | 'Email' | 'Phone' | 'Referral' | 'Trade Show' | 'Social Media' | 'Visit';
    quotationNumber?: string;
    quotationDate?: string;
    region?: string;
    oaNumber?: string;
    oaDate?: string;
    blockModel?: string;
    numberOfBlocks?: number;
    designRequired?: 'Yes' | 'No';
    attendedById?: string;
    customerType?: 'NEW' | 'OLD';
    status?: 'LIVE' | 'DEAD' | 'RCD' | 'LOST';
    dateOfReceipt?: string;
  };

  const [editingEnquiry, setEditingEnquiry] = useState<number | null>(null);
  const [editData, setEditData] = useState<EditEnquiryData>({});
  const [originalAttendedById, setOriginalAttendedById] = useState<string | null | undefined>(undefined);
  const [viewingEnquiry, setViewingEnquiry] = useState<number | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [receiptModalEnquiryId, setReceiptModalEnquiryId] = useState<number | null>(null);
  const [showWonModal, setShowWonModal] = useState(false);
  const [wonModalEnquiryId, setWonModalEnquiryId] = useState<number | null>(null);
  const [selectedEnquiryId, setSelectedEnquiryId] = useState<number | null>(null);
  const [isCommunicationDrawerOpen, setIsCommunicationDrawerOpen] = useState(false);

  if (error) return <div>Error: {error.message}</div>;

  // Filter enquiries based on search and status
  const filteredEnquiries = enquiries?.filter((enquiry) => {
    const companyName = enquiry.company?.name ?? '';
    const entityName = companyName;
    
    const subjectStr = String(enquiry.subject ?? '');
    const marketingPersonName = enquiry.marketingPerson?.name ?? '';
    
    const matchesSearch = 
      subjectStr.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entityName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      marketingPersonName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || enquiry.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  }) ?? [];

  // Use backend stats if available, otherwise show loading
  const displayStats = stats ? {
    total: stats.total,
    live: stats.live,
    dead: stats.dead,
    rcd: stats.rcd,
    lost: stats.lost
  } : {
    total: 0,
    live: 0,
    dead: 0,
    rcd: 0,
    lost: 0
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'LIVE': { color: 'bg-green-100 text-green-800', label: 'Live' },
      'DEAD': { color: 'bg-red-100 text-red-800', label: 'Dead' },
      'RCD': { color: 'bg-blue-100 text-blue-800', label: 'RCD (Received)' },
      'LOST': { color: 'bg-gray-100 text-gray-800', label: 'Lost' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig['LIVE'];
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const handleViewEnquiry = (enquiryId: number) => {
    setViewingEnquiry(enquiryId);
  };

  const handleEditEnquiry = (enquiryId: number) => {
    const enquiry = enquiries?.find((e) => e.id === enquiryId);
    if (enquiry) {
      // Close view modal if open
      if (viewingEnquiry === enquiryId) {
        setViewingEnquiry(null);
      }
      // Open edit form
      setEditingEnquiry(enquiryId);
      // Store original attendedById to detect if we're clearing it
      setOriginalAttendedById(enquiry.attendedById ?? null);
      setEditData({
        subject: enquiry.subject ?? undefined,
        enquiryDate: enquiry.enquiryDate ? new Date(enquiry.enquiryDate).toISOString().split('T')[0] : undefined,
        source: enquiry.source ? (enquiry.source as 'Website' | 'Email' | 'Phone' | 'Referral' | 'Trade Show' | 'Social Media' | 'Visit') : undefined,
        quotationNumber: enquiry.quotationNumber ?? undefined,
        quotationDate: enquiry.quotationDate ? new Date(enquiry.quotationDate).toISOString().split('T')[0] : undefined,
        region: enquiry.region ?? undefined,
        oaNumber: enquiry.oaNumber ?? undefined,
        oaDate: enquiry.oaDate ? new Date(enquiry.oaDate).toISOString().split('T')[0] : undefined,
        blockModel: enquiry.blockModel ?? undefined,
        numberOfBlocks: enquiry.numberOfBlocks ? Number(enquiry.numberOfBlocks) : undefined,
        designRequired: enquiry.designRequired ? (enquiry.designRequired as 'Yes' | 'No') : undefined,
        attendedById: enquiry.attendedById ?? undefined,
        customerType: enquiry.customerType ? (enquiry.customerType as 'NEW' | 'OLD') : undefined,
        status: enquiry.status ? (enquiry.status as 'LIVE' | 'DEAD' | 'RCD' | 'LOST') : undefined,
        dateOfReceipt: enquiry.dateOfReceipt ? new Date(enquiry.dateOfReceipt).toISOString().split('T')[0] : undefined,
      });
    }
  };

  const handleDeleteEnquiry = (enquiryId: number) => {
    if (confirm('Are you sure you want to delete this enquiry? This action cannot be undone.')) {
      try {
        // For now, just show a success message since the API expects different types
        alert(`Delete functionality would be implemented here for enquiry ${enquiryId} with proper API integration`);
        // In a real implementation, you would call the delete API here
      } catch {
        // Error handling is managed by tRPC and toast notifications
      }
    }
  };

  const handleSaveEdit = () => {
    if (editingEnquiry) {
      try {
        // Clean up editData: convert empty strings to undefined for UUID fields
        const cleanedData: Partial<EditEnquiryData> & { id: number } = { 
          id: editingEnquiry
        };
        
        // Copy all fields from editData, but clean up attendedById
        Object.keys(editData).forEach(key => {
          const value = editData[key as keyof EditEnquiryData];
          
          // Special handling for attendedById
          if (key === 'attendedById') {
            const cleanedValue = value && 
                typeof value === 'string' && 
                value.trim() !== '' && 
                value.trim().toLowerCase() !== 'null' && 
                value.trim().toLowerCase() !== 'undefined'
              ? value.trim()
              : undefined;
            
            // If it was originally set but is now empty, send null to clear it
            // Otherwise, if it has a value, send it; if it was never set, omit it
            if (cleanedValue) {
              (cleanedData as Record<string, unknown>)[key] = cleanedValue;
            } else if (originalAttendedById !== undefined && originalAttendedById !== null) {
              // Was originally set, now empty - send null to clear
              (cleanedData as Record<string, unknown>)[key] = null;
            }
            // Otherwise omit (was never set, still not set)
            return;
          }
          
          // For other fields, include them as-is (they can be undefined)
          (cleanedData as Record<string, unknown>)[key] = value;
        });
        
        // Type assertion needed because cleanedData is built dynamically
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        updateEnquiryMutation.mutate(cleanedData as any);
      } catch {
        // Error handling is managed by tRPC and toast notifications
        showError('Update Error', 'An unexpected error occurred. Please try again.');
      }
    }
  };

  const handleCancelEdit = () => {
    setEditingEnquiry(null);
    setEditData({});
    setOriginalAttendedById(undefined);
  };

  const handleCloseView = () => {
    setViewingEnquiry(null);
  };



  const handleCreateEnquiry = () => {
    setShowCreateForm(true);
  };

  const handleEnquirySuccess = () => {
    setShowCreateForm(false);
  };

  if (showCreateForm) {
    return (
      <CreateEnquiryForm onSuccess={handleEnquirySuccess} />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Enquiries</h1>
              <p className="mt-2 text-gray-600">Manage customer enquiries and track their progress</p>
            </div>
            <button
              onClick={handleCreateEnquiry}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Enquiry
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                    <FileText className="w-5 h-5 text-white" />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Enquiries</dt>
                    <dd className="text-lg font-medium text-gray-900">{displayStats.total}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                    <Plus className="w-5 h-5 text-white" />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Live Enquiries</dt>
                    <dd className="text-lg font-medium text-gray-900">{displayStats.live}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-red-500 rounded-md flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-white" />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Dead Enquiries</dt>
                    <dd className="text-lg font-medium text-gray-900">{displayStats.dead}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                    <User className="w-5 h-5 text-white" />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">RCD (Received)</dt>
                    <dd className="text-lg font-medium text-gray-900">{displayStats.rcd}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Enquiries Table */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-900">Enquiry Management</h3>
                <p className="mt-1 text-sm text-gray-500">Track and manage all customer enquiries</p>
              </div>
            </div>
          </div>
          
          <div className="px-6 pb-6">
            {/* Search and Filters */}
            <div className="flex items-center space-x-4 mb-6">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  placeholder="Search by subject, customer, or marketing person..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Statuses</option>
                <option value="LIVE">Live</option>
                <option value="DEAD">Dead</option>
                <option value="RCD">RCD (Received)</option>
                <option value="LOST">Lost</option>
              </select>
              <button className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 px-4 py-2">
                <Filter className="h-4 w-4" />
                More Filters
              </button>
            </div>

            {/* Table */}
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="relative w-full overflow-x-auto">
                <table className="w-full caption-bottom text-sm">
                  <thead className="[&_tr]:border-b bg-gray-50">
                    <tr>
                      <th className="text-black h-10 px-4 text-left align-middle font-medium whitespace-nowrap">Enq-ID</th>
                      <th className="text-black h-10 px-4 text-left align-middle font-medium whitespace-nowrap">Quotation Number</th>
                      <th className="text-black h-10 px-4 text-left align-middle font-medium whitespace-nowrap">Subject</th>
                      <th className="text-black h-10 px-4 text-left align-middle font-medium whitespace-nowrap">Customer</th>
                      <th className="text-black h-10 px-4 text-left align-middle font-medium whitespace-nowrap">Date</th>
                      <th className="text-black h-10 px-4 text-left align-middle font-medium whitespace-nowrap">Status</th>
                      <th className="text-black h-10 px-4 text-right align-middle font-medium whitespace-nowrap">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="[&_tr:last-child]:border-0">
                    {isLoading ? (
                      <tr>
                        <td colSpan={7} className="p-8 text-center">
                          <div className="animate-pulse space-y-4">
                            <div className="h-4 bg-gray-200 rounded w-1/3 mx-auto"></div>
                            <div className="h-4 bg-gray-200 rounded w-1/4 mx-auto"></div>
                          </div>
                        </td>
                      </tr>
                    ) : filteredEnquiries.length > 0 ? (
                      filteredEnquiries.map((enquiry) => (
                        <tr key={enquiry.id} className="hover:bg-gray-50 data-[state=selected]:bg-muted border-b transition-colors">
                                                     <td className="p-4 align-middle whitespace-nowrap text-sm text-gray-900">
                             #{enquiry.id.toString().slice(-8)}
                           </td>
                           <td className="p-4 align-middle whitespace-nowrap text-sm text-gray-900">
                             {enquiry.quotationNumber ?? '-'}
                           </td>
                                                     <td className="p-4 align-middle">
                             <div className="text-sm text-gray-900">{enquiry.subject ?? 'No subject'}</div>
                           </td>
                          <td className="p-4 align-middle whitespace-nowrap text-sm text-gray-900">
                            {enquiry.company?.name ?? 'N/A'}
                          </td>
                          <td className="p-4 align-middle whitespace-nowrap text-sm text-gray-500">
                            {new Date(enquiry.createdAt).toLocaleDateString()}
                          </td>
                          <td className="p-4 align-middle whitespace-nowrap">
                            <div className="space-y-1">
                              <select
                                value={enquiry.status}
                                onChange={(e) => {
                                  const newStatus = e.target.value as 'LIVE' | 'DEAD' | 'RCD' | 'LOST' | 'WON' | 'BUDGETARY';
                                  if (newStatus === 'RCD') {
                                    // Open receipt modal for RCD status
                                    setReceiptModalEnquiryId(enquiry.id);
                                    setShowReceiptModal(true);
                                  } else if (newStatus === 'WON') {
                                    // Open WON modal for PO details
                                    setWonModalEnquiryId(enquiry.id);
                                    setShowWonModal(true);
                                  } else {
                                    // Update status directly for other statuses
                                    updateStatusMutation.mutate({
                                      id: enquiry.id,
                                      status: newStatus,
                                    });
                                  }
                                }}
                                className="text-xs px-2 py-1 rounded-full border-0 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                style={{
                                  backgroundColor: enquiry.status === 'LIVE' ? '#dcfce7' : 
                                                 enquiry.status === 'DEAD' ? '#fecaca' :
                                                 enquiry.status === 'RCD' ? '#dbeafe' :
                                                 enquiry.status === 'WON' ? '#d1fae5' :
                                                 enquiry.status === 'BUDGETARY' ? '#fef3c7' : '#f3f4f6',
                                  color: enquiry.status === 'LIVE' ? '#166534' :
                                         enquiry.status === 'DEAD' ? '#991b1b' :
                                         enquiry.status === 'RCD' ? '#1e40af' :
                                         enquiry.status === 'WON' ? '#065f46' :
                                         enquiry.status === 'BUDGETARY' ? '#92400e' : '#374151'
                                }}
                              >
                                <option value="LIVE">Live</option>
                                <option value="DEAD">Dead</option>
                                <option value="RCD">RCD (Received)</option>
                                <option value="WON">WON</option>
                                <option value="LOST">Lost</option>
                                <option value="BUDGETARY">Budgetary</option>
                              </select>
                              {(enquiry.status === 'WON' || enquiry.status === 'RCD') && (enquiry.purchaseOrderNumber ?? enquiry.poValue ?? enquiry.poDate) && (
                                <div className="text-xs text-gray-600 mt-1 space-y-0.5">
                                  {enquiry.purchaseOrderNumber && (
                                    <div>PO: {enquiry.purchaseOrderNumber}</div>
                                  )}
                                  {enquiry.poValue && (
                                    <div>Value: ₹{Number(enquiry.poValue).toLocaleString()}</div>
                                  )}
                                  {enquiry.poDate && (
                                    <div>Date: {new Date(enquiry.poDate).toLocaleDateString()}</div>
                                  )}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="p-4 align-middle whitespace-nowrap text-right">
                            <div className="flex items-center justify-end space-x-2">
                              <button
                                onClick={() => {
                                  setSelectedEnquiryId(enquiry.id);
                                  setIsCommunicationDrawerOpen(true);
                                }}
                                className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all hover:bg-purple-100 h-8 w-8 rounded-md text-purple-600 hover:text-purple-700"
                                title="View Communications"
                              >
                                <MessageSquare className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleViewEnquiry(enquiry.id)}
                                className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all hover:bg-blue-100 h-8 w-8 rounded-md text-blue-600 hover:text-blue-700"
                                title="View Enquiry Details"
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleEditEnquiry(enquiry.id)}
                                className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all hover:bg-green-100 h-8 w-8 rounded-md text-green-600 hover:text-green-700"
                                title="Edit Enquiry"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteEnquiry(enquiry.id)}
                                className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all hover:bg-red-100 h-8 w-8 rounded-md text-red-600 hover:text-red-700"
                                title="Delete Enquiry"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={8} className="text-center py-8">
                          <div className="text-gray-500">
                            {searchTerm || statusFilter !== 'all' 
                              ? 'No enquiries found matching your criteria.' 
                              : 'No enquiries found.'}
                          </div>
                          {!searchTerm && statusFilter === 'all' && (
                            <button 
                              onClick={handleCreateEnquiry}
                              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 mt-4 px-4 py-2"
                            >
                              <Plus className="h-4 w-4" />
                              Create First Enquiry
                            </button>
                          )}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            {filteredEnquiries.length > 0 && (
              <div className="flex items-center justify-between mt-6">
                <div className="text-sm text-gray-500">
                  Showing {filteredEnquiries.length} of {enquiries?.length ?? 0} enquiries
                </div>
              </div>
            )}

            {/* Inline Edit Form */}
            {editingEnquiry && (
              <div className="mt-6 bg-white rounded-lg border shadow-sm p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <FileText className="w-5 h-5 mr-2 text-blue-600" />
                    Edit Enquiry
                  </h3>
                  <button
                    onClick={handleCancelEdit}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Enquiry Details Section */}
                <div className="bg-white rounded-xl border shadow-sm">
                  <div className="px-6 pt-6">
                    <h4 className="text-lg font-semibold text-gray-900 flex items-center">
                      <FileText className="w-5 h-5 mr-2 text-blue-600" />
                      Enquiry Details
                    </h4>
                    <p className="text-gray-900 text-sm">Update enquiry information</p>
                  </div>
                  <div className="px-6 pb-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label htmlFor="edit-enquiryDate" className="block text-sm font-medium text-gray-900">
                          Enquiry Date
                        </label>
                        <input
                          type="date"
                          id="edit-enquiryDate"
                          value={editData.enquiryDate ?? ''}
                          onChange={(e) => setEditData({ ...editData, enquiryDate: e.target.value || undefined })}
                          className="mt-1 block w-full pl-3 pr-3 py-2 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-black bg-white"
                        />
                      </div>

                      <div className="space-y-2">
                        <label htmlFor="edit-region" className="block text-sm font-medium text-gray-900">
                          Region
                        </label>
                        <input
                          id="edit-region"
                          value={editData.region ?? ''}
                          onChange={(e) => setEditData({ ...editData, region: e.target.value || undefined })}
                          className="mt-1 block w-full pl-3 pr-3 py-2 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-black bg-white"
                          placeholder="Enter region"
                        />
                      </div>

                      <div className="space-y-2">
                        <label htmlFor="edit-oaNumber" className="block text-sm font-medium text-gray-900">
                          O.A. No. (Order Acknowledge Number)
                        </label>
                        <input
                          id="edit-oaNumber"
                          value={editData.oaNumber ?? ''}
                          onChange={(e) => setEditData({ ...editData, oaNumber: e.target.value || undefined })}
                          className="mt-1 block w-full pl-3 pr-3 py-2 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-black bg-white"
                          placeholder="Enter O.A. number"
                        />
                      </div>

                      <div className="space-y-2">
                        <label htmlFor="edit-oaDate" className="block text-sm font-medium text-gray-900">
                          O.A. Date
                        </label>
                        <input
                          type="date"
                          id="edit-oaDate"
                          value={editData.oaDate ?? ''}
                          onChange={(e) => setEditData({ ...editData, oaDate: e.target.value || undefined })}
                          className="mt-1 block w-full pl-3 pr-3 py-2 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-black bg-white"
                        />
                      </div>

                      <div className="space-y-2">
                        <label htmlFor="edit-subject" className="block text-sm font-medium text-gray-900">
                      Subject
                    </label>
                    <input
                          id="edit-subject"
                          value={editData.subject ?? ''}
                          onChange={(e) => setEditData({ ...editData, subject: e.target.value || undefined })}
                          className="mt-1 block w-full pl-3 pr-3 py-2 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-black bg-white"
                          placeholder="Enter enquiry subject"
                    />
                  </div>

                      <div className="space-y-2">
                        <label htmlFor="edit-blockModel" className="block text-sm font-medium text-gray-900">
                          Block Model
                        </label>
                        <input
                          id="edit-blockModel"
                          value={editData.blockModel ?? ''}
                          onChange={(e) => setEditData({ ...editData, blockModel: e.target.value || undefined })}
                          className="mt-1 block w-full pl-3 pr-3 py-2 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-black bg-white"
                          placeholder="Enter block model"
                        />
                      </div>

                      <div className="space-y-2">
                        <label htmlFor="edit-numberOfBlocks" className="block text-sm font-medium text-gray-900">
                          No. of Blocks
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          id="edit-numberOfBlocks"
                          value={editData.numberOfBlocks ?? ''}
                          onChange={(e) => {
                            const value = e.target.value;
                            setEditData({ 
                              ...editData, 
                              numberOfBlocks: value && value.trim() !== '' ? parseFloat(value) : undefined 
                            });
                          }}
                          className="mt-1 block w-full pl-3 pr-3 py-2 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-black bg-white"
                          placeholder="Enter number of blocks"
                        />
                      </div>

                      <div className="space-y-2">
                        <label htmlFor="edit-designRequired" className="block text-sm font-medium text-gray-900">
                          Design Required
                        </label>
                        <select
                          id="edit-designRequired"
                          value={editData.designRequired ?? ''}
                          onChange={(e) => setEditData({ ...editData, designRequired: e.target.value ? (e.target.value as 'Yes' | 'No') : undefined })}
                          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-black bg-white"
                        >
                          <option value="" className="text-black bg-white">Select</option>
                          <option value="Yes" className="text-black bg-white">Yes</option>
                          <option value="No" className="text-black bg-white">No</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label htmlFor="edit-attendedById" className="block text-sm font-medium text-gray-900">
                          Attended By
                        </label>
                        <select
                          id="edit-attendedById"
                          value={editData.attendedById ?? ''}
                          onChange={(e) => {
                            const value = e.target.value;
                            // Convert empty string, "null", "undefined" to undefined
                            const cleanedValue = value && value.trim() !== '' && value !== 'null' && value !== 'undefined' 
                              ? value.trim() 
                              : undefined;
                            setEditData({ ...editData, attendedById: cleanedValue });
                          }}
                          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-black bg-white"
                        >
                          <option value="" className="text-black bg-white">Select employee</option>
                          {employees?.map((employee) => (
                            <option key={employee.id} value={employee.id} className="text-black bg-white">
                              {employee.name} ({employee.role})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label htmlFor="edit-quotationNumber" className="block text-sm font-medium text-gray-900">
                          Quotation Ref. Number
                        </label>
                        <input
                          id="edit-quotationNumber"
                          value={editData.quotationNumber ?? ''}
                          onChange={(e) => setEditData({ ...editData, quotationNumber: e.target.value || undefined })}
                          className="mt-1 block w-full pl-3 pr-3 py-2 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-black bg-white"
                          placeholder="e.g., Q202412345678"
                        />
                      </div>

                      <div className="space-y-2">
                        <label htmlFor="edit-quotationDate" className="block text-sm font-medium text-gray-900">
                          Quotation Date
                        </label>
                        <input
                          type="date"
                          id="edit-quotationDate"
                          value={editData.quotationDate ?? ''}
                          onChange={(e) => setEditData({ ...editData, quotationDate: e.target.value || undefined })}
                          className="mt-1 block w-full pl-3 pr-3 py-2 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-black bg-white"
                        />
                      </div>

                      <div className="space-y-2">
                        <label htmlFor="edit-status" className="block text-sm font-medium text-gray-900">
                          Status
                        </label>
                        <select
                          id="edit-status"
                          value={editData.status ?? ''}
                          onChange={(e) => {
                            const newStatus = e.target.value ? (e.target.value as 'LIVE' | 'DEAD' | 'RCD' | 'LOST') : undefined;
                            if (newStatus === 'RCD') {
                              // Open receipt modal instead of directly updating
                              setReceiptModalEnquiryId(editingEnquiry);
                              setShowReceiptModal(true);
                            } else {
                              // Update status directly for other statuses
                              setEditData({ ...editData, status: newStatus });
                            }
                          }}
                          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-black bg-white"
                        >
                          <option value="" className="text-black bg-white">Select status (optional)</option>
                          <option value="LIVE" className="text-black bg-white">LIVE</option>
                          <option value="DEAD" className="text-black bg-white">DEAD</option>
                          <option value="RCD" className="text-black bg-white">RCD (Received)</option>
                          <option value="LOST" className="text-black bg-white">LOST</option>
                        </select>
                      </div>

                      {/* Receipt Date - Only show when status is RCD */}
                      {editData.status === 'RCD' && (
                        <div className="space-y-2">
                          <label htmlFor="edit-dateOfReceipt" className="block text-sm font-medium text-gray-900">
                            Receipt Date
                          </label>
                          <input
                            type="date"
                            id="edit-dateOfReceipt"
                            value={editData.dateOfReceipt ?? ''}
                            onChange={(e) => setEditData({ ...editData, dateOfReceipt: e.target.value || undefined })}
                            className="mt-1 block w-full pl-3 pr-3 py-2 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-black bg-white"
                          />
                          <p className="text-sm text-gray-500">Date when the order was received</p>
                        </div>
                      )}

                      <div className="space-y-2">
                        <label htmlFor="edit-customerType" className="block text-sm font-medium text-gray-900">
                          New/Old Customer
                        </label>
                        <select
                          id="edit-customerType"
                          value={editData.customerType ?? ''}
                          onChange={(e) => setEditData({ ...editData, customerType: e.target.value ? (e.target.value as 'NEW' | 'OLD') : undefined })}
                          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-black bg-white"
                        >
                          <option value="" className="text-black bg-white">Select (optional)</option>
                          <option value="NEW" className="text-black bg-white">NEW</option>
                          <option value="OLD" className="text-black bg-white">OLD</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Source field - moved here from Additional Details */}
                <div className="bg-white rounded-xl border shadow-sm">
                  <div className="px-6 pt-6">
                    <h4 className="text-lg font-semibold text-gray-900 flex items-center">
                      <FileText className="w-5 h-5 mr-2 text-blue-600" />
                      Additional Information
                    </h4>
                    <p className="text-gray-900 text-sm">Optional information</p>
                  </div>
                  <div className="px-6 pb-6 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label htmlFor="edit-source" className="block text-sm font-medium text-gray-900">
                          Source
                        </label>
                        <select
                          id="edit-source"
                          value={editData.source ?? ''}
                          onChange={(e) => setEditData({ ...editData, source: e.target.value ? (e.target.value as 'Website' | 'Email' | 'Phone' | 'Referral' | 'Trade Show' | 'Social Media' | 'Visit') : undefined })}
                          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-black bg-white"
                        >
                          <option value="" className="text-black bg-white">Select source (optional)</option>
                          <option value="Website" className="text-black bg-white">Website</option>
                          <option value="Email" className="text-black bg-white">Email</option>
                          <option value="Phone" className="text-black bg-white">Phone</option>
                          <option value="Referral" className="text-black bg-white">Referral</option>
                          <option value="Trade Show" className="text-black bg-white">Trade Show</option>
                          <option value="Social Media" className="text-black bg-white">Social Media</option>
                          <option value="Visit" className="text-black bg-white">Visit</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                  <button
                    onClick={handleCancelEdit}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    disabled={updateEnquiryMutation.isPending}
                    className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 px-4 py-2"
                  >
                    {updateEnquiryMutation.isPending ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            )}

            {/* View Enquiry Modal */}
            {viewingEnquiry && (
              <div className="mt-6 bg-white rounded-lg border shadow-sm p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <FileText className="w-5 h-5 mr-2 text-blue-600" />
                    View Enquiry Details
                  </h3>
                  <button
                    onClick={handleCloseView}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                {(() => {
                  const enquiry = enquiries?.find((e) => e.id === viewingEnquiry);
                  if (!enquiry) return <div>Enquiry not found</div>;
                  
                  return (
                    <div className="space-y-6">
                      {/* Customer Information */}
                      <div className="bg-white rounded-xl border shadow-sm">
                        <div className="px-6 pt-6">
                          <h4 className="text-lg font-semibold text-gray-900 flex items-center">
                            <Building className="w-5 h-5 mr-2 text-blue-600" />
                            Customer Information
                          </h4>
                        </div>
                        <div className="px-6 pb-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Company/Customer
                              </label>
                              <p className="text-gray-900">{enquiry.company?.name ?? 'Not specified'}</p>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Location
                              </label>
                              <p className="text-gray-900">
                                {enquiry.office?.name ?? enquiry.plant?.name ?? 'Not specified'}
                              </p>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Marketing Person
                              </label>
                              <p className="text-gray-900">{enquiry.marketingPerson?.name ?? 'Not specified'}</p>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Attended By
                              </label>
                              <p className="text-gray-900">{enquiry.attendedBy?.name ?? 'Not specified'}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Enquiry Details */}
                      <div className="bg-white rounded-xl border shadow-sm">
                        <div className="px-6 pt-6">
                          <h4 className="text-lg font-semibold text-gray-900 flex items-center">
                            <FileText className="w-5 h-5 mr-2 text-blue-600" />
                            Enquiry Details
                          </h4>
                        </div>
                        <div className="px-6 pb-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Enquiry Date
                              </label>
                              <p className="text-gray-900">
                                {enquiry.enquiryDate ? new Date(enquiry.enquiryDate).toLocaleDateString() : 'Not specified'}
                              </p>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Region
                              </label>
                              <p className="text-gray-900">{enquiry.region ?? 'Not specified'}</p>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                O.A. No. (Order Acknowledge Number)
                              </label>
                              <p className="text-gray-900">{enquiry.oaNumber ?? 'Not specified'}</p>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                O.A. Date
                              </label>
                              <p className="text-gray-900">{enquiry.oaDate ? new Date(enquiry.oaDate).toLocaleDateString() : 'Not specified'}</p>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Quotation Ref. Number
                              </label>
                              <p className="text-gray-900">{enquiry.quotationNumber ?? 'Not specified'}</p>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Quotation Date
                              </label>
                              <p className="text-gray-900">
                                {enquiry.quotationDate ? new Date(enquiry.quotationDate).toLocaleDateString() : 'Not specified'}
                              </p>
                            </div>
                            {enquiry.status === 'RCD' && (
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Date of Receipt
                                </label>
                                <p className="text-gray-900">
                                  {enquiry.dateOfReceipt ? new Date(enquiry.dateOfReceipt).toLocaleDateString() : 'Not received'}
                                </p>
                              </div>
                            )}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Subject
                        </label>
                              <p className="text-gray-900">{enquiry.subject ?? 'No subject'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                Block Model
                        </label>
                              <p className="text-gray-900">{enquiry.blockModel ?? 'Not specified'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                No. of Blocks
                        </label>
                              <p className="text-gray-900">
                                {enquiry.numberOfBlocks ? Number(enquiry.numberOfBlocks).toString() : 'Not specified'}
                              </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                Design Required
                        </label>
                              <p className="text-gray-900">{enquiry.designRequired ?? 'Not specified'}</p>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Quotation Ref. Number
                              </label>
                              <p className="text-gray-900">{enquiry.quotationNumber ?? 'Not assigned'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Status
                        </label>
                        <div className="mt-1">
                          {getStatusBadge(enquiry.status)}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                New/Old Customer
                        </label>
                              <p className="text-gray-900">{enquiry.customerType ?? 'Not specified'}</p>
                      </div>
                          </div>
                        </div>
                      </div>

                      {/* Additional Information */}
                      <div className="bg-white rounded-xl border shadow-sm">
                        <div className="px-6 pt-6">
                          <h4 className="text-lg font-semibold text-gray-900 flex items-center">
                            <FileText className="w-5 h-5 mr-2 text-blue-600" />
                            Additional Information
                          </h4>
                        </div>
                        <div className="px-6 pb-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Source
                              </label>
                              <p className="text-gray-900">{enquiry.source ?? 'Not specified'}</p>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Created Date
                              </label>
                              <p className="text-gray-900">
                                {new Date(enquiry.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Last Updated
                              </label>
                              <p className="text-gray-900">
                                {new Date(enquiry.updatedAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => handleEditEnquiry(viewingEnquiry)}
                    className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 flex items-center gap-2"
                  >
                    <Edit className="h-4 w-4" />
                    Edit
                  </button>
                  <button
                    onClick={handleCloseView}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}

            {/* Receipt Date Modal */}
            {receiptModalEnquiryId && (
              <ReceiptDateModal
                isOpen={showReceiptModal}
                onClose={() => {
                  setShowReceiptModal(false);
                  setReceiptModalEnquiryId(null);
                }}
                enquiryId={receiptModalEnquiryId}
                onSuccess={() => {
                  enquiriesQuery.refetch();
                  setEditingEnquiry(null);
                  setEditData({});
                }}
              />
            )}
            {/* WON Status Modal */}
            {wonModalEnquiryId && (
              <EnquiryStatusModal
                isOpen={showWonModal}
                onClose={() => {
                  setShowWonModal(false);
                  setWonModalEnquiryId(null);
                }}
                enquiryId={wonModalEnquiryId}
                newStatus="WON"
                onSuccess={() => {
                  enquiriesQuery.refetch();
                  setEditingEnquiry(null);
                  setEditData({});
                }}
              />
            )}
            {/* Communication Drawer */}
            {selectedEnquiryId && (
              <EnquiryCommunicationDrawer
                isOpen={isCommunicationDrawerOpen}
                onClose={() => {
                  setIsCommunicationDrawerOpen(false);
                  setSelectedEnquiryId(null);
                }}
                enquiryId={selectedEnquiryId}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
