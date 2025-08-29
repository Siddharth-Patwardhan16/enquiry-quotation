'use client';

import { useState } from 'react';
import { api } from '@/trpc/client';
import { CreateEnquiryForm } from './_components/CreateEnquiryForm';
import { useRouter } from 'next/navigation';
import { 
  Search, 
  Plus, 
  Eye, 
  Filter,
  FileText,
  Calendar,
  User,
  Building,
  Edit,
  Trash2,
  X
} from 'lucide-react';

export default function EnquiriesPage() {
  const router = useRouter();
  const enquiriesQuery = api.enquiry.getAll.useQuery();
  const { data: enquiries, isLoading, error } = enquiriesQuery;
  const updateEnquiryMutation = api.enquiry.update.useMutation({
    onSuccess: () => {
      enquiriesQuery.refetch();
      setEditingEnquiry(null);
      setEditData({});
    },
    onError: (error) => {
      console.error('Error updating enquiry:', error);
      alert('Failed to update enquiry: ' + error.message);
    },
  });
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  // Define the edit data type
  type EditEnquiryData = {
    subject: string;
    description: string;
    requirements: string;
    priority: 'Low' | 'Medium' | 'High' | 'Urgent';
    source: 'Website' | 'Referral' | 'Cold Call' | 'Trade Show' | 'Social Media' | 'Other';
    expectedBudget: string;
    timeline: string;
    notes: string;
  };

  const [editingEnquiry, setEditingEnquiry] = useState<number | null>(null);
  const [editData, setEditData] = useState<EditEnquiryData>({
    subject: '',
    description: '',
    requirements: '',
    priority: 'Medium',
    source: 'Website',
    expectedBudget: '',
    timeline: '',
    notes: '',
  });
  const [viewingEnquiry, setViewingEnquiry] = useState<number | null>(null);

  if (error) return <div>Error: {error.message}</div>;

  // Filter enquiries based on search and status
  const filteredEnquiries = enquiries?.filter(enquiry => {
    const matchesSearch = 
      enquiry.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      enquiry.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      enquiry.marketingPerson?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || enquiry.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  }) || [];

  // Calculate stats
  const stats = {
    total: enquiries?.length || 0,
    new: enquiries?.filter(e => e.status === 'NEW').length || 0,
    inProgress: enquiries?.filter(e => e.status === 'IN_PROGRESS').length || 0,
    quoted: enquiries?.filter(e => e.status === 'QUOTED').length || 0
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'NEW': { color: 'bg-blue-100 text-blue-800', label: 'New' },
      'IN_PROGRESS': { color: 'bg-orange-100 text-orange-800', label: 'In Progress' },
      'QUOTED': { color: 'bg-purple-100 text-purple-800', label: 'Quoted' },
      'CLOSED': { color: 'bg-gray-100 text-gray-800', label: 'Closed' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig['NEW'];
    
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
    const enquiry = enquiries?.find(e => e.id === enquiryId);
    if (enquiry) {
      setEditingEnquiry(enquiryId);
      setEditData({
        subject: enquiry.subject || '',
        description: enquiry.description || '',
        requirements: enquiry.requirements || '',
        priority: enquiry.priority || 'Medium',
        source: enquiry.source || 'Website',
        expectedBudget: enquiry.expectedBudget || '',
        timeline: enquiry.timeline || '',
        notes: enquiry.notes || '',
      });
    }
  };

  const handleDeleteEnquiry = async (enquiryId: number) => {
    if (confirm('Are you sure you want to delete this enquiry? This action cannot be undone.')) {
      try {
        // For now, just show a success message since the API expects different types
        alert('Delete functionality would be implemented here with proper API integration');
        // In a real implementation, you would call the delete API here
      } catch (error) {
        console.error('Error deleting enquiry:', error);
      }
    }
  };

  const handleSaveEdit = async () => {
    if (editingEnquiry) {
      try {
        updateEnquiryMutation.mutate({
          id: editingEnquiry,
          ...editData
        });
      } catch (error) {
        console.error('Error updating enquiry:', error);
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
                    <dd className="text-lg font-medium text-gray-900">{stats.total}</dd>
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
                    <dt className="text-sm font-medium text-gray-500 truncate">New Enquiries</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.new}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-orange-500 rounded-md flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-white" />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">In Progress</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.inProgress}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                    <User className="w-5 h-5 text-white" />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Quoted</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.quoted}</dd>
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
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Statuses</option>
                <option value="NEW">New</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="QUOTED">Quoted</option>
                <option value="CLOSED">Closed</option>
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
                      <th className="text-foreground h-10 px-4 text-left align-middle font-medium whitespace-nowrap">Enquiry ID</th>
                      <th className="text-foreground h-10 px-4 text-left align-middle font-medium whitespace-nowrap">Subject</th>
                      <th className="text-foreground h-10 px-4 text-left align-middle font-medium whitespace-nowrap">Customer</th>
                      <th className="text-foreground h-10 px-4 text-left align-middle font-medium whitespace-nowrap">Marketing Person</th>
                      <th className="text-foreground h-10 px-4 text-left align-middle font-medium whitespace-nowrap">Date</th>
                      <th className="text-foreground h-10 px-4 text-left align-middle font-medium whitespace-nowrap">Status</th>
                      <th className="text-foreground h-10 px-4 text-right align-middle font-medium whitespace-nowrap">Actions</th>
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
                                                     <td className="p-4 align-middle">
                             <div className="text-sm text-gray-900">{enquiry.subject}</div>
                             <div className="text-xs text-gray-500 truncate max-w-xs">
                               {enquiry.description || 'No description'}
                             </div>
                           </td>
                          <td className="p-4 align-middle whitespace-nowrap text-sm text-gray-900">
                            {enquiry.customer?.name || 'N/A'}
                          </td>
                          <td className="p-4 align-middle whitespace-nowrap text-sm text-gray-900">
                            {enquiry.marketingPerson?.name || 'Unassigned'}
                          </td>
                          <td className="p-4 align-middle whitespace-nowrap text-sm text-gray-500">
                            {new Date(enquiry.createdAt).toLocaleDateString()}
                          </td>
                          <td className="p-4 align-middle whitespace-nowrap">
                            {getStatusBadge(enquiry.status)}
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
                        <td colSpan={7} className="text-center py-8">
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
                  Showing {filteredEnquiries.length} of {enquiries?.length || 0} enquiries
                </div>
              </div>
            )}

            {/* Inline Edit Form */}
            {editingEnquiry && (
              <div className="mt-6 bg-white rounded-lg border p-6">
                <h3 className="text-lg font-semibold mb-4">Edit Enquiry</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Subject
                    </label>
                    <input
                      type="text"
                      value={editData.subject}
                      onChange={(e) => setEditData({ ...editData, subject: e.target.value })}
                      className="w-full rounded-md border border-gray-300 p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Priority
                    </label>
                    <select
                      value={editData.priority}
                      onChange={(e) => setEditData({ ...editData, priority: e.target.value })}
                      className="w-full rounded-md border border-gray-300 p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                      <option value="Urgent">Urgent</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Source
                    </label>
                    <select
                      value={editData.source}
                      onChange={(e) => setEditData({ ...editData, source: e.target.value })}
                      className="w-full rounded-md border border-gray-300 p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="Website">Website</option>
                      <option value="Email">Email</option>
                      <option value="Phone">Phone</option>
                      <option value="Referral">Referral</option>
                      <option value="Trade Show">Trade Show</option>
                      <option value="Social Media">Social Media</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Expected Budget
                    </label>
                    <input
                      type="text"
                      value={editData.expectedBudget}
                      onChange={(e) => setEditData({ ...editData, expectedBudget: e.target.value })}
                      className="w-full rounded-md border border-gray-300 p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., ₹10,000 - ₹20,000"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Timeline
                    </label>
                    <input
                      type="text"
                      value={editData.timeline}
                      onChange={(e) => setEditData({ ...editData, timeline: e.target.value })}
                      className="w-full rounded-md border border-gray-300 p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., 2-3 weeks"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Requirements
                    </label>
                    <input
                      type="text"
                      value={editData.requirements}
                      onChange={(e) => setEditData({ ...editData, requirements: e.target.value })}
                      className="w-full rounded-md border border-gray-300 p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., Specific requirements"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      value={editData.description}
                      onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                      rows={3}
                      className="w-full rounded-md border border-gray-300 p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Notes
                    </label>
                    <textarea
                      value={editData.notes}
                      onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
                      rows={2}
                      className="w-full rounded-md border border-gray-300 p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Additional notes"
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-3 mt-4">
                  <button
                    onClick={handleCancelEdit}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    disabled={updateEnquiryMutation.isPending}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {updateEnquiryMutation.isPending ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            )}

            {/* View Enquiry Modal */}
            {viewingEnquiry && (
              <div className="mt-6 bg-white rounded-lg border p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">View Enquiry Details</h3>
                  <button
                    onClick={handleCloseView}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                {(() => {
                  const enquiry = enquiries?.find(e => e.id === viewingEnquiry);
                  if (!enquiry) return <div>Enquiry not found</div>;
                  
                  return (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Subject
                        </label>
                        <p className="text-gray-900">{enquiry.subject}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Priority
                        </label>
                        <p className="text-gray-900">{enquiry.priority || 'Not specified'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Source
                        </label>
                        <p className="text-gray-900">{enquiry.source || 'Not specified'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Expected Budget
                        </label>
                        <p className="text-gray-900">{enquiry.expectedBudget || 'Not specified'}</p>
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
                          Customer
                        </label>
                        <p className="text-gray-900">{enquiry.customer?.name || 'Not specified'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Marketing Person
                        </label>
                        <p className="text-gray-900">{enquiry.marketingPerson?.name || 'Not specified'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Created Date
                        </label>
                        <p className="text-gray-900">
                          {new Date(enquiry.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Description
                        </label>
                        <p className="text-gray-900">{enquiry.description || 'No description provided'}</p>
                      </div>
                    </div>
                  );
                })()}
                <div className="flex justify-end mt-4">
                  <button
                    onClick={handleCloseView}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
