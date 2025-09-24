interface RecentEnquiry {
  id: number;
  subject: string;
  status: string;
  createdAt: Date;
  customer: {
    name: string;
  } | null;
  marketingPerson: {
    name: string;
  } | null;
}

interface RecentQuotation {
  id: string;
  quotationNumber: string;
  status: string;
  createdAt: Date;
  enquiry: {
    customer: {
      name: string;
    } | null;
  };
}

export function RecentEnquiries({ recentEnquiries, isLoadingEnquiries }: { recentEnquiries: RecentEnquiry[] | undefined; isLoadingEnquiries: boolean }) {
  return (
    <div className="bg-white rounded-xl border shadow-sm p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Enquiries</h2>
      {isLoadingEnquiries ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      ) : recentEnquiries && recentEnquiries.length > 0 ? (
        <div className="space-y-3">
          {recentEnquiries.map((enquiry) => (
            <div key={enquiry.id} className="border-l-4 border-blue-500 pl-3 py-2">
              <p className="font-medium text-gray-900">{enquiry.subject}</p>
              <p className="text-sm text-gray-600">
                Customer: {enquiry.customer?.name ?? 'Unknown'} • 
                Status: {enquiry.status} • 
                {new Date(enquiry.createdAt).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500 text-center py-4">No recent enquiries</p>
      )}
    </div>
  );
}

export function RecentQuotations({ recentQuotations, isLoadingQuotations }: { recentQuotations: RecentQuotation[] | undefined; isLoadingQuotations: boolean }) {
  return (
    <div className="bg-white rounded-xl border shadow-sm p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Quotations</h2>
      {isLoadingQuotations ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      ) : recentQuotations && recentQuotations.length > 0 ? (
        <div className="space-y-3">
          {recentQuotations.map((quotation) => (
            <div key={quotation.id} className="border-l-4 border-green-500 pl-3 py-2">
              <p className="font-medium text-gray-900">{quotation.quotationNumber}</p>
              <p className="text-sm text-gray-600">
                Customer: {quotation.enquiry.customer?.name ?? 'Unknown'} • 
                Status: {quotation.status} • 
                {new Date(quotation.createdAt).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500 text-center py-4">No recent quotations</p>
      )}
    </div>
  );
}
