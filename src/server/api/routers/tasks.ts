import { createTRPCRouter, publicProcedure } from '../trpc';
import { db } from '../../db';
import { z } from 'zod';

export const tasksRouter = createTRPCRouter({
  // Get all upcoming tasks with filtering options
  getAll: publicProcedure
    .input(z.object({
      status: z.enum(['pending', 'in-progress', 'completed']).optional(),
      priority: z.enum(['high', 'medium', 'low']).optional(),
      type: z.enum(['enquiry', 'quotation', 'communication', 'followup']).optional(),
      assignedTo: z.string().optional(),
      limit: z.number().min(1).max(50).default(20),
    }))
    .query(async ({ input }) => {
      const now = new Date();
      const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      // Get tasks from enquiries
      const enquiryTasks = await db.enquiry.findMany({
        where: {
          status: {
            in: ['NEW', 'IN_PROGRESS']
          },
          createdAt: {
            gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          }
        },
        include: {
          customer: { select: { name: true } },
          marketingPerson: { select: { name: true } }
        },
        orderBy: { createdAt: 'desc' },
        take: input.limit
      });

      // Get tasks from quotations
      const quotationTasks = await db.quotation.findMany({
        where: {
          status: {
            in: ['DRAFT', 'PENDING']
          },
          validityPeriod: {
            gte: now,
            lte: thirtyDaysFromNow
          }
        },
        include: {
          enquiry: {
            include: {
              customer: { select: { name: true } }
            }
          }
        },
        orderBy: { validityPeriod: 'asc' },
        take: input.limit
      });

      // Get tasks from communications
      const communicationTasks = await db.communication.findMany({
        where: {
          nextCommunicationDate: {
            gte: now,
            lte: thirtyDaysFromNow
          }
        },
        include: {
          customer: { select: { name: true } },
          contact: { select: { name: true } },
          employee: { select: { name: true } }
        },
        orderBy: { nextCommunicationDate: 'asc' },
        take: input.limit
      });

      // Convert to unified task format
      const allTasks = [
        ...enquiryTasks.map(enquiry => ({
          id: `enquiry-${enquiry.id}`,
          title: `Follow up on ${enquiry.subject}`,
          type: 'enquiry' as const,
          dueDate: new Date(enquiry.createdAt.getTime() + 3 * 24 * 60 * 60 * 1000),
          priority: (enquiry.priority?.toLowerCase() as 'high' | 'medium' | 'low') || 'medium',
          status: 'pending' as const,
          customerName: enquiry.customer.name,
          description: enquiry.description || enquiry.requirements || 'Follow up required',
          assignedTo: enquiry.marketingPerson.name,
          sourceId: enquiry.id,
          sourceType: 'enquiry',
          createdAt: enquiry.createdAt,
          updatedAt: enquiry.updatedAt
        })),
        ...quotationTasks.map(quotation => ({
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
          sourceType: 'quotation',
          createdAt: quotation.createdAt,
          updatedAt: quotation.updatedAt
        })),
        ...communicationTasks.map(communication => ({
          id: `communication-${communication.id}`,
          title: `Follow up: ${communication.subject}`,
          type: 'communication' as const,
          dueDate: communication.nextCommunicationDate || new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
          priority: 'medium' as const,
          status: 'pending' as const,
          customerName: communication.customer.name,
          description: communication.proposedNextAction || communication.description,
          assignedTo: communication.employee.name,
          sourceId: communication.id,
          sourceType: 'communication',
          createdAt: communication.createdAt,
          updatedAt: communication.updatedAt
        }))
      ];

      // Apply filters
      let filteredTasks = allTasks;
      
      if (input.status) {
        filteredTasks = filteredTasks.filter(task => task.status === input.status);
      }
      
      if (input.priority) {
        filteredTasks = filteredTasks.filter(task => task.priority === input.priority);
      }
      
      if (input.type) {
        filteredTasks = filteredTasks.filter(task => task.type === input.type);
      }
      
      if (input.assignedTo) {
        filteredTasks = filteredTasks.filter(task => 
          task.assignedTo?.toLowerCase().includes(input.assignedTo!.toLowerCase())
        );
      }

      // Sort by priority and due date
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      
      return filteredTasks.sort((a, b) => {
        const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
        if (priorityDiff !== 0) return priorityDiff;
        return a.dueDate.getTime() - b.dueDate.getTime();
      });
    }),

  // Get task statistics
  getStats: publicProcedure.query(async () => {
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const [pendingEnquiries, inProgressEnquiries, pendingQuotations, pendingCommunications] = await Promise.all([
      db.enquiry.count({
        where: {
          status: 'NEW',
          createdAt: {
            gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          }
        }
      }),
      db.enquiry.count({
        where: {
          status: 'IN_PROGRESS',
          createdAt: {
            gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          }
        }
      }),
      db.quotation.count({
        where: {
          status: {
            in: ['DRAFT', 'PENDING']
          },
          validityPeriod: {
            gte: now,
            lte: thirtyDaysFromNow
          }
        }
      }),
      db.communication.count({
        where: {
          nextCommunicationDate: {
            gte: now,
            lte: thirtyDaysFromNow
          }
        }
      })
    ]);

    return {
      totalPending: pendingEnquiries + inProgressEnquiries + pendingQuotations + pendingCommunications,
      pendingEnquiries,
      inProgressEnquiries,
      pendingQuotations,
      pendingCommunications
    };
  }),

  // Mark task as completed (this would update the source record)
  markCompleted: publicProcedure
    .input(z.object({
      taskId: z.string(),
      notes: z.string().optional()
    }))
    .mutation(async ({ input }) => {
      const [sourceType, sourceId] = input.taskId.split('-');
      
      if (sourceType === 'enquiry') {
        // Update enquiry status to QUOTED or CLOSED
        await db.enquiry.update({
          where: { id: parseInt(sourceId) },
          data: { 
            status: 'QUOTED',
            notes: input.notes ? `${input.notes}\n\nTask completed on ${new Date().toISOString()}` : undefined
          }
        });
      } else if (sourceType === 'quotation') {
        // Update quotation status to SUBMITTED
        await db.quotation.update({
          where: { id: sourceId },
          data: { 
            status: 'SUBMITTED',
            specialInstructions: input.notes ? `${input.notes}\n\nTask completed on ${new Date().toISOString()}` : undefined
          }
        });
      } else if (sourceType === 'communication') {
        // Update communication with completion notes
        await db.communication.update({
          where: { id: sourceId },
          data: { 
            description: input.notes ? `${input.description}\n\nTask completed on ${new Date().toISOString()}` : undefined
          }
        });
      }

      return { success: true, message: 'Task marked as completed' };
    })
});
