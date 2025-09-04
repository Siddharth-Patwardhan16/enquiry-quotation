import { XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Area, AreaChart } from 'recharts';

interface ChartData {
  name: string;
  count: number;
}

interface MonthlyTrendData {
  month: string;
  count: number;
}

interface QuotationValueData {
  status: string;
  count: number;
  totalValue: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export function MonthlyTrendsChart({ monthlyTrends, isLoadingTrends }: { monthlyTrends: MonthlyTrendData[] | undefined; isLoadingTrends: boolean }) {
  return (
    <div className="bg-white rounded-xl border shadow-sm p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Monthly Enquiry Trends</h2>
      <div className="h-80">
        {isLoadingTrends ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={monthlyTrends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="count" stroke="#8884d8" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

export function LostReasonsChart({ lostReasons, isLoadingReasons }: { lostReasons: ChartData[] | undefined; isLoadingReasons: boolean }) {
  return (
    <div className="bg-white rounded-xl border shadow-sm p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Quotation Lost Reasons</h2>
      <div className="h-80">
        {isLoadingReasons ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : lostReasons && lostReasons.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={lostReasons}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="count"
              >
                {lostReasons.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            No lost quotations data available
          </div>
        )}
      </div>
    </div>
  );
}

export function QuotationValueVsLiveChart({ quotationData, isLoading }: { quotationData: QuotationValueData[] | undefined; isLoading: boolean }) {
  // Custom tooltip for area chart
  const AreaTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ payload: QuotationValueData }>; label?: string }) => {
    if (active && payload?.length) {
      const data = payload[0]?.payload;
      if (data) {
        return (
          <div className="bg-white p-4 border rounded-lg shadow-xl">
            <p className="font-bold text-lg mb-2">{`${label} Quotations`}</p>
            <div className="space-y-1">
              <p className="text-blue-600 font-medium">{`📊 Count: ${data.count}`}</p>
              <p className="text-green-600 font-medium">{`💰 Value: ₹${data.totalValue.toLocaleString()}`}</p>
              <p className="text-gray-600 text-sm">{`📈 Avg Value: ₹${Math.round(data.totalValue / data.count).toLocaleString()}`}</p>
            </div>
          </div>
        );
      }
    }
    return null;
  };

  // Custom tooltip for donut chart
  const DonutTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number; payload: QuotationValueData }> }) => {
    if (active && payload?.length) {
      const data = payload[0];
      return (
        <div className="bg-white p-3 border rounded shadow-lg">
          <p className="font-semibold">{`${data.name}: ${data.value} quotations`}</p>
          <p className="text-green-600">{`Value: ₹${data.payload.totalValue.toLocaleString()}`}</p>
        </div>
      );
    }
    return null;
  };

  // Calculate total for percentage calculations
  const totalQuotations = quotationData?.reduce((sum, item) => sum + item.count, 0) ?? 0;
  const totalValue = quotationData?.reduce((sum, item) => sum + item.totalValue, 0) ?? 0;

  return (
    <div className="bg-white rounded-xl border shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">Quotation Portfolio Analysis</h2>
        <div className="flex space-x-4 text-sm">
          <div className="bg-blue-50 px-3 py-1 rounded-full">
            <span className="text-blue-600 font-medium">Total: {totalQuotations} quotations</span>
          </div>
          <div className="bg-green-50 px-3 py-1 rounded-full">
            <span className="text-green-600 font-medium">Value: ₹{totalValue.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-80">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : quotationData && quotationData.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Area Chart - Value Distribution */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">Value Distribution by Status</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={quotationData}>
                  <defs>
                    <linearGradient id="valueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="status" 
                    fontSize={12}
                    tick={{ fill: '#6b7280' }}
                  />
                  <YAxis 
                    fontSize={12}
                    tick={{ fill: '#6b7280' }}
                    tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip content={<AreaTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="totalValue"
                    stroke="#3b82f6"
                    strokeWidth={3}
                    fill="url(#valueGradient)"
                    name="Total Value"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Donut Chart - Count Distribution */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">Quotation Count by Status</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={quotationData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="count"
                    nameKey="status"
                  >
                    {quotationData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={COLORS[index % COLORS.length]} 
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<DonutTooltip />} />
                  <Legend 
                    verticalAlign="bottom" 
                    height={36}
                    formatter={(value, entry) => (
                      <span style={{ color: entry.color, fontSize: '12px' }}>
                        {value}: {quotationData?.find(d => d.status === value)?.count ?? 0}
                      </span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center h-80 text-gray-500">
          <div className="text-center">
            <div className="text-6xl mb-4">📊</div>
            <p className="text-lg">No quotation data available</p>
            <p className="text-sm">Create some quotations to see the analysis</p>
          </div>
        </div>
      )}
    </div>
  );
}
