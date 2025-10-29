
import { createTRPCRouter, protectedProcedure, publicProcedure } from '../trpc';
import { db } from '../../db';
import { z } from 'zod';

// Define the unified task type for the upcoming tasks
type UnifiedTask = {
  type: 'QUOTATION' | 'COMMUNICATION';
  dueDate: Date;
  customerName: string;
  taskDescription: string;
  status: string;
  link: string;
  id: string;
  priority: 'high' | 'medium' | 'low';
};

export const tasksRouter = createTRPCRouter({
  // This procedure fetches all actionable tasks with filtering support
  getUpcoming: publicProcedure
    .input(z.object({
      search: z.string().optional(),
      type: z.enum(['QUOTATION', 'COMMUNICATION']).optional(),
      status: z.enum(['overdue', 'today', 'upcoming']).optional(),
      priority: z.enum(['high', 'medium', 'low']).optional(),
    }))
    .query(async ({ input }) => {
    const today = new Date();

    // 1. Fetch active quotations (excluding completed ones)
    const activeQuotations = await db.quotation.findMany({
      where: {
        NOT: {
          status: { in: ['WON', 'LOST'] },
        },
      },
      include: {
        enquiry: {
          include: {
            customer: {
              select: { name: true, id: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // 2. Fetch all communications (including future ones for management)
    const allCommunications = await db.communication.findMany({
      where: {
        nextCommunicationDate: {
          not: null, // Only communications with scheduled dates
        },
      },
      include: {
        customer: {
          select: { name: true, id: true },
        },
        contact: {
          select: { name: true, designation: true },
        },
      },
      orderBy: { nextCommunicationDate: 'asc' },
    });

    // Fetch enquiry information for communications that have enquiryRelated
    const communicationsWithEnquiry = await Promise.all(
      allCommunications.map(async (comm) => {
        if (comm.enquiryRelated) {
          const enquiry = await db.enquiry.findUnique({
            where: { id: parseInt(comm.enquiryRelated) },
            select: {
              id: true,
              quotationNumber: true,
              subject: true,
            },
          });
          return {
            ...comm,
            enquiry: enquiry,
          };
        }
        return {
          ...comm,
          enquiry: null,
        };
      })
    );

    // 3. Transform both data sets into a unified "Task" format
    const quotationTasks: UnifiedTask[] = activeQuotations.map(q => {
      // Determine priority based on status and age
      let priority: 'high' | 'medium' | 'low' = 'medium';
      if (q.status === 'LIVE') priority = 'high';
      else if (q.status === 'DEAD') priority = 'low';
      
      // Use validity period or creation date as due date
      const dueDate = q.validityPeriod ?? q.createdAt;
      
      return {
        type: 'QUOTATION' as const,
        dueDate,
        customerName: q.enquiry?.customer?.name ?? 'Unknown Customer',
        taskDescription: `Quotation #${q.quotationNumber}`,
        status: q.status,
        link: `/quotations/${q.id}`,
        id: q.id,
        priority,
      };
    });

    const communicationTasks: UnifiedTask[] = communicationsWithEnquiry.map(c => {
      const meetingType = c.type === 'VIRTUAL_MEETING' ? 'Video Call' :
                         c.type === 'TELEPHONIC' ? 'Phone Call' :
                         c.type === 'EMAIL' ? 'Email' :
                         c.type === 'PLANT_VISIT' ? 'Plant Visit' :
                         c.type === 'OFFICE_VISIT' ? 'Office Visit' : c.type;
      
      const contactInfo = c.contact ? ` with ${c.contact.name}` : '';
      const quotationInfo = c.enquiry?.quotationNumber ? ` (Q#${c.enquiry.quotationNumber})` : '';
      const taskDescription = `${meetingType}${contactInfo}${quotationInfo} - ${c.proposedNextAction ?? c.subject ?? 'Follow up required'}`;
      
      // Determine priority and status based on due date
      const dueDate = c.nextCommunicationDate!;
      const isOverdue = dueDate < today;
      const isToday = dueDate.toDateString() === today.toDateString();
      
      let priority: 'high' | 'medium' | 'low' = 'medium';
      if (isOverdue) priority = 'high';
      else if (isToday) priority = 'high';
      else if (dueDate.getTime() - today.getTime() <= 7 * 24 * 60 * 60 * 1000) priority = 'medium';
      else priority = 'low';
      
      let status = 'SCHEDULED';
      if (isOverdue) status = 'OVERDUE';
      else if (isToday) status = 'DUE_TODAY';
      
      return {
        type: 'COMMUNICATION' as const,
        dueDate,
        customerName: c.customer?.name ?? 'Unknown Customer',
        taskDescription,
        status,
        link: `/communications`,
        id: c.id,
        priority,
      };
    });

    // 4. Merge and sort the tasks by due date
    let allTasks = [...quotationTasks, ...communicationTasks];
    allTasks.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

    // 5. Apply filters
    if (input.search) {
      const searchLower = input.search.toLowerCase();
      allTasks = allTasks.filter(task => 
        task.customerName.toLowerCase().includes(searchLower) ||
        task.taskDescription.toLowerCase().includes(searchLower) ||
        task.status.toLowerCase().includes(searchLower) ||
        task.type.toLowerCase().includes(searchLower)
      );
    }

    if (input.type) {
      allTasks = allTasks.filter(task => task.type === input.type);
    }

    if (input.priority) {
      allTasks = allTasks.filter(task => task.priority === input.priority);
    }

    if (input.status) {
      const today = new Date();
      allTasks = allTasks.filter(task => {
        const taskDate = new Date(task.dueDate);
        const isOverdue = taskDate < today;
        const isToday = taskDate.toDateString() === today.toDateString();
        
        switch (input.status) {
          case 'overdue':
            return isOverdue;
          case 'today':
            return isToday;
          case 'upcoming':
            return !isOverdue && !isToday;
          default:
            return true;
        }
      });
    }

    return allTasks;
  }),

  // Get task statistics - moved from frontend calculations
  getTaskStats: publicProcedure.query(async () => {
    const today = new Date();
    
    // Get all tasks first
    const allTasks = await db.$transaction(async (prisma) => {
      // Get quotations
      const activeQuotations = await prisma.quotation.findMany({
        where: {
          NOT: {
            status: { in: ['WON', 'LOST'] },
          },
        },
        select: {
          id: true,
          status: true,
          validityPeriod: true,
          createdAt: true,
        },
      });

      // Get communications
      const allCommunications = await prisma.communication.findMany({
        where: {
          nextCommunicationDate: {
            not: null,
          },
        },
        select: {
          id: true,
          nextCommunicationDate: true,
        },
      });

      // Transform to unified format
      const quotationTasks = activeQuotations.map(q => {
        const dueDate = q.validityPeriod ?? q.createdAt;
        const isOverdue = dueDate < today;
        const isToday = dueDate.toDateString() === today.toDateString();
        
        let priority: 'high' | 'medium' | 'low' = 'medium';
        if (q.status === 'LIVE') priority = 'high';
        else if (q.status === 'DEAD') priority = 'low';
        
        return {
          type: 'QUOTATION' as const,
          dueDate,
          priority,
          isOverdue,
          isToday,
        };
      });

      const communicationTasks = allCommunications.map(c => {
        const dueDate = c.nextCommunicationDate!;
        const isOverdue = dueDate < today;
        const isToday = dueDate.toDateString() === today.toDateString();
        
        let priority: 'high' | 'medium' | 'low' = 'medium';
        if (isOverdue) priority = 'high';
        else if (isToday) priority = 'high';
        else if (dueDate.getTime() - today.getTime() <= 7 * 24 * 60 * 60 * 1000) priority = 'medium';
        else priority = 'low';
        
        return {
          type: 'COMMUNICATION' as const,
          dueDate,
          priority,
          isOverdue,
          isToday,
        };
      });

      return [...quotationTasks, ...communicationTasks];
    });

    // Calculate statistics
    const total = allTasks.length;
    const overdue = allTasks.filter(task => task.isOverdue).length;
    const todayCount = allTasks.filter(task => task.isToday).length;
    const upcoming = allTasks.filter(task => !task.isOverdue && !task.isToday).length;

    return {
      total,
      overdue,
      today: todayCount,
      upcoming,
    };
  }),

  // Keep existing endpoints for backward compatibility
  getAll: protectedProcedure
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
          in: ['LIVE', 'RCD']
        },
          createdAt: {
            gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          }
        },
        include: {
          company: { select: { name: true } },
          marketingPerson: { select: { name: true } }
        },
        orderBy: { createdAt: 'desc' },
        take: input.limit
      });

      // Get tasks from quotations
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
        ...enquiryTasks.map((enquiry) => ({
          id: `enquiry-${enquiry.id}`,
          title: `Follow up on ${enquiry.subject}`,
          type: 'enquiry' as const,
          dueDate: new Date(enquiry.createdAt.getTime() + 3 * 24 * 60 * 60 * 1000),
          priority: (enquiry.priority?.toLowerCase() as 'high' | 'medium' | 'low') ?? 'medium',
          status: 'pending' as const,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          customerName: (enquiry.company && typeof enquiry.company === 'object' && 'name' in enquiry.company ? String(enquiry.company.name) : '') || 'Unknown Customer',
          description: enquiry.description ?? enquiry.requirements ?? 'Follow up required',
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          assignedTo: (enquiry.marketingPerson && typeof enquiry.marketingPerson === 'object' && 'name' in enquiry.marketingPerson ? String(enquiry.marketingPerson.name) : '') || 'Unassigned',
          sourceId: enquiry.id,
          sourceType: 'enquiry',
          createdAt: enquiry.createdAt,
          updatedAt: enquiry.updatedAt
        })),
        ...quotationTasks.map((quotation) => ({
          id: `quotation-${quotation.id}`,
          title: `Complete quotation ${quotation.quotationNumber}`,
          type: 'quotation' as const,
          dueDate: quotation.validityPeriod ?? new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
          priority: 'medium' as const,
          status: quotation.status === 'LIVE' ? 'pending' as const : 'in-progress' as const,
          customerName: quotation.enquiry?.customer?.name ?? 'Unknown Customer',
          description: `Quotation ${quotation.status.toLowerCase()} - needs completion`,
          assignedTo: 'Marketing Team',
          sourceId: quotation.id,
          sourceType: 'quotation',
          createdAt: quotation.createdAt,
          updatedAt: quotation.updatedAt
        })),
        ...communicationTasks.map((communication) => ({
          id: `communication-${communication.id}`,
          title: `Follow up: ${communication.subject}`,
          type: 'communication' as const,
          dueDate: communication.nextCommunicationDate ?? new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
          priority: 'medium' as const,
          status: 'pending' as const,
          customerName: communication.customer?.name ?? 'Unknown Customer',
          description: communication.proposedNextAction ?? communication.description,
          assignedTo: communication.employee?.name ?? 'Unassigned',
          sourceId: communication.id,
          sourceType: 'communication',
          createdAt: communication.createdAt,
          updatedAt: communication.createdAt
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
        filteredTasks = filteredTasks.filter(task => {
          const assignedToStr = String(task.assignedTo ?? '');
          return assignedToStr.toLowerCase().includes(input.assignedTo!.toLowerCase());
        });
      }

      // Sort by priority and due date
      const priorityOrder: Record<string, number> = { high: 3, medium: 2, low: 1 };
      
      return filteredTasks.sort((a, b) => {
        const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
        if (priorityDiff !== 0) return priorityDiff;
        return a.dueDate.getTime() - b.dueDate.getTime();
      });
    }),

  // Get task statistics
  getStats: protectedProcedure.query(async () => {
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const [pendingEnquiries, inProgressEnquiries, pendingQuotations, pendingCommunications] = await Promise.all([
      db.enquiry.count({
        where: {
          status: 'LIVE',
          createdAt: {
            gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          }
        }
      }),
      db.enquiry.count({
        where: {
          status: 'RCD',
          createdAt: {
            gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          }
        }
      }),
      db.quotation.count({
        where: {
          status: {
            in: ['LIVE']
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
  markCompleted: protectedProcedure
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
            status: 'LIVE',
            notes: input.notes ? `${input.notes}\n\nTask completed on ${new Date().toISOString()}` : undefined
          }
        });
      } else if (sourceType === 'quotation') {
        // Update quotation status to LIVE
        await db.quotation.update({
          where: { id: sourceId },
          data: { 
            status: 'LIVE',
            specialInstructions: input.notes ? `${input.notes}\n\nTask completed on ${new Date().toISOString()}` : undefined
          }
        });
      } else if (sourceType === 'communication') {
        // Update communication with completion notes
        await db.communication.update({
          where: { id: sourceId },
          data: { 
            description: input.notes ? `${input.notes}\n\nTask completed on ${new Date().toISOString()}` : undefined
          }
        });
      }

      return { success: true, message: 'Task marked as completed' };
    }),

  // Update quotation status
  updateQuotationStatus: publicProcedure
    .input(z.object({
      quotationId: z.string(),
      status: z.enum(['LIVE', 'WON', 'LOST', 'BUDGETARY', 'DEAD']),
      lostReason: z.string().optional(),
      purchaseOrderNumber: z.string().optional()
    }))
    .mutation(async ({ input }) => {
      const updateData: { 
        status: 'LIVE' | 'WON' | 'LOST' | 'BUDGETARY' | 'DEAD'; 
        lostReason?: string; 
        purchaseOrderNumber?: string; 
      } = { status: input.status };
      
      if (input.status === 'LOST' && input.lostReason) {
        updateData.lostReason = input.lostReason;
      }
      
      if (input.status === 'WON' && input.purchaseOrderNumber) {
        updateData.purchaseOrderNumber = input.purchaseOrderNumber;
      }

      await db.quotation.update({
        where: { id: input.quotationId },
        data: updateData
      });

      return { success: true, message: 'Quotation status updated successfully' };
    }),

  // Reschedule communication/meeting
  rescheduleCommunication: publicProcedure
    .input(z.object({
      communicationId: z.string(),
      newDate: z.string(), // ISO date string
      newTime: z.string().optional(), // Time string if needed
      reason: z.string().optional()
    }))
    .mutation(async ({ input }) => {
      const newDateTime = new Date(input.newDate);
      if (input.newTime) {
        const [hours, minutes] = input.newTime.split(':');
        newDateTime.setHours(parseInt(hours), parseInt(minutes));
      }

      await db.communication.update({
        where: { id: input.communicationId },
        data: { 
          nextCommunicationDate: newDateTime,
          description: input.reason 
            ? `${input.reason}\n\nRescheduled to ${newDateTime.toLocaleString()}`
            : undefined
        }
      });

      return { success: true, message: 'Communication rescheduled successfully' };
    }),

  // Get detailed communication info for meeting management
  getCommunicationDetails: publicProcedure
    .input(z.object({
      communicationId: z.string()
    }))
    .query(async ({ input }) => {
      const communication = await db.communication.findUnique({
        where: { id: input.communicationId },
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              isNew: true,
              createdAt: true,
              updatedAt: true
            }
          },
          contact: {
            select: {
              id: true,
              name: true,
              designation: true,
              officialCellNumber: true,
              personalCellNumber: true
            }
          },
          employee: {
            select: {
              id: true,
              name: true,
              role: true
            }
          }
        }
      });

      return communication;
    }),

  // Get quotation details for status updates
  getQuotationDetails: publicProcedure
    .input(z.object({
      quotationId: z.string()
    }))
    .query(async ({ input }) => {
      const quotation = await db.quotation.findUnique({
        where: { id: input.quotationId },
        include: {
          enquiry: {
            include: {
              customer: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          }
        }
      });

      return quotation;
    })
});
