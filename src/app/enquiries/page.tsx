'use client';

import { useEffect, useState, useMemo } from 'react';
import { useDebounce } from '@/app/customer-details/_hooks/useDebounce';
import { buildFinancialYearOptions, getFinancialYear } from '@/lib/financial-year';
import { normalizeOptionalUuidValue, UpdateEnquiryFullSchema } from '@/lib/validators/enquiry';
import { api } from '@/trpc/client';
import { useToastContext } from '@/components/providers/ToastProvider';
import { CreateEnquiryForm } from './_components/CreateEnquiryForm';
import { ReceiptDateModal } from './_components/ReceiptDateModal';
import { EnquiryStatusModal } from './_components/EnquiryStatusModal';
import { EnquiryCommunicationDrawer } from './_components/EnquiryCommunicationDrawer';
import CustomerSelector, { type Customer } from '@/components/ui/CustomerSelector';
import { z } from 'zod';

import { 
  Search, 
  Plus, 
  Eye, 
  FileText,
  Edit,
  Trash2,
  X,
  Building,
  MessageSquare,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

function formatDateSafe(date: Date | string | null | undefined, options?: Intl.DateTimeFormatOptions): string {
  if (!date) return '-';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '-';
  return d.toLocaleDateString(undefined, options);
}

function toISODateSafe(date: Date | string | null | undefined): string | undefined {
  if (!date) return undefined;
  const d = new Date(date);
  if (isNaN(d.getTime())) return undefined;
  return d.toISOString().split('T')[0];
}

function getEnquiryMutationErrorMessage(errorMessage: string): string {
  try {
    const parsedErrors = JSON.parse(errorMessage) as Array<{
      message?: string;
      path?: string | string[];
    }>;

    if (!Array.isArray(parsedErrors) || parsedErrors.length === 0) {
      return errorMessage;
    }

    const firstError = parsedErrors[0];
    if (firstError?.message) {
      return firstError.message;
    }

    if (firstError?.path) {
      const fieldPath = Array.isArray(firstError.path)
        ? firstError.path.join('.')
        : firstError.path;

      if (fieldPath === 'attendedById') {
        return 'Please select a valid employee for Attended By or leave it empty.';
      }
    }
  } catch {
    if (errorMessage.includes('attendedById') || errorMessage.includes('Attended By')) {
      return 'Please select a valid employee for Attended By or leave it empty.';
    }
  }

  return errorMessage;
}

type UpdateEnquiryMutationInput = z.input<typeof UpdateEnquiryFullSchema>;
type EnquiryRow = {
  id: number;
  financialYear: string;
  sequenceNumber: number;
  quotationNumber: string | null;
  subject: string | null;
  status: 'LIVE' | 'DEAD' | 'RCD' | 'LOST' | 'WON' | 'BUDGETARY';
  enquiryDate: Date | null;
  quotationDate: Date | null;
  oaDate: Date | null;
  dateOfReceipt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  companyId: string | null;
  customerId: string | null;
  officeId: string | null;
  plantId: string | null;
  locationId: string | null;
  region: string | null;
  oaNumber: string | null;
  blockModel: string | null;
  numberOfBlocks: string | null;
  designRequired: string | null;
  attendedById: string | null;
  customerType: string | null;
  source: string | null;
  purchaseOrderNumber: string | null;
  poValue: number | null;
  poDate: Date | null;
  company: { name: string } | null;
  office: { name: string } | null;
  plant: { name: string } | null;
  marketingPerson: { name: string } | null;
  attendedBy: { name: string } | null;
};

export default function EnquiriesPage() {
  const { success, error: showError } = useToastContext();
  const utils = api.useUtils();
  const [financialYear, setFinancialYear] = useState(() => getFinancialYear(new Date()));
  const financialYearOptions = buildFinancialYearOptions(6, 1);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 350);
  const [statusFilter, setStatusFilter] = useState<'LIVE' | 'DEAD' | 'RCD' | 'LOST' | 'WON' | 'BUDGETARY' | null>(null);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, statusFilter, financialYear]);

  const enquiriesQuery = api.enquiry.getPaginated.useQuery({
    financialYear,
    page: currentPage,
    pageSize,
    search: debouncedSearch.trim() || undefined,
    status: statusFilter ?? undefined,
  });
  const { data: stats } = api.enquiry.getStats.useQuery({ financialYear });
  const { data: employees } = api.employee.getAll.useQuery();
  const { data: companies, isLoading: isLoadingCompanies } = api.company.getAll.useQuery();
  const updateEnquiryMutation = api.enquiry.update.useMutation({
    onSuccess: () => {
      void utils.enquiry.getPaginated.invalidate();
      void utils.enquiry.getAll.invalidate();
      void utils.enquiry.getStats.invalidate();
      success('Enquiry Updated', 'The enquiry has been successfully updated.');
      setEditingEnquiry(null);
      setEditData({});
      setOriginalAttendedById(undefined);
      setSelectedCustomer(null);
    },
    onError: (error) => {
      showError(
        'Update Failed',
        getEnquiryMutationErrorMessage(
          error.message || 'Failed to update enquiry. Please check the form and try again.',
        ),
      );
    },
  });

  const updateStatusMutation = api.enquiry.updateStatus.useMutation({
    onSuccess: () => {
      success('Status Updated', 'The enquiry status has been successfully updated.');
      void utils.enquiry.getPaginated.invalidate();
      void utils.enquiry.getAll.invalidate();
      void utils.enquiry.getStats.invalidate();
      void enquiriesQuery.refetch();
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
  const deleteEnquiryMutation = api.enquiry.delete.useMutation({
    onSuccess: (_, variables) => {
      void utils.enquiry.getPaginated.invalidate();
      void utils.enquiry.getAll.invalidate();
      void utils.enquiry.getStats.invalidate();
      setDeletingEnquiryId(null);

      if (editingEnquiry === variables.id) {
        setEditingEnquiry(null);
        setEditData({});
        setOriginalAttendedById(undefined);
      }

      if (viewingEnquiry === variables.id) {
        setViewingEnquiry(null);
      }

      if (selectedEnquiryId === variables.id) {
        setSelectedEnquiryId(null);
        setIsCommunicationDrawerOpen(false);
      }

      success('Enquiry Deleted', 'The enquiry has been permanently removed.');
    },
    onError: (error) => {
      setDeletingEnquiryId(null);
      showError('Delete Failed', error.message || 'Failed to delete enquiry.');
    },
  });
  const [showCreateForm, setShowCreateForm] = useState(false);
  // Define the edit data type
  type EditEnquiryData = {
    customerId?: string;
    locationId?: string;
    entityType?: 'customer' | 'company';
    subject?: string;
    enquiryDate?: string;
    source?: 'Website' | 'Email' | 'Phone' | 'Referral' | 'Trade Show' | 'Social Media' | 'Visit';
    quotationNumber?: string;
    quotationDate?: string;
    region?: string;
    oaNumber?: string;
    oaDate?: string;
    blockModel?: string;
    numberOfBlocks?: string;
    designRequired?: 'Yes' | 'No';
    attendedById?: string;
    customerType?: 'NEW' | 'OLD';
    status?: 'LIVE' | 'DEAD' | 'RCD' | 'LOST';
    dateOfReceipt?: string;
  };

  const [editingEnquiry, setEditingEnquiry] = useState<number | null>(null);
  const [editData, setEditData] = useState<EditEnquiryData>({});
  const [deletingEnquiryId, setDeletingEnquiryId] = useState<number | null>(null);
  const [originalAttendedById, setOriginalAttendedById] = useState<string | null | undefined>(undefined);
  const [viewingEnquiry, setViewingEnquiry] = useState<number | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [receiptModalEnquiryId, setReceiptModalEnquiryId] = useState<number | null>(null);
  const [showWonModal, setShowWonModal] = useState(false);
  const [wonModalEnquiryId, setWonModalEnquiryId] = useState<number | null>(null);
  const [selectedEnquiryId, setSelectedEnquiryId] = useState<number | null>(null);
  const [isCommunicationDrawerOpen, setIsCommunicationDrawerOpen] = useState(false);

  useEffect(() => {
    setSearchTerm('');
    setStatusFilter(null);
    setViewingEnquiry(null);
    setEditingEnquiry(null);
    setSelectedEnquiryId(null);
    setIsCommunicationDrawerOpen(false);
  }, [financialYear]);

  const paginatedData = enquiriesQuery.data;
  const allEnquiries = ((paginatedData?.items ?? []) as unknown) as EnquiryRow[];
  const totalEnquiries = paginatedData?.total ?? 0;
  const totalPages = paginatedData?.totalPages ?? 1;
  const isLoading = enquiriesQuery.isLoading;

  const filteredEnquiries = allEnquiries;

  // Use backend stats if available, otherwise show loading
  const displayStats = stats ? {
    total: stats.total,
    live: stats.live,
    dead: stats.dead,
    rcd: stats.rcd,
    lost: stats.lost,
    won: stats.won,
    budgetary: stats.budgetary
  } : {
    total: 0,
    live: 0,
    dead: 0,
    rcd: 0,
    lost: 0,
    won: 0,
    budgetary: 0
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

  // Combine companies into a unified list with deduplication
  const allEntities: Customer[] = useMemo(() => {
    const entities: Customer[] = [];
    const seenNames = new Set<string>();
    
    (companies ?? []).forEach((company) => {
      const rawName = company?.name ?? '';
      const normalizedName = rawName.trim().toLowerCase();
      if (normalizedName && !seenNames.has(normalizedName)) {
        seenNames.add(normalizedName);
        entities.push({
          id: company.id,
          name: company.name,
          type: 'Company',
          industry: company.industry ?? undefined,
          website: company.website ?? undefined,
          location: company.offices?.[0] ? `${company.offices[0].city ?? ''}, ${company.offices[0].state ?? ''}` : undefined
        });
      }
    });
    
    return entities.sort((a, b) => (a.name ?? '').localeCompare(b.name ?? ''));
  }, [companies]);
  
  const isLoadingEntities = isLoadingCompanies;

  // Determine if selected customer is a company
  const isCompany = selectedCustomer?.type === 'Company';
  const selectedCustomerId = selectedCustomer?.id ?? editData.customerId;

  // Fetch locations for the selected customer (legacy)
  const { data: customerLocations, isLoading: isLoadingCustomerLocations } = api.location.getByCustomerId.useQuery(
    { customerId: selectedCustomerId as string },
    { enabled: !!selectedCustomerId && !isCompany && typeof selectedCustomerId === 'string' } // Only run for customers
  );
  
  // Helper function to format location string
  const formatLocationString = (location: {
    city?: string | null;
    state?: string | null;
    address?: string | null;
    area?: string | null;
    country?: string | null;
  }): string => {
    const locationParts: string[] = [];
    if (location.area) locationParts.push(location.area);
    if (location.city) locationParts.push(location.city);
    if (location.state) locationParts.push(location.state);
    if (location.country) locationParts.push(location.country);
    
    return locationParts.length > 0 
      ? locationParts.join(', ') 
      : (location.address ?? '');
  };

  // For companies, use offices and plants as locations
  const companyLocations = isCompany && selectedCustomer && selectedCustomerId ? [
    ...(companies?.find(c => c.id === selectedCustomerId)?.offices?.map(office => ({
      id: office.id,
      name: office.name,
      type: 'OFFICE',
      city: office.city,
      state: office.state,
      address: office.address,
      area: office.area,
      country: office.country,
      locationString: formatLocationString(office)
    })) ?? []),
    ...(companies?.find(c => c.id === selectedCustomerId)?.plants?.map(plant => ({
      id: plant.id,
      name: plant.name,
      type: 'PLANT',
      city: plant.city,
      state: plant.state,
      address: plant.address,
      area: plant.area,
      country: plant.country,
      locationString: formatLocationString(plant)
    })) ?? [])
  ] : [];
  
  // Format customer locations with location string
  const formattedCustomerLocations = customerLocations?.map(location => ({
    ...location,
    locationString: formatLocationString(location)
  })) ?? [];
  
  const locations = isCompany ? companyLocations : formattedCustomerLocations;
  const isLoadingLocations = isCompany ? false : isLoadingCustomerLocations;

  const handleViewEnquiry = (enquiryId: number) => {
    setViewingEnquiry(enquiryId);
  };

  const handleEditEnquiry = (enquiryId: number) => {
    const enquiry = allEnquiries.find((e) => e.id === enquiryId);
    if (enquiry) {
      // Close view modal if open
      if (viewingEnquiry === enquiryId) {
        setViewingEnquiry(null);
      }
      // Open edit form
      setEditingEnquiry(enquiryId);
      // Store original attendedById to detect if we're clearing it
      setOriginalAttendedById(enquiry.attendedById ?? null);
      
      // Set selected customer
      const customerId = enquiry.companyId ?? enquiry.customerId;
      if (customerId) {
        const entity = allEntities.find(e => e.id === customerId);
        setSelectedCustomer(entity ?? null);
      } else {
        setSelectedCustomer(null);
      }
      
      setEditData({
        customerId: enquiry.companyId ?? enquiry.customerId ?? undefined,
        locationId: enquiry.officeId ?? enquiry.plantId ?? enquiry.locationId ?? undefined,
        entityType: enquiry.companyId ? 'company' : (enquiry.customerId ? 'customer' : undefined),
        subject: enquiry.subject ?? undefined,
        enquiryDate: toISODateSafe(enquiry.enquiryDate),
        source: enquiry.source ? (enquiry.source as 'Website' | 'Email' | 'Phone' | 'Referral' | 'Trade Show' | 'Social Media' | 'Visit') : undefined,
        quotationNumber: enquiry.quotationNumber ?? undefined,
        quotationDate: toISODateSafe(enquiry.quotationDate),
        region: enquiry.region ?? undefined,
        oaNumber: enquiry.oaNumber ?? undefined,
        oaDate: toISODateSafe(enquiry.oaDate),
        blockModel: enquiry.blockModel ?? undefined,
        numberOfBlocks: enquiry.numberOfBlocks ? String(enquiry.numberOfBlocks) : undefined,
        designRequired: enquiry.designRequired ? (enquiry.designRequired as 'Yes' | 'No') : undefined,
        attendedById: enquiry.attendedById ?? undefined,
        customerType: enquiry.customerType ? (enquiry.customerType as 'NEW' | 'OLD') : undefined,
        status: enquiry.status ? (enquiry.status as 'LIVE' | 'DEAD' | 'RCD' | 'LOST') : undefined,
        dateOfReceipt: toISODateSafe(enquiry.dateOfReceipt),
      });
    }
  };

  const handleDeleteEnquiry = (enquiryId: number) => {
    if (confirm('Are you sure you want to delete this enquiry? This action cannot be undone.')) {
      setDeletingEnquiryId(enquiryId);
      deleteEnquiryMutation.mutate({ id: enquiryId });
    }
  };

  const handleSaveEdit = () => {
    if (!editingEnquiry) {
      return;
    }

    const nextAttendedById = normalizeOptionalUuidValue(editData.attendedById);
    const updatePayload: UpdateEnquiryMutationInput = {
      id: editingEnquiry,
      customerId: editData.customerId,
      locationId: editData.locationId,
      entityType: editData.entityType,
      subject: editData.subject,
      description: undefined,
      requirements: undefined,
      timeline: undefined,
      enquiryDate: editData.enquiryDate,
      priority: undefined,
      source: editData.source,
      notes: undefined,
      quotationNumber: editData.quotationNumber,
      quotationDate: editData.quotationDate,
      region: editData.region,
      oaNumber: editData.oaNumber,
      oaDate: editData.oaDate,
      dateOfReceipt: editData.dateOfReceipt,
      blockModel: editData.blockModel,
      numberOfBlocks: editData.numberOfBlocks,
      designRequired: editData.designRequired,
      attendedById:
        nextAttendedById !== undefined
          ? nextAttendedById
          : originalAttendedById !== undefined && originalAttendedById !== null
            ? null
            : undefined,
      customerType: editData.customerType,
      status: editData.status,
    };

    updateEnquiryMutation.mutate(updatePayload);
  };

  const handleCancelEdit = () => {
    setEditingEnquiry(null);
    setEditData({});
    setOriginalAttendedById(undefined);
    setSelectedCustomer(null);
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

  if (enquiriesQuery.error) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="p-6 max-w-md bg-white rounded-lg border border-red-200 shadow-sm text-center">
          <p className="text-red-600 font-medium">Failed to load enquiries</p>
          <p className="text-sm text-gray-500 mt-1">{enquiriesQuery.error.message}</p>
        </div>
      </div>
    );
  }

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

        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <span className="font-medium whitespace-nowrap">Financial year</span>
            <select
              value={financialYear}
              onChange={(e) => setFinancialYear(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            >
              {financialYearOptions.map((fy) => (
                <option key={fy} value={fy}>
                  {fy}
                </option>
              ))}
            </select>
          </label>
          <p className="text-sm text-gray-500">
            Enquiries and status counts below are scoped to this financial year (Apr–Mar).
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-4 md:gap-6 mb-8">
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
                    <dt className="text-sm font-medium text-gray-500 truncate">Total</dt>
                    <dd className="text-lg font-medium text-gray-900">{typeof displayStats.total === 'number' ? displayStats.total.toLocaleString() : displayStats.total}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div 
            className={`bg-white overflow-hidden shadow rounded-lg cursor-pointer transition-all hover:shadow-lg ${
              statusFilter === 'LIVE' ? 'ring-2 ring-yellow-500' : ''
            }`}
            onClick={() => setStatusFilter(statusFilter === 'LIVE' ? null : 'LIVE')}
          >
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                    <div className="text-white font-bold text-sm">⏳</div>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Live</dt>
                    <dd className="text-lg font-medium text-gray-900">{typeof displayStats.live === 'number' ? displayStats.live.toLocaleString() : displayStats.live}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div 
            className={`bg-white overflow-hidden shadow rounded-lg cursor-pointer transition-all hover:shadow-lg ${
              statusFilter === 'DEAD' ? 'ring-2 ring-gray-500' : ''
            }`}
            onClick={() => setStatusFilter(statusFilter === 'DEAD' ? null : 'DEAD')}
          >
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-gray-500 rounded-md flex items-center justify-center">
                    <div className="text-white font-bold text-sm">💀</div>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Dead</dt>
                    <dd className="text-lg font-medium text-gray-900">{typeof displayStats.dead === 'number' ? displayStats.dead.toLocaleString() : displayStats.dead}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div 
            className={`bg-white overflow-hidden shadow rounded-lg cursor-pointer transition-all hover:shadow-lg ${
              statusFilter === 'RCD' ? 'ring-2 ring-blue-500' : ''
            }`}
            onClick={() => setStatusFilter(statusFilter === 'RCD' ? null : 'RCD')}
          >
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                    <div className="text-white font-bold text-sm">📥</div>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">RCD</dt>
                    <dd className="text-lg font-medium text-gray-900">{typeof displayStats.rcd === 'number' ? displayStats.rcd.toLocaleString() : displayStats.rcd}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div 
            className={`bg-white overflow-hidden shadow rounded-lg cursor-pointer transition-all hover:shadow-lg ${
              statusFilter === 'LOST' ? 'ring-2 ring-red-500' : ''
            }`}
            onClick={() => setStatusFilter(statusFilter === 'LOST' ? null : 'LOST')}
          >
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-red-500 rounded-md flex items-center justify-center">
                    <div className="text-white font-bold text-sm">❌</div>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Lost</dt>
                    <dd className="text-lg font-medium text-gray-900">{typeof displayStats.lost === 'number' ? displayStats.lost.toLocaleString() : displayStats.lost}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div 
            className={`bg-white overflow-hidden shadow rounded-lg cursor-pointer transition-all hover:shadow-lg ${
              statusFilter === 'WON' ? 'ring-2 ring-green-500' : ''
            }`}
            onClick={() => setStatusFilter(statusFilter === 'WON' ? null : 'WON')}
          >
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                    <div className="text-white font-bold text-sm">🏆</div>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Won</dt>
                    <dd className="text-lg font-medium text-gray-900">{typeof displayStats.won === 'number' ? displayStats.won.toLocaleString() : displayStats.won}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div 
            className={`bg-white overflow-hidden shadow rounded-lg cursor-pointer transition-all hover:shadow-lg ${
              statusFilter === 'BUDGETARY' ? 'ring-2 ring-orange-500' : ''
            }`}
            onClick={() => setStatusFilter(statusFilter === 'BUDGETARY' ? null : 'BUDGETARY')}
          >
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-orange-500 rounded-md flex items-center justify-center">
                    <div className="text-white font-bold text-sm">💰</div>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Budgetary</dt>
                    <dd className="text-lg font-medium text-gray-900">{typeof displayStats.budgetary === 'number' ? displayStats.budgetary.toLocaleString() : displayStats.budgetary}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Status */}
        {statusFilter && (
          <div className="mb-4 flex items-center justify-between bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center">
              <span className="text-sm text-blue-700">
                Showing enquiries with status: <strong>{statusFilter}</strong>
              </span>
            </div>
            <button
              onClick={() => setStatusFilter(null)}
              className="text-sm text-blue-600 hover:text-blue-800 underline"
            >
              Clear Filter
            </button>
          </div>
        )}

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
            {/* Search */}
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
            </div>

            {/* Table */}
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="relative w-full overflow-x-auto">
                <table className="w-full min-w-[960px] caption-bottom text-sm table-fixed">
                  <colgroup>
                    <col className="w-[11%]" />
                    <col className="w-[13%]" />
                    <col className="w-[26%]" />
                    <col className="w-[17%]" />
                    <col className="w-[118px]" />
                    <col className="w-[132px]" />
                    <col className="w-[152px]" />
                  </colgroup>
                  <thead className="[&_tr]:border-b bg-gray-50">
                    <tr>
                      <th className="text-black h-10 px-3 text-left align-middle font-medium whitespace-nowrap">FY #</th>
                      <th className="text-black h-10 px-3 text-left align-middle font-medium whitespace-nowrap">Quotation Number</th>
                      <th className="text-black h-10 px-3 text-left align-middle font-medium">Subject</th>
                      <th className="text-black h-10 px-3 text-left align-middle font-medium">Customer</th>
                      <th className="text-black h-10 px-3 text-left align-middle font-medium whitespace-nowrap min-w-[118px]">Enquiry Date</th>
                      <th className="text-black h-10 px-3 text-left align-middle font-medium whitespace-nowrap">Status</th>
                      <th className="text-black h-10 px-3 text-right align-middle font-medium whitespace-nowrap sticky right-0 bg-gray-50 z-10 shadow-[-4px_0_8px_-2px_rgba(0,0,0,0.08)]">Actions</th>
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
                      filteredEnquiries.map((enquiry: EnquiryRow) => (
                        <tr key={enquiry.id} className="group hover:bg-gray-50 data-[state=selected]:bg-muted border-b transition-colors">
                          <td className="p-3 align-middle whitespace-nowrap text-sm text-gray-900" title={`Internal id: ${enquiry.id}`}>
                            {enquiry.financialYear}-{enquiry.sequenceNumber}
                          </td>
                          <td className="p-3 align-middle text-sm text-gray-900">
                            <div className="truncate whitespace-nowrap" title={enquiry.quotationNumber ?? undefined}>
                              {enquiry.quotationNumber ?? '-'}
                            </div>
                          </td>
                          <td className="p-3 align-middle min-w-0">
                            <div className="text-sm text-gray-900 truncate" title={(enquiry.subject ?? 'No subject') || undefined}>
                              {enquiry.subject ?? 'No subject'}
                            </div>
                          </td>
                          <td className="p-3 align-middle min-w-0">
                            <div className="text-sm text-gray-900 truncate" title={(enquiry.company?.name ?? 'N/A') || undefined}>
                              {enquiry.company?.name ?? 'N/A'}
                            </div>
                          </td>
                          <td className="p-3 align-middle text-sm text-gray-500 whitespace-nowrap min-w-[118px] tabular-nums text-left font-medium">
                            {formatDateSafe(enquiry.enquiryDate, {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </td>
                          <td className="p-3 align-middle whitespace-nowrap">
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
                                    <div>Date: {formatDateSafe(enquiry.poDate)}</div>
                                  )}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="p-3 align-middle whitespace-nowrap text-right sticky right-0 z-10 bg-white group-hover:bg-gray-50 shadow-[-4px_0_8px_-2px_rgba(0,0,0,0.06)] border-l border-gray-100">
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
                                disabled={deleteEnquiryMutation.isPending && deletingEnquiryId === enquiry.id}
                                className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all hover:bg-red-100 h-8 w-8 rounded-md text-red-600 hover:text-red-700 disabled:pointer-events-none disabled:opacity-50"
                                title={deleteEnquiryMutation.isPending && deletingEnquiryId === enquiry.id ? 'Deleting enquiry' : 'Delete Enquiry'}
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
                            {searchTerm || statusFilter !== null
                              ? 'No enquiries found matching your criteria.'
                              : 'No enquiries found.'}
                          </div>
                          {!searchTerm && statusFilter === null && (
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

            {/* Pagination Controls */}
            {totalEnquiries > 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t border-gray-200">
                <div className="text-sm text-gray-500">
                  Showing <span className="font-medium text-gray-900">{((currentPage - 1) * pageSize) + 1}</span> to{' '}
                  <span className="font-medium text-gray-900">{Math.min(currentPage * pageSize, totalEnquiries)}</span> of{' '}
                  <span className="font-medium text-gray-900">{totalEnquiries}</span> enquiries
                </div>

                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <span>Rows per page:</span>
                    <select
                      value={pageSize}
                      onChange={(e) => {
                        setPageSize(Number(e.target.value));
                        setCurrentPage(1);
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
                      onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                      disabled={currentPage <= 1 || isLoading}
                      className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:pointer-events-none transition-colors"
                      title="Previous Page"
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Prev
                    </button>
                    <span className="px-3 text-sm text-gray-700 font-medium">
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                      disabled={currentPage >= totalPages || isLoading}
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

            {/* Edit Modal */}
            {editingEnquiry && (
              <div className="fixed inset-0 z-50 bg-black/50 p-4 flex items-center justify-center">
                <div className="w-full max-w-6xl max-h-[92vh] overflow-y-auto bg-white rounded-lg border shadow-xl p-6 space-y-6">
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

                {/* Customer Information Section */}
                <div className="bg-white rounded-xl border shadow-sm">
                  <div className="px-6 pt-6">
                    <h4 className="text-lg font-semibold text-gray-900 flex items-center">
                      <Building className="w-5 h-5 mr-2 text-blue-600" />
                      Customer Information
                    </h4>
                    <p className="text-gray-900 text-sm">Select or change the customer for this enquiry</p>
                  </div>
                  <div className="px-6 pb-6 space-y-4">
                    <CustomerSelector
                      customers={allEntities}
                      selectedCustomer={selectedCustomer}
                      onCustomerSelect={(customer) => {
                        setSelectedCustomer(customer);
                        setEditData({ 
                          ...editData, 
                          customerId: customer?.id,
                          entityType: customer?.type === 'Company' ? 'company' : 'customer',
                          locationId: undefined, // Reset location when customer changes
                        });
                      }}
                      loading={isLoadingEntities}
                      placeholder="Search and select a customer..."
                      emptyMessage="No customers found"
                      loadingMessage="Loading customers..."
                    />
                    
                    <div className="space-y-2">
                      <label htmlFor="edit-locationId" className="block text-sm font-medium text-gray-900">
                        Location (Office/Plant)
                      </label>
                      <select
                        id="edit-locationId"
                        value={editData.locationId ?? ''}
                        onChange={(e) => setEditData({ ...editData, locationId: e.target.value || undefined })}
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-black bg-white"
                        disabled={!selectedCustomerId || isLoadingLocations}
                      >
                        <option value="" className="text-black bg-white">
                          {isLoadingLocations ? 'Loading locations...' : 
                           !selectedCustomerId ? 'Select a customer first' : 
                           'Select a location'}
                        </option>
                        {locations?.map((location: { id: string; name: string; type: string; locationString?: string }) => (
                          <option key={location.id} value={location.id} className="text-black bg-white">
                            {location.locationString ? `${location.locationString} - ${location.name} (${location.type})` : `${location.name} (${location.type})`}
                          </option>
                        ))}
                      </select>
                      {selectedCustomerId && locations && locations.length === 0 && (
                        <p className="mt-2 text-sm text-yellow-600">
                          No locations found for this customer. Please add locations to the customer first.
                        </p>
                      )}
                    </div>
                  </div>
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
                          type="text"
                          id="edit-numberOfBlocks"
                          value={editData.numberOfBlocks ?? ''}
                          onChange={(e) => {
                            const value = e.target.value;
                            setEditData({ 
                              ...editData, 
                              numberOfBlocks: value && value.trim() !== '' ? value : undefined 
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
                            const cleanedValue = normalizeOptionalUuidValue(e.target.value);
                            setEditData({ ...editData, attendedById: cleanedValue ?? undefined });
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
              </div>
            )}

            {/* View Enquiry Modal */}
            {viewingEnquiry && (
              <div className="fixed inset-0 z-50 bg-black/50 p-4 flex items-center justify-center">
                <div className="w-full max-w-6xl max-h-[92vh] overflow-y-auto bg-white rounded-lg border shadow-xl p-6 space-y-6">
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
                  const enquiry = allEnquiries.find((e) => e.id === viewingEnquiry);
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
                                {formatDateSafe(enquiry.enquiryDate) !== '-' ? formatDateSafe(enquiry.enquiryDate) : 'Not specified'}
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
                              <p className="text-gray-900">{formatDateSafe(enquiry.oaDate) !== '-' ? formatDateSafe(enquiry.oaDate) : 'Not specified'}</p>
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
                                {formatDateSafe(enquiry.quotationDate) !== '-' ? formatDateSafe(enquiry.quotationDate) : 'Not specified'}
                              </p>
                            </div>
                            {enquiry.status === 'RCD' && (
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Date of Receipt
                                </label>
                                <p className="text-gray-900">
                                  {formatDateSafe(enquiry.dateOfReceipt) !== '-' ? formatDateSafe(enquiry.dateOfReceipt) : 'Not received'}
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
                                {enquiry.numberOfBlocks ? String(enquiry.numberOfBlocks) : 'Not specified'}
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
                                {formatDateSafe(enquiry.createdAt)}
                              </p>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Last Updated
                              </label>
                              <p className="text-gray-900">
                                {formatDateSafe(enquiry.updatedAt)}
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
