'use client';

import { useMemo, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { api } from '@/trpc/client';
import { buildFinancialYearOptions, getFinancialYear } from '@/lib/financial-year';

type TrendView = 'monthly' | 'yearly';

interface TrendPoint {
  month: string;
  count: number;
}

function TrendTooltip({
  active,
  payload,
  label,
  view,
}: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
  view: TrendView;
}) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-md">
      <p className="text-xs font-medium text-slate-500">
        {view === 'monthly' ? 'Month' : 'Financial year'}
      </p>
      <p className="text-sm font-semibold text-slate-900">{label}</p>
      <p className="mt-1 text-sm text-emerald-700">
        {payload[0]?.value ?? 0} enquiries
      </p>
    </div>
  );
}

export function MonthlyTrendsChart() {
  const [view, setView] = useState<TrendView>('monthly');
  const [financialYear, setFinancialYear] = useState(() => getFinancialYear(new Date()));
  const yearOptions = useMemo(() => buildFinancialYearOptions(6, 1), []);

  const { data, isLoading } = api.dashboard.getMonthlyEnquiryTrends.useQuery({
    view,
    financialYear: view === 'monthly' ? financialYear : undefined,
    yearsBack: 6,
  });

  const trends: TrendPoint[] = data?.trends ?? [];
  const totalCount = data?.totalCount ?? 0;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Enquiry Trends</h2>
          <p className="mt-1 text-sm text-slate-500">
            Live enquiry counts from the database
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1">
            {(['monthly', 'yearly'] as const).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setView(option)}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  view === option
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {option === 'monthly' ? 'Monthly' : 'Yearly'}
              </button>
            ))}
          </div>

          {view === 'monthly' && (
            <select
              value={financialYear}
              onChange={(event) => setFinancialYear(event.target.value)}
              className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              {yearOptions.map((fy) => (
                <option key={fy} value={fy}>
                  FY {fy}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      <div className="mb-4 flex items-center gap-3">
        <div className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700">
          {totalCount} total enquiries
        </div>
        {view === 'monthly' && (
          <span className="text-sm text-slate-500">FY {financialYear}</span>
        )}
      </div>

      <div className="h-80">
        {isLoading ? (
          <div className="flex h-full items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
          </div>
        ) : trends.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-slate-500">
            No enquiry data for this period
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trends} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis
                dataKey="month"
                tick={{ fill: '#64748b', fontSize: 12 }}
                axisLine={{ stroke: '#cbd5e1' }}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fill: '#64748b', fontSize: 12 }}
                axisLine={{ stroke: '#cbd5e1' }}
              />
              <Tooltip content={<TrendTooltip view={view} />} />
              <Line
                type="monotone"
                dataKey="count"
                name="Enquiries"
                stroke="#059669"
                strokeWidth={2.5}
                dot={{ r: 4, fill: '#059669', strokeWidth: 0 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
