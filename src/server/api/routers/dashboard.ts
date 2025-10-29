// src/server/api/routers/dashboard.ts
import { createTRPCRouter, publicProcedure } from '../trpc';
import { db } from '../../db';

export const dashboardRouter = createTRPCRouter({
  // Procedure to get the main count statistics for the cards
  getStats: publicProcedure.query(async () => {
    const customerCount = await db.customer.count();
    const enquiryCount = await db.enquiry.count();
    const quotationCount = await db.quotation.count();

    // Example of a more complex aggregation: count quotations with 'WON' status
    const wonDealsCount = await db.quotation.count({
      where: {
        status: 'WON',
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
  getLostReasons: publicProcedure.query(async () => {
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
  getRecentEnquiries: publicProcedure.query(async () => {
    const recentEnquiries = await db.enquiry.findMany({
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
  getRecentQuotations: publicProcedure.query(async () => {
    const recentQuotations = await db.quotation.findMany({
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

  // Procedure to get monthly enquiry trends
  getMonthlyEnquiryTrends: publicProcedure.query(async () => {
    const monthlyTrends = await db.enquiry.groupBy({
      by: ['createdAt'],
      _count: {
        id: true,
      },
      where: {
        createdAt: {
          gte: new Date(new Date().getFullYear(), 0, 1), // From start of current year
        },
      },
    });

    // Group by month and count enquiries
    const monthlyData = monthlyTrends.reduce((acc: Record<number, number>, trend: { createdAt: Date; _count: { id: number } }) => {
      const month = trend.createdAt.getMonth();
      acc[month] = (acc[month] || 0) + trend._count.id;
      return acc;
    }, {} as Record<number, number>);

    // Convert to array format for charts
    const monthNames = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];

    return monthNames.map((month, index) => ({
      month,
      count: monthlyData[index] || 0,
    }));
  }),

  // Procedure to get quotation value vs live quotations data
  getQuotationValueVsLive: publicProcedure.query(async () => {
    // Get all quotations with their total values and status
    const quotations = await db.quotation.findMany({
      select: {
        totalValue: true,
        status: true,
        quotationDate: true,
      },
      where: {
        totalValue: {
          not: null,
        },
      },
    });

    // Group by status and calculate totals
    const statusGroups = quotations.reduce((acc, quotation) => {
      const status = quotation.status;
      if (!acc[status]) {
        acc[status] = {
          count: 0,
          totalValue: 0,
        };
      }
      acc[status].count += 1;
      acc[status].totalValue += Number(quotation.totalValue ?? 0);
      return acc;
    }, {} as Record<string, { count: number; totalValue: number }>);

    // Convert to array format for charts
    return Object.entries(statusGroups).map(([status, data]) => ({
      status,
      count: data.count,
      totalValue: data.totalValue,
    }));
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
