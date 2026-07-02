'use client';

import { useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { api } from '@/trpc/client';
import { buildFinancialYearOptions, getFinancialYear } from '@/lib/financial-year';

type PortfolioView = 'monthly' | 'yearly';

interface PortfolioPoint {
  period: string;
  count: number;
  totalValue: number;
}

const COUNT_COLOR = '#2563eb';
const VALUE_COLOR = '#ea580c';

function formatCurrency(value: number): string {
  if (value >= 10000000) return `₹${(value / 10000000).toFixed(1)}Cr`;
  if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
  if (value >= 1000) return `₹${(value / 1000).toFixed(0)}k`;
  return `₹${value.toLocaleString()}`;
}

function PortfolioTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ dataKey: string; value: number; color: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;

  const countEntry = payload.find((entry) => entry.dataKey === 'count');
  const valueEntry = payload.find((entry) => entry.dataKey === 'totalValue');

  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-md">
      <p className="text-sm font-semibold text-slate-900">{label}</p>
      <div className="mt-2 space-y-1">
        <p className="flex items-center gap-2 text-sm text-blue-700">
          <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: COUNT_COLOR }} />
          Count: {countEntry?.value ?? 0}
        </p>
        <p className="flex items-center gap-2 text-sm text-orange-700">
          <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: VALUE_COLOR }} />
          Value: {formatCurrency(valueEntry?.value ?? 0)}
        </p>
      </div>
    </div>
  );
}

export function QuotationPortfolioChart() {
  const [view, setView] = useState<PortfolioView>('monthly');
  const [financialYear, setFinancialYear] = useState(() => getFinancialYear(new Date()));
  const yearOptions = useMemo(() => buildFinancialYearOptions(6, 1), []);

  const { data, isLoading } = api.dashboard.getQuotationValueVsLive.useQuery({
    view,
    financialYear: view === 'monthly' ? financialYear : undefined,
    yearsBack: 6,
  });

  const trends: PortfolioPoint[] = data?.trends ?? [];
  const totalCount = data?.totalCount ?? 0;
  const totalValue = data?.totalValue ?? 0;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Quotation portfolio analysis</h2>
          <p className="mt-1 text-sm text-slate-500">
            Separate count and value bars by period
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

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700">
          {totalCount} quotations
        </div>
        <div className="rounded-full bg-orange-50 px-3 py-1 text-sm font-medium text-orange-700">
          {formatCurrency(totalValue)} total value
        </div>
        {view === 'monthly' && (
          <span className="text-sm text-slate-500">FY {financialYear}</span>
        )}
      </div>

      <div className="mb-3 flex items-center gap-4 text-xs text-slate-600">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-sm" style={{ backgroundColor: COUNT_COLOR }} />
          Count (left axis)
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-sm" style={{ backgroundColor: VALUE_COLOR }} />
          Value (right axis)
        </span>
      </div>

      <div className="h-80">
        {isLoading ? (
          <div className="flex h-full items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
          </div>
        ) : trends.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-slate-500">
            No quotation data for this period
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={trends}
              margin={{ top: 12, right: 12, left: 4, bottom: 0 }}
              barCategoryGap="24%"
              barGap={10}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis
                dataKey="period"
                tick={{ fill: '#64748b', fontSize: 12 }}
                axisLine={{ stroke: '#cbd5e1' }}
                tickLine={false}
              />
              <YAxis
                yAxisId="count"
                allowDecimals={false}
                tick={{ fill: COUNT_COLOR, fontSize: 12 }}
                axisLine={{ stroke: '#bfdbfe' }}
                tickLine={false}
                width={42}
              />
              <YAxis
                yAxisId="value"
                orientation="right"
                tick={{ fill: VALUE_COLOR, fontSize: 12 }}
                axisLine={{ stroke: '#fed7aa' }}
                tickLine={false}
                tickFormatter={(value: number) => formatCurrency(value)}
                width={56}
              />
              <Tooltip content={<PortfolioTooltip />} cursor={{ fill: '#f8fafc' }} />
              <Legend
                verticalAlign="top"
                height={28}
                formatter={(value) => (
                  <span className="text-xs text-slate-600">{value}</span>
                )}
              />
              <Bar
                yAxisId="count"
                dataKey="count"
                name="Count"
                fill={COUNT_COLOR}
                radius={[4, 4, 0, 0]}
                maxBarSize={28}
                minPointSize={3}
              />
              <Bar
                yAxisId="value"
                dataKey="totalValue"
                name="Value"
                fill={VALUE_COLOR}
                radius={[4, 4, 0, 0]}
                maxBarSize={28}
                minPointSize={3}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
