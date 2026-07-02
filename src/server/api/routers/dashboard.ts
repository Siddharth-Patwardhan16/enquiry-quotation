// src/server/api/routers/dashboard.ts
import {
  FinancialYearFilterSchema,
  EnquiryTrendsFilterSchema,
  FINANCIAL_YEAR_MONTH_LABELS,
  buildFinancialYearOptions,
  dateToFinancialYearMonthIndex,
  getFinancialYear,
  parseFinancialYearLabel,
} from '@/lib/financial-year';
import { createTRPCRouter, publicProcedure } from '../trpc';
import { db } from '../../db';

export const dashboardRouter = createTRPCRouter({
  // Procedure to get the main count statistics for the cards
  getStats: publicProcedure
    .input(FinancialYearFilterSchema)
    .query(async ({ input }) => {
    const enquiryFy = input.financialYear ? { financialYear: input.financialYear } : {};
    const quotationEnquiryFy = input.financialYear
      ? { enquiry: { financialYear: input.financialYear } }
      : {};

    const customerCount = await db.customer.count();
    const enquiryCount = await db.enquiry.count({ where: enquiryFy });
    const quotationCount = await db.quotation.count({ where: quotationEnquiryFy });

    const wonDealsCount = await db.quotation.count({
      where: {
        status: 'WON',
        ...quotationEnquiryFy,
      },
    });

    return {
      customerCount,
      enquiryCount,
      quotationCount,
      wonDealsCount,
    };
  }),

  // Procedure to get data for the "Lost Reasons" chart
  getLostReasons: publicProcedure
    .input(FinancialYearFilterSchema)
    .query(async ({ input }) => {
    const lostReasons = await db.quotation.groupBy({
      by: ['lostReason'], // Group by the 'lostReason' column
      _count: {
        lostReason: true, // Count how many times each reason appears
      },
      where: {
        status: 'LOST',
        lostReason: {
          not: null, // Exclude entries where the reason is not set
        },
        ...(input.financialYear
          ? { enquiry: { financialYear: input.financialYear } }
          : {}),
      },
    });

    // Format the data to be easily used by a charting library
    // Filter out any null values and ensure type safety
    return (lostReasons as Array<{ lostReason: string | null; _count: { lostReason: number } }>)
      .filter((reason) => reason.lostReason !== null)
      .map((reason) => ({
        name: reason.lostReason!,
        count: reason._count.lostReason,
      }));
  }),

  // Procedure to get recent enquiries for the dashboard
  getRecentEnquiries: publicProcedure
    .input(FinancialYearFilterSchema)
    .query(async ({ input }) => {
    const recentEnquiries = await db.enquiry.findMany({
      where: input.financialYear ? { financialYear: input.financialYear } : undefined,
      take: 5,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        customer: {
          select: {
            name: true,
          },
        },
        marketingPerson: {
          select: {
            name: true,
          },
        },
      },
    });

    return recentEnquiries;
  }),

  // Procedure to get recent quotations for the dashboard
  getRecentQuotations: publicProcedure
    .input(FinancialYearFilterSchema)
    .query(async ({ input }) => {
    const recentQuotations = await db.quotation.findMany({
      where: input.financialYear
        ? { enquiry: { financialYear: input.financialYear } }
        : undefined,
      take: 5,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        enquiry: {
          include: {
            customer: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    return recentQuotations;
  }),

  // Procedure to get monthly or yearly enquiry trends (live counts)
  getMonthlyEnquiryTrends: publicProcedure
    .input(EnquiryTrendsFilterSchema)
    .query(async ({ input }) => {
      if (input.view === 'yearly') {
        const currentFy = getFinancialYear(new Date());
        const { startYear: currentStart } = parseFinancialYearLabel(currentFy);
        const yearLabels = Array.from({ length: input.yearsBack ?? 6 }, (_, index) => {
          const startYear = currentStart - ((input.yearsBack ?? 6) - 1 - index);
          return `${startYear}-${String(startYear + 1).slice(-2)}`;
        });

        const grouped = await db.enquiry.groupBy({
          by: ['financialYear'],
          _count: { id: true },
          where: {
            financialYear: { in: yearLabels },
          },
        });

        const countByYear = new Map(
          grouped.map((row) => [row.financialYear, row._count.id]),
        );

        const trends = yearLabels.map((fy) => ({
          month: fy,
          count: countByYear.get(fy) ?? 0,
        }));

        return {
          trends,
          totalCount: trends.reduce((sum, row) => sum + row.count, 0),
        };
      }

      const financialYear = input.financialYear ?? getFinancialYear(new Date());
      const rows = await db.enquiry.findMany({
        where: { financialYear },
        select: { createdAt: true, enquiryDate: true },
      });

      const counts = Array.from({ length: 12 }, () => 0);
      for (const row of rows) {
        const date = row.enquiryDate ?? row.createdAt;
        const idx = dateToFinancialYearMonthIndex(date);
        counts[idx] += 1;
      }

      const trends = FINANCIAL_YEAR_MONTH_LABELS.map((month, index) => ({
        month,
        count: counts[index] ?? 0,
      }));

      return {
        trends,
        totalCount: rows.length,
        financialYear,
        yearOptions: buildFinancialYearOptions(6, 1),
      };
    }),

  // Procedure to get quotation portfolio trends (count + value by month or year)
  getQuotationValueVsLive: publicProcedure
    .input(EnquiryTrendsFilterSchema)
    .query(async ({ input }) => {
      const getQuotationValue = (quotation: {
        status: string;
        totalValue: { toString(): string } | null;
        poValue: { toString(): string } | null;
      }) => {
        if (quotation.status === 'WON' && quotation.poValue) {
          return Number(quotation.poValue);
        }
        return Number(quotation.totalValue ?? 0);
      };

      const quotations = await db.quotation.findMany({
        select: {
          totalValue: true,
          status: true,
          quotationDate: true,
          poValue: true,
          enquiry: {
            select: {
              financialYear: true,
            },
          },
        },
        where: {
          totalValue: {
            not: null,
          },
        },
      });

      if (input.view === 'yearly') {
        const currentFy = getFinancialYear(new Date());
        const { startYear: currentStart } = parseFinancialYearLabel(currentFy);
        const yearLabels = Array.from({ length: input.yearsBack ?? 6 }, (_, index) => {
          const startYear = currentStart - ((input.yearsBack ?? 6) - 1 - index);
          return `${startYear}-${String(startYear + 1).slice(-2)}`;
        });

        const counts = new Map<string, number>();
        const values = new Map<string, number>();

        for (const label of yearLabels) {
          counts.set(label, 0);
          values.set(label, 0);
        }

        for (const quotation of quotations) {
          const fy = quotation.enquiry?.financialYear;
          if (!fy || !counts.has(fy)) continue;

          counts.set(fy, (counts.get(fy) ?? 0) + 1);
          values.set(fy, (values.get(fy) ?? 0) + getQuotationValue(quotation));
        }

        const trends = yearLabels.map((period) => ({
          period,
          count: counts.get(period) ?? 0,
          totalValue: values.get(period) ?? 0,
        }));

        return {
          trends,
          totalCount: trends.reduce((sum, row) => sum + row.count, 0),
          totalValue: trends.reduce((sum, row) => sum + row.totalValue, 0),
        };
      }

      const financialYear = input.financialYear ?? getFinancialYear(new Date());
      const counts = Array.from({ length: 12 }, () => 0);
      const values = Array.from({ length: 12 }, () => 0);

      for (const quotation of quotations) {
        if (quotation.enquiry?.financialYear !== financialYear) continue;

        const monthIndex = dateToFinancialYearMonthIndex(quotation.quotationDate);
        counts[monthIndex] += 1;
        values[monthIndex] += getQuotationValue(quotation);
      }

      const trends = FINANCIAL_YEAR_MONTH_LABELS.map((period, index) => ({
        period,
        count: counts[index] ?? 0,
        totalValue: values[index] ?? 0,
      }));

      return {
        trends,
        totalCount: counts.reduce((sum, value) => sum + value, 0),
        totalValue: values.reduce((sum, value) => sum + value, 0),
        financialYear,
      };
    }),

  // Procedure to get upcoming tasks from various sources
  getUpcomingTasks: publicProcedure.query(async () => {
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    // Get tasks from enquiries that need follow-up
    const enquiryTasks = await db.enquiry.findMany({
      where: {
        status: {
          in: ['LIVE', 'RCD']
        },
        createdAt: {
          gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) // Enquiries from last 7 days
        }
      },
      include: {
        customer: {
          select: { name: true }
        },
        marketingPerson: {
          select: { name: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    // Get tasks from quotations that need attention
    const quotationTasks = await db.quotation.findMany({
      where: {
        status: {
          in: ['LIVE']
        },
        validityPeriod: {
          gte: now,
          lte: thirtyDaysFromNow
        }
      },
      include: {
        enquiry: {
          include: {
            customer: {
              select: { name: true }
            }
          }
        }
      },
      orderBy: { validityPeriod: 'asc' },
      take: 10
    });

    // Get tasks from communications that need follow-up
    const communicationTasks = await db.communication.findMany({
      where: {
        nextCommunicationDate: {
          gte: now,
          lte: thirtyDaysFromNow
        }
      },
      include: {
        customer: {
          select: { name: true }
        },
        contact: {
          select: { name: true }
        },
        employee: {
          select: { name: true }
        }
      },
      orderBy: { nextCommunicationDate: 'asc' },
      take: 10
    });

    // Convert enquiries to tasks
    const enquiryTaskList = enquiryTasks.map((enquiry) => {
      const e = enquiry as {
        id: number;
        subject: string;
        createdAt: Date;
        priority?: string;
        customer: { name: string };
        description?: string;
        requirements?: string;
        marketingPerson: { name: string };
      };
      return {
        id: `enquiry-${e.id}`,
        title: `Follow up on ${e.subject}`,
        type: 'enquiry' as const,
        dueDate: new Date(e.createdAt.getTime() + 3 * 24 * 60 * 60 * 1000), // 3 days after creation
        priority: (e.priority?.toLowerCase() as 'high' | 'medium' | 'low') ?? 'medium',
        status: 'pending' as const,
        customerName: e.customer.name,
        description: e.description ?? e.requirements ?? 'Follow up required',
        assignedTo: e.marketingPerson?.name ?? 'Unassigned',
        sourceId: e.id,
        sourceType: 'enquiry'
      };
    });

    // Convert quotations to tasks
    const quotationTaskList = quotationTasks.map((quotation) => {
      const q = quotation as {
        id: string;
        quotationNumber: string;
        validityPeriod?: Date;
        status: string;
        enquiry: { customer: { name: string } };
      };
      return {
        id: `quotation-${q.id}`,
        title: `Complete quotation ${q.quotationNumber}`,
        type: 'quotation' as const,
        dueDate: q.validityPeriod ?? new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
        priority: 'medium' as const,
        status: q.status === 'DRAFT' ? 'pending' as const : 'in-progress' as const,
        customerName: q.enquiry.customer.name,
        description: `Quotation ${q.status.toLowerCase()} - needs completion`,
        assignedTo: 'Marketing Team',
        sourceId: q.id,
        sourceType: 'quotation'
      };
    });

    // Convert communications to tasks
    const communicationTaskList = communicationTasks.map((communication) => {
      const c = communication as {
        id: string;
        subject: string;
        nextCommunicationDate?: Date;
        customer: { name: string };
        proposedNextAction?: string;
        description?: string;
        employee?: { name: string };
      };
      return {
        id: `communication-${c.id}`,
        title: `Follow up: ${c.subject}`,
        type: 'communication' as const,
        dueDate: c.nextCommunicationDate ?? new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
        priority: 'medium' as const,
        status: 'pending' as const,
        customerName: c.customer.name,
        description: c.proposedNextAction ?? c.description,
        assignedTo: c.employee?.name ?? 'Unassigned',
        sourceId: c.id,
        sourceType: 'communication'
      };
    });

    // Combine all tasks and sort by priority and due date
    const allTasks = [...enquiryTaskList, ...quotationTaskList, ...communicationTaskList];
    
    // Sort by priority (high > medium > low) then by due date
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    
    return allTasks.sort((a, b) => {
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return a.dueDate.getTime() - b.dueDate.getTime();
    }).slice(0, 8); // Return top 8 tasks
  }),
});
