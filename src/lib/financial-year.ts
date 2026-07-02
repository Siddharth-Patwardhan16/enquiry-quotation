import { z } from 'zod';

/** Indian FY: April → March, label e.g. "2025-26" */
export function getFinancialYear(date: Date): string {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;

  if (month >= 4) {
    return `${year}-${String(year + 1).slice(-2)}`;
  }
  return `${year - 1}-${String(year).slice(-2)}`;
}

const fyLabelRegex = /^(\d{4})-(\d{2})$/;

/** Parse "YYYY-YY" into calendar years [startYear, endYear] spanning Apr startYear – Mar endYear */
export function parseFinancialYearLabel(fy: string): { startYear: number; endYear: number } {
  const m = fyLabelRegex.exec(fy.trim());
  if (!m) {
    throw new Error(`Invalid financial year label: ${fy}`);
  }
  const startYear = Number(m[1]);
  const yy = m[2];
  const endYear = startYear + 1;
  if (String(endYear).slice(-2) !== yy) {
    throw new Error(`Invalid financial year label (year mismatch): ${fy}`);
  }
  return { startYear, endYear };
}

/** Inclusive UTC-safe window for DB filters: [Apr 1 startYear, Mar 31 endYear end-of-day] local */
export function getFinancialYearDateRange(fy: string): { gte: Date; lte: Date } {
  const { startYear, endYear } = parseFinancialYearLabel(fy);
  const gte = new Date(startYear, 3, 1, 0, 0, 0, 0);
  const lte = new Date(endYear, 2, 31, 23, 59, 59, 999);
  return { gte, lte };
}

export function buildFinancialYearOptions(
  yearsBack = 6,
  yearsForward = 1,
  referenceDate: Date = new Date(),
): string[] {
  const current = getFinancialYear(referenceDate);
  const { startYear: currentStart } = parseFinancialYearLabel(current);
  const labels: string[] = [];
  for (let delta = -yearsBack; delta <= yearsForward; delta += 1) {
    const y = currentStart + delta;
    labels.push(`${y}-${String(y + 1).slice(-2)}`);
  }
  return labels;
}

export const FinancialYearFilterSchema = z.object({
  financialYear: z.string().optional(),
});

export const EnquiryTrendsFilterSchema = z.object({
  view: z.enum(['monthly', 'yearly']).default('monthly'),
  financialYear: z.string().optional(),
  yearsBack: z.number().min(1).max(10).optional().default(6),
});

export type FinancialYearFilterInput = z.infer<typeof FinancialYearFilterSchema>;
export type EnquiryTrendsFilterInput = z.infer<typeof EnquiryTrendsFilterSchema>;

/** Month labels in FY order (April → March) */
export const FINANCIAL_YEAR_MONTH_LABELS = [
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
  'Jan',
  'Feb',
  'Mar',
] as const;

/** 0 = April, …, 11 = March */
export function dateToFinancialYearMonthIndex(date: Date): number {
  const m = date.getMonth();
  return m >= 3 ? m - 3 : m + 9;
}
