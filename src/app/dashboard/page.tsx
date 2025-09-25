'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '../../components/providers/AuthProvider';
import { api } from '../../trpc/client';
import { 
  StatCard, 
  MonthlyTrendsChart, 
  LostReasonsChart, 
  QuotationValueVsLiveChart,
  RecentEnquiries, 
  RecentQuotations
} from '../../components/dashboard';
import { DashboardSkeleton } from '../../components/ui/loading-skeleton';

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuth();

  // Fetch dashboard data
  const { data: stats, isLoading: isLoadingStats } = api.dashboard.getStats.useQuery();
  const { data: lostReasons, isLoading: isLoadingReasons } = api.dashboard.getLostReasons.useQuery();
  const { data: recentEnquiries, isLoading: isLoadingEnquiries } = api.dashboard.getRecentEnquiries.useQuery();
  const { data: recentQuotations, isLoading: isLoadingQuotations } = api.dashboard.getRecentQuotations.useQuery();
  const { data: monthlyTrends, isLoading: isLoadingTrends } = api.dashboard.getMonthlyEnquiryTrends.useQuery();
  const { data: quotationValueData, isLoading: isLoadingQuotationValue } = api.dashboard.getQuotationValueVsLive.useQuery();

  // Show loading skeleton while data is loading
  if (isLoadingStats || isLoadingReasons || isLoadingEnquiries || isLoadingQuotations || isLoadingTrends || isLoadingQuotationValue) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">Welcome back, {user?.name ?? 'User'}!</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Customers" 
          value={stats?.customerCount} 
          isLoading={isLoadingStats}
          icon="👥"
          color="blue"
        />
        <StatCard 
          title="Total Enquiries" 
          value={stats?.enquiryCount} 
          isLoading={isLoadingStats}
          icon="📋"
          color="green"
        />
        <StatCard 
          title="Total Quotations" 
          value={stats?.quotationCount} 
          isLoading={isLoadingStats}
          icon="📄"
          color="yellow"
        />
        <StatCard 
          title="Deals Won" 
          value={stats?.wonDealsCount} 
          isLoading={isLoadingStats}
          icon="🏆"
          color="purple"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MonthlyTrendsChart 
          monthlyTrends={monthlyTrends} 
          isLoadingTrends={isLoadingTrends} 
        />
        <LostReasonsChart 
          lostReasons={lostReasons} 
          isLoadingReasons={isLoadingReasons} 
        />
      </div>

      {/* Quotation Portfolio Analysis */}
      <div className="grid grid-cols-1 gap-6">
        <QuotationValueVsLiveChart 
          quotationData={quotationValueData} 
          isLoading={isLoadingQuotationValue} 
        />
      </div>

      {/* Recent Activity Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentEnquiries 
          recentEnquiries={recentEnquiries} 
          isLoadingEnquiries={isLoadingEnquiries} 
        />
        <RecentQuotations 
          recentQuotations={recentQuotations} 
          isLoadingQuotations={isLoadingQuotations} 
        />
      </div>

      {/* Admin Access Section */}
      {user?.role === 'ADMINISTRATOR' && (
        <div className="bg-white rounded-xl border shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Admin Access</h3>
              <p className="text-sm text-gray-600">You have administrator privileges</p>
            </div>
            <button
              onClick={() => router.push('/admin')}
              className="px-4 py-2 bg-yellow-600 text-white text-sm rounded-md hover:bg-yellow-700 transition-colors"
            >
              Manage Users
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

