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
    return lostReasons
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
    const monthlyData = monthlyTrends.reduce((acc, trend) => {
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

  // Procedure to get upcoming tasks from various sources
  getUpcomingTasks: publicProcedure.query(async () => {
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    // Get tasks from enquiries that need follow-up
    const enquiryTasks = await db.enquiry.findMany({
      where: {
        status: {
          in: ['NEW', 'IN_PROGRESS']
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
          in: ['DRAFT', 'LIVE']
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
    const enquiryTaskList = enquiryTasks.map(enquiry => ({
      id: `enquiry-${enquiry.id}`,
      title: `Follow up on ${enquiry.subject}`,
      type: 'enquiry' as const,
      dueDate: new Date(enquiry.createdAt.getTime() + 3 * 24 * 60 * 60 * 1000), // 3 days after creation
      priority: (enquiry.priority?.toLowerCase() as 'high' | 'medium' | 'low') || 'medium',
      status: 'pending' as const,
      customerName: enquiry.customer.name,
      description: enquiry.description || enquiry.requirements || 'Follow up required',
      assignedTo: enquiry.marketingPerson.name,
      sourceId: enquiry.id,
      sourceType: 'enquiry'
    }));

    // Convert quotations to tasks
    const quotationTaskList = quotationTasks.map(quotation => ({
      id: `quotation-${quotation.id}`,
      title: `Complete quotation ${quotation.quotationNumber}`,
      type: 'quotation' as const,
      dueDate: quotation.validityPeriod || new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
      priority: 'medium' as const,
      status: quotation.status === 'DRAFT' ? 'pending' as const : 'in-progress' as const,
      customerName: quotation.enquiry.customer.name,
      description: `Quotation ${quotation.status.toLowerCase()} - needs completion`,
      assignedTo: 'Marketing Team',
      sourceId: quotation.id,
      sourceType: 'quotation'
    }));

    // Convert communications to tasks
    const communicationTaskList = communicationTasks.map(communication => ({
      id: `communication-${communication.id}`,
      title: `Follow up: ${communication.subject}`,
      type: 'communication' as const,
      dueDate: communication.nextCommunicationDate || new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
      priority: 'medium' as const,
      status: 'pending' as const,
      customerName: communication.customer.name,
      description: communication.proposedNextAction || communication.description,
      assignedTo: communication.employee?.name || 'Unassigned',
      sourceId: communication.id,
      sourceType: 'communication'
    }));

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
