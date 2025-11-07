'use client';

import { useState } from 'react';
import { api } from '@/trpc/client';
import { 
  Phone, 
  Mail, 
  Video, 
  Building, 
  MapPin, 
  Search, 
  Calendar,
  User,
  Edit,
  Trash2,
  Plus,
  Eye
} from 'lucide-react';
import type { Communication } from '@/types/communication';

interface CommunicationListProps {
  onEdit?: (_communication: Communication) => void;
  onView?: (_communication: Communication) => void;
  onCreateNew?: () => void;
}

export function CommunicationList({ 
  onEdit, 
  onView, 
  onCreateNew 
}: CommunicationListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterCustomer, setFilterCustomer] = useState<string>('all');
  const [filterQuotation, setFilterQuotation] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const { data: communications, isLoading, refetch } = api.communication.getAll.useQuery({});
  const { data: customers } = api.company.getAll.useQuery();

  const deleteCommunication = api.communication.delete.useMutation({
    onSuccess: () => {
      refetch();
    },
    onError: (error) => {
      alert(`Failed to delete communication: ${error.message}`);
    },
  });

  const getCommunicationTypeIcon = (type: string) => {
    switch (type) {
      case 'TELEPHONIC': return <Phone className="h-4 w-4 text-blue-600" />;
      case 'VIRTUAL_MEETING': return <Video className="h-4 w-4 text-green-600" />;
      case 'EMAIL': return <Mail className="h-4 w-4 text-purple-600" />;
      case 'PLANT_VISIT': return <Building className="h-4 w-4 text-orange-600" />;
      case 'OFFICE_VISIT': return <MapPin className="h-4 w-4 text-red-600" />;
      default: return <Phone className="h-4 w-4 text-gray-600" />;
    }
  };

  const getCommunicationTypeLabel = (type: string) => {
    switch (type) {
      case 'TELEPHONIC': return 'Telephonic Discussion';
      case 'VIRTUAL_MEETING': return 'Virtual Meeting';
      case 'EMAIL': return 'Email';
      case 'PLANT_VISIT': return 'Plant Visit';
      case 'OFFICE_VISIT': return 'Office Visit';
      default: return type;
    }
  };

  const getCommunicationTypeBadge = (type: string) => {
    const baseClasses = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium";
    switch (type) {
      case 'TELEPHONIC': 
        return `${baseClasses} bg-blue-100 text-blue-800`;
      case 'VIRTUAL_MEETING': 
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'EMAIL': 
        return `${baseClasses} bg-purple-100 text-purple-800`;
      case 'PLANT_VISIT': 
        return `${baseClasses} bg-orange-100 text-orange-800`;
      case 'OFFICE_VISIT': 
        return `${baseClasses} bg-red-100 text-red-800`;
      default: 
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  // Filter communications based on search and filters
  /* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/prefer-nullish-coalescing */
  const filteredCommunications = communications?.filter((comm: any) => {
    const matchesSearch = 
      (comm.subject ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (comm.company?.name ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (comm.contactPerson?.name ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (comm.enquiry?.office?.contactPersons?.[0]?.name ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (comm.enquiry?.plant?.contactPersons?.[0]?.name ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (comm.description ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (comm.enquiry?.quotationNumber ?? '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = filterType === 'all' || comm.type === filterType;
    const matchesCustomer = filterCustomer === 'all' || comm.companyId === filterCustomer;
    const matchesQuotation = filterQuotation === 'all' || 
      (filterQuotation === 'with' && (comm.enquiry?.quotationNumber ?? false)) ||
      (filterQuotation === 'without' && !comm.enquiry?.quotationNumber);
    
    // Filter by quotation status (WON/LIVE)
    let matchesStatus = true;
    if (filterStatus !== 'all') {
      // When filtering by status, must have enquiry with quotationStatus
      if (!comm.enquiry?.quotationStatus) {
        return false;
      }
      // Status must match exactly
      matchesStatus = comm.enquiry.quotationStatus === filterStatus;
    }

    return matchesSearch && matchesType && matchesCustomer && matchesQuotation && matchesStatus;
  }) ?? [];
  
  // Calculate total value from filtered communications
  const totalValue = filteredCommunications.reduce((sum: number, comm: any) => {
    const value = comm.enquiry?.quotationTotalValue ?? 0;
    return sum + (typeof value === 'number' ? value : 0);
  }, 0);
  /* eslint-enable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleDelete = (communication: Communication) => {
    if (confirm('Are you sure you want to delete this communication?')) {
      deleteCommunication.mutate({ id: communication.id });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Card - Total Value */}
      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-indigo-500 rounded-md flex items-center justify-center">
                <div className="text-white font-bold text-sm">💰</div>
              </div>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  {filterStatus === 'WON' ? 'Total Won Value' : filterStatus === 'LIVE' ? 'Total Live Value' : 'Total Value'}
                </dt>
                <dd className="text-2xl font-bold text-gray-900">{formatCurrency(totalValue)}</dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border shadow-sm">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Communications</h2>
          {onCreateNew && (
            <button
              onClick={onCreateNew}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <Plus className="h-4 w-4" />
              New Communication
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search communications..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full rounded-md border border-gray-300 p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Type Filter */}
          <div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full rounded-md border border-gray-300 p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Types</option>
              <option value="TELEPHONIC">Telephonic</option>
              <option value="VIRTUAL_MEETING">Virtual Meeting</option>
              <option value="EMAIL">Email</option>
              <option value="PLANT_VISIT">Plant Visit</option>
              <option value="OFFICE_VISIT">Office Visit</option>
            </select>
          </div>

          {/* Customer Filter */}
          <div>
            <select
              value={filterCustomer}
              onChange={(e) => setFilterCustomer(e.target.value)}
              className="w-full rounded-md border border-gray-300 p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Customers</option>
              {customers?.map((customer: { id: string; name: string }) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name}
                </option>
              ))}
            </select>
          </div>

          {/* Quotation Filter */}
          <div>
            <select
              value={filterQuotation}
              onChange={(e) => setFilterQuotation(e.target.value)}
              className="w-full rounded-md border border-gray-300 p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Communications</option>
              <option value="with">With Quotation #</option>
              <option value="without">Without Quotation #</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full rounded-md border border-gray-300 p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Status</option>
              <option value="WON">Won</option>
              <option value="LIVE">Live</option>
            </select>
          </div>

          {/* Results Count and Total Value */}
          <div className="flex flex-col items-end gap-1">
            <span className="text-sm font-medium text-gray-700">
              {(() => {
                if (filterStatus === 'WON') return 'Won';
                if (filterStatus === 'LIVE') return 'Live';
                return 'Total';
              })()}: {filteredCommunications.length} communication{filteredCommunications.length !== 1 ? 's' : ''}
            </span>
            {filterStatus !== 'all' && (
              <span className="text-sm font-semibold text-green-600">
                Value: {formatCurrency(totalValue)}
              </span>
            )}
            {filterStatus === 'all' && totalValue > 0 && (
              <span className="text-sm font-semibold text-green-600">
                Value: {formatCurrency(totalValue)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Communications List */}
      <div className="divide-y divide-gray-200">
        {filteredCommunications.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <div className="text-gray-500">
              {searchTerm || filterType !== 'all' || filterCustomer !== 'all' 
                ? 'No communications match your filters.' 
                : 'No communications found.'}
            </div>
          </div>
        ) : (
          /* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
          filteredCommunications.map((communication: any) => (
            <div key={communication.id} className="px-6 py-4 hover:bg-gray-50">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                                         {getCommunicationTypeIcon(communication.type)}
                     <span className={getCommunicationTypeBadge(communication.type)}>
                       {getCommunicationTypeLabel(communication.type)}
                    </span>
                    <span className="text-sm text-gray-500">
                      {new Date(communication.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <h3 className="text-lg font-medium text-gray-900 mb-1">
                    {communication.subject}
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-3">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Building className="h-4 w-4" />
                      <span>{communication.company?.name}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <User className="h-4 w-4" />
                      <span>
                        {communication.enquiry?.office?.contactPersons?.[0]?.name || 
                         communication.enquiry?.plant?.contactPersons?.[0]?.name || 
                         communication.contactPerson?.name || 
                         'No contact person'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {communication.nextCommunicationDate 
                          ? new Date(communication.nextCommunicationDate).toLocaleDateString()
                          : 'No follow-up scheduled'
                        }
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      {communication.enquiry?.quotationNumber ? (
                        <>
                          <span className="font-medium text-blue-600">Q#</span>
                          <span className="font-mono text-blue-600 bg-blue-50 px-2 py-1 rounded">
                            {communication.enquiry.quotationNumber}
                          </span>
                        </>
                      ) : communication.enquiry ? (
                        <span className="text-gray-400 italic">No Quotation #</span>
                      ) : (
                        <span className="text-gray-400 italic">No Enquiry Link</span>
                      )}
                    </div>
                  </div>

                  {/* Enquiry Subject Display */}
                  {communication.enquiry?.subject && (
                    <div className="mt-2">
                      <span className="text-xs font-medium text-gray-500">Enquiry Subject: </span>
                      <span className="text-xs text-gray-700">{communication.enquiry.subject}</span>
                    </div>
                  )}

                                     <p className="text-sm text-gray-600 line-clamp-2">
                     {communication.description}
                   </p>

                  {communication.proposedNextAction && (
                    <div className="mt-2">
                      <span className="text-xs font-medium text-gray-500">Next Action: </span>
                      <span className="text-xs text-gray-700">{communication.proposedNextAction}</span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 ml-4">
                  {onView && (
                    <button
                      onClick={() => onView(communication)}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md"
                      title="View details"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  )}
                  {onEdit && (
                    <button
                      onClick={() => onEdit(communication)}
                      className="p-4 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-md"
                      title="Edit communication"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(communication)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md"
                    title="Delete communication"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
          /* eslint-enable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
        )}
      </div>
      </div>
    </div>
  );
}

