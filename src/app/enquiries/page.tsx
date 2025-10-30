'use client';

import { useState } from 'react';
import { api } from '@/trpc/client';
import { CreateEnquiryForm } from './_components/CreateEnquiryForm';
import { ReceiptDateModal } from './_components/ReceiptDateModal';

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
  Building
} from 'lucide-react';


export default function EnquiriesPage() {
  const enquiriesQuery = api.enquiry.getAll.useQuery();
  const { data: stats } = api.enquiry.getStats.useQuery();
  const { data: enquiries, isLoading, error } = enquiriesQuery;
  const { data: employees } = api.employee.getAll.useQuery();
  const updateEnquiryMutation = api.enquiry.update.useMutation({
    onSuccess: () => {
      enquiriesQuery.refetch();
      setEditingEnquiry(null);
      setEditData({});
    },
    onError: (error) => {
      // Error handling is managed by tRPC and toast notifications
      alert('Failed to update enquiry: ' + error.message);
    },
  });
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  // Define the edit data type
  type EditEnquiryData = {
    subject?: string;
    description?: string;
    requirements?: string;
    timeline?: string;
    enquiryDate?: string;
    priority?: 'Low' | 'Medium' | 'High' | 'Urgent';
    source?: 'Website' | 'Email' | 'Phone' | 'Referral' | 'Trade Show' | 'Social Media' | 'Visit';
    notes?: string;
    quotationNumber?: string;
    quotationDate?: string;
    region?: string;
    oaNumber?: string;
    blockModel?: string;
    numberOfBlocks?: number;
    designRequired?: 'Standard' | 'Custom' | 'Modified' | 'None';
    attendedById?: string;
    customerType?: 'NEW' | 'OLD';
    status?: 'LIVE' | 'DEAD' | 'RCD' | 'LOST';
    dateOfReceipt?: string;
  };

  const [editingEnquiry, setEditingEnquiry] = useState<number | null>(null);
  const [editData, setEditData] = useState<EditEnquiryData>({});
  const [viewingEnquiry, setViewingEnquiry] = useState<number | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [receiptModalEnquiryId, setReceiptModalEnquiryId] = useState<number | null>(null);

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
      setEditData({
        subject: enquiry.subject ?? undefined,
        description: enquiry.description ?? undefined,
        requirements: enquiry.requirements ?? undefined,
        timeline: enquiry.timeline ?? undefined,
        enquiryDate: enquiry.enquiryDate ? new Date(enquiry.enquiryDate).toISOString().split('T')[0] : undefined,
        priority: (enquiry.priority ?? 'Medium') as 'Low' | 'Medium' | 'High' | 'Urgent',
        source: (enquiry.source ?? 'Website') as 'Website' | 'Email' | 'Phone' | 'Referral' | 'Trade Show' | 'Social Media' | 'Visit',
              notes: enquiry.notes ?? undefined,
              quotationNumber: enquiry.quotationNumber ?? undefined,
              quotationDate: enquiry.quotationDate ? new Date(enquiry.quotationDate).toISOString().split('T')[0] : undefined,
              region: enquiry.region ?? undefined,
              oaNumber: enquiry.oaNumber ?? undefined,
              blockModel: enquiry.blockModel ?? undefined,
        numberOfBlocks: enquiry.numberOfBlocks ? Number(enquiry.numberOfBlocks) : undefined,
        designRequired: (enquiry.designRequired ?? 'Standard') as 'Standard' | 'Custom' | 'Modified' | 'None',
        attendedById: enquiry.attendedById ?? undefined,
        customerType: (enquiry.customerType ?? 'NEW') as 'NEW' | 'OLD',
        status: (enquiry.status ?? 'LIVE') as 'LIVE' | 'DEAD' | 'RCD' | 'LOST',
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
        updateEnquiryMutation.mutate({
          id: editingEnquiry,
          ...editData
        });
      } catch {
        // Error handling is managed by tRPC and toast notifications
      }
    }
  };

  const handleCancelEdit = () => {
    setEditingEnquiry(null);
    setEditData({});
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
                             <div className="text-sm text-gray-900">{enquiry.subject}</div>
                             <div className="text-xs text-gray-500 truncate max-w-xs">
                               {enquiry.description ?? 'No description'}
                             </div>
                           </td>
                          <td className="p-4 align-middle whitespace-nowrap text-sm text-gray-900">
                            {enquiry.company?.name ?? 'N/A'}
                          </td>
                          <td className="p-4 align-middle whitespace-nowrap text-sm text-gray-500">
                            {new Date(enquiry.createdAt).toLocaleDateString()}
                          </td>
                          <td className="p-4 align-middle whitespace-nowrap">
                            <select
                              value={enquiry.status}
                              onChange={(e) => {
                                const newStatus = e.target.value as 'LIVE' | 'DEAD' | 'RCD' | 'LOST';
                                if (newStatus === 'RCD') {
                                  // Open receipt modal for RCD status
                                  setReceiptModalEnquiryId(enquiry.id);
                                  setShowReceiptModal(true);
                                } else {
                                  // Update status directly for other statuses
                                  updateEnquiryMutation.mutate({
                                    id: enquiry.id,
                                    status: newStatus,
                                  });
                                }
                              }}
                              className="text-xs px-2 py-1 rounded-full border-0 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                              style={{
                                backgroundColor: enquiry.status === 'LIVE' ? '#dcfce7' : 
                                               enquiry.status === 'DEAD' ? '#fecaca' :
                                               enquiry.status === 'RCD' ? '#dbeafe' : '#f3f4f6',
                                color: enquiry.status === 'LIVE' ? '#166534' :
                                       enquiry.status === 'DEAD' ? '#991b1b' :
                                       enquiry.status === 'RCD' ? '#1e40af' : '#374151'
                              }}
                            >
                              <option value="LIVE">Live</option>
                              <option value="DEAD">Dead</option>
                              <option value="RCD">RCD (Received)</option>
                              <option value="LOST">Lost</option>
                            </select>
                          </td>
                          <td className="p-4 align-middle whitespace-nowrap text-right">
                            <div className="flex items-center justify-end space-x-2">
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
                          onChange={(e) => setEditData({ ...editData, numberOfBlocks: e.target.value ? parseFloat(e.target.value) : undefined })}
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
                          value={editData.designRequired ?? 'Standard'}
                          onChange={(e) => setEditData({ ...editData, designRequired: e.target.value as 'Standard' | 'Custom' | 'Modified' | 'None' })}
                          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-black bg-white"
                        >
                          <option value="Standard" className="text-black bg-white">Standard</option>
                          <option value="Custom" className="text-black bg-white">Custom</option>
                          <option value="Modified" className="text-black bg-white">Modified</option>
                          <option value="None" className="text-black bg-white">None</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label htmlFor="edit-attendedById" className="block text-sm font-medium text-gray-900">
                          Attended By
                        </label>
                        <select
                          id="edit-attendedById"
                          value={editData.attendedById ?? ''}
                          onChange={(e) => setEditData({ ...editData, attendedById: e.target.value || undefined })}
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
                          value={editData.status ?? 'LIVE'}
                          onChange={(e) => {
                            const newStatus = e.target.value as 'LIVE' | 'DEAD' | 'RCD' | 'LOST';
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
                          value={editData.customerType ?? 'NEW'}
                          onChange={(e) => setEditData({ ...editData, customerType: e.target.value as 'NEW' | 'OLD' })}
                          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-black bg-white"
                        >
                          <option value="NEW" className="text-black bg-white">NEW</option>
                          <option value="OLD" className="text-black bg-white">OLD</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Additional Details Section */}
                <div className="bg-white rounded-xl border shadow-sm">
                  <div className="px-6 pt-6">
                    <h4 className="text-lg font-semibold text-gray-900 flex items-center">
                      <FileText className="w-5 h-5 mr-2 text-blue-600" />
                      Additional Details
                    </h4>
                    <p className="text-gray-900 text-sm">Optional additional information</p>
                  </div>
                  <div className="px-6 pb-6 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label htmlFor="edit-priority" className="block text-sm font-medium text-gray-900">
                      Priority
                    </label>
                    <select
                          id="edit-priority"
                          value={editData.priority ?? 'Medium'}
                      onChange={(e) => setEditData({ ...editData, priority: e.target.value as 'Low' | 'Medium' | 'High' | 'Urgent' })}
                          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-black bg-white"
                        >
                          <option value="Low" className="text-black bg-white">Low</option>
                          <option value="Medium" className="text-black bg-white">Medium</option>
                          <option value="High" className="text-black bg-white">High</option>
                          <option value="Urgent" className="text-black bg-white">Urgent</option>
                    </select>
                  </div>

                      <div className="space-y-2">
                        <label htmlFor="edit-source" className="block text-sm font-medium text-gray-900">
                      Source
                    </label>
                    <select
                          id="edit-source"
                          value={editData.source ?? 'Website'}
                      onChange={(e) => setEditData({ ...editData, source: e.target.value as 'Website' | 'Email' | 'Phone' | 'Referral' | 'Trade Show' | 'Social Media' | 'Visit' })}
                          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-black bg-white"
                        >
                          <option value="Website" className="text-black bg-white">Website</option>
                          <option value="Email" className="text-black bg-white">Email</option>
                          <option value="Phone" className="text-black bg-white">Phone</option>
                          <option value="Referral" className="text-black bg-white">Referral</option>
                          <option value="Trade Show" className="text-black bg-white">Trade Show</option>
                          <option value="Social Media" className="text-black bg-white">Social Media</option>
                          <option value="Visit" className="text-black bg-white">Visit</option>
                    </select>
                  </div>

                      <div className="space-y-2">
                        <label htmlFor="edit-timeline" className="block text-sm font-medium text-gray-900">
                      Timeline
                    </label>
                    <input
                          id="edit-timeline"
                          value={editData.timeline ?? ''}
                          onChange={(e) => setEditData({ ...editData, timeline: e.target.value || undefined })}
                          className="mt-1 block w-full pl-3 pr-3 py-2 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-black bg-white"
                      placeholder="e.g., 2-3 weeks"
                    />
                  </div>

                      <div className="space-y-2">
                        <label htmlFor="edit-requirements" className="block text-sm font-medium text-gray-900">
                      Requirements
                    </label>
                    <input
                          id="edit-requirements"
                          value={editData.requirements ?? ''}
                          onChange={(e) => setEditData({ ...editData, requirements: e.target.value || undefined })}
                          className="mt-1 block w-full pl-3 pr-3 py-2 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-black bg-white"
                      placeholder="e.g., Specific requirements"
                    />
                  </div>
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="edit-description" className="block text-sm font-medium text-gray-900">
                      Description
                    </label>
                    <textarea
                        id="edit-description"
                        value={editData.description ?? ''}
                        onChange={(e) => setEditData({ ...editData, description: e.target.value || undefined })}
                        rows={4}
                        className="mt-1 block w-full pl-3 pr-3 py-2 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-black bg-white placeholder-gray-500"
                        placeholder="Provide a detailed description of the enquiry..."
                    />
                  </div>

                    <div className="space-y-2">
                      <label htmlFor="edit-notes" className="block text-sm font-medium text-gray-900">
                      Notes
                    </label>
                    <textarea
                        id="edit-notes"
                        value={editData.notes ?? ''}
                        onChange={(e) => setEditData({ ...editData, notes: e.target.value || undefined })}
                        rows={3}
                        className="mt-1 block w-full pl-3 pr-3 py-2 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-black bg-white placeholder-gray-500"
                        placeholder="Additional notes..."
                    />
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

                      {/* Additional Details */}
                      <div className="bg-white rounded-xl border shadow-sm">
                        <div className="px-6 pt-6">
                          <h4 className="text-lg font-semibold text-gray-900 flex items-center">
                            <FileText className="w-5 h-5 mr-2 text-blue-600" />
                            Additional Details
                          </h4>
                        </div>
                        <div className="px-6 pb-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                Priority
                        </label>
                              <p className="text-gray-900">{enquiry.priority ?? 'Not specified'}</p>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Source
                              </label>
                              <p className="text-gray-900">{enquiry.source ?? 'Not specified'}</p>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Timeline
                              </label>
                              <p className="text-gray-900">{enquiry.timeline ?? 'Not specified'}</p>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Requirements
                              </label>
                              <p className="text-gray-900">{enquiry.requirements ?? 'Not specified'}</p>
                            </div>
                            <div className="md:col-span-2">
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Description
                              </label>
                              <p className="text-gray-900">{enquiry.description ?? 'No description provided'}</p>
                            </div>
                            <div className="md:col-span-2">
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Notes
                              </label>
                              <p className="text-gray-900">{enquiry.notes ?? 'No notes provided'}</p>
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
          </div>
        </div>
      </div>
    </div>
  );
}
