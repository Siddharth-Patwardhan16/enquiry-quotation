import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface ChartData {
  name: string;
  count: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export { MonthlyTrendsChart } from './MonthlyTrendsChart';
export { QuotationPortfolioChart } from './QuotationPortfolioChart';
export { QuotationPortfolioChart as QuotationValueVsLiveChart } from './QuotationPortfolioChart';

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
