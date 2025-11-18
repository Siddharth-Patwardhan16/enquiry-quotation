import { z } from 'zod';
import { createTRPCRouter, publicProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import { db } from '../../db';

// Validation schemas
const CreateCommunicationSchema = z.object({
  date: z.string().optional(),
  companyId: z.string().optional(),
  subject: z.string().optional(),
  enquiryRelated: z.string().optional(),
  enquiryId: z.number().optional(),
  description: z.string().optional(),
  type: z.enum(['TELEPHONIC', 'VIRTUAL_MEETING', 'EMAIL', 'PLANT_VISIT', 'OFFICE_VISIT']),
  nextCommunicationDate: z.string().optional(),
  proposedNextAction: z.string().optional(),
  contactId: z.string().optional(), // Made optional for backward compatibility
});

const UpdateCommunicationSchema = CreateCommunicationSchema.extend({
  id: z.string(),
});

export const communicationRouter = createTRPCRouter({
  // Get all communications with related data and filtering support
  getAll: publicProcedure
    .input(z.object({
      search: z.string().optional(),
      type: z.enum(['TELEPHONIC', 'VIRTUAL_MEETING', 'EMAIL', 'PLANT_VISIT', 'OFFICE_VISIT']).optional(),
      customerId: z.string().optional(),
      hasQuotation: z.enum(['with', 'without']).optional(),
    }))
    .query(async ({ input }) => {
    try {
      // Build where clause for filtering
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const where: any = {};
      
      if (input.type) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        where.type = input.type;
      }
      
      if (input.customerId) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        where.companyId = input.customerId;
      }

      const communications = await db.communication.findMany({
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        where,
        orderBy: { createdAt: 'desc' },
        include: {
          company: {
            select: {
              id: true,
              name: true,
              createdAt: true,
              updatedAt: true,
            },
          },
          contactPerson: {
            select: {
              id: true,
              name: true,
              designation: true,
              phoneNumber: true,
              emailId: true,
            },
          },
          employee: {
            select: {
              id: true,
              name: true,
              role: true,
            },
          },
        },
      });

      // Fetch enquiry information for communications that have enquiryRelated
      let communicationsWithEnquiry = await Promise.all(
        communications.map(async (comm) => {
          if (comm.enquiryRelated) {
            const enquiry = await db.enquiry.findUnique({
              where: { id: parseInt(comm.enquiryRelated) },
              select: {
                id: true,
                quotationNumber: true,
                subject: true,
                office: {
                  select: {
                    id: true,
                    name: true,
                    contactPersons: {
                      select: {
                        id: true,
                        name: true,
                        designation: true,
                        phoneNumber: true,
                        emailId: true,
                        isPrimary: true,
                      },
                    },
                  },
                },
                plant: {
                  select: {
                    id: true,
                    name: true,
                    contactPersons: {
                      select: {
                        id: true,
                        name: true,
                        designation: true,
                        phoneNumber: true,
                        emailId: true,
                        isPrimary: true,
                      },
                    },
                  },
                },
              },
            });
            
            // Fetch quotation status and totalValue if quotationNumber exists
            let quotationStatus: string | null = null;
            let quotationTotalValue: number | null = null;
            if (enquiry?.quotationNumber) {
              const quotation = await db.quotation.findUnique({
                where: { quotationNumber: enquiry.quotationNumber },
                select: { 
                  status: true,
                  totalValue: true,
                },
              });
              quotationStatus = quotation?.status ?? null;
              quotationTotalValue = quotation?.totalValue ? Number(quotation.totalValue) : null;
            }
            
            return {
              ...comm,
              enquiry: enquiry ? {
                ...enquiry,
                quotationStatus,
                quotationTotalValue,
              } : null,
            };
          }
          return {
            ...comm,
            enquiry: null,
          };
        })
      );

      // Apply client-side filters that require enquiry data
      if (input.search) {
        const searchLower = input.search.toLowerCase();
        communicationsWithEnquiry = communicationsWithEnquiry.filter(comm => {
          const subject: string = comm.subject ?? '';
          const customerName: string = comm.company?.name ?? '';
          const contactName: string = comm.contactPerson?.name ?? 
            comm.enquiry?.office?.contactPersons?.[0]?.name ?? 
            comm.enquiry?.plant?.contactPersons?.[0]?.name ?? '';
          const description: string = comm.description ?? '';
          const quotationNumber: string = comm.enquiry?.quotationNumber ?? '';
          
          return subject.toLowerCase().includes(searchLower) ||
                 customerName.toLowerCase().includes(searchLower) ||
                 contactName.toLowerCase().includes(searchLower) ||
                 description.toLowerCase().includes(searchLower) ||
                 quotationNumber.toLowerCase().includes(searchLower);
        });
      }

      if (input.hasQuotation) {
        if (input.hasQuotation === 'with') {
          communicationsWithEnquiry = communicationsWithEnquiry.filter(comm => 
            comm.enquiry?.quotationNumber ?? false
          );
        } else if (input.hasQuotation === 'without') {
          communicationsWithEnquiry = communicationsWithEnquiry.filter(comm => 
            !comm.enquiry?.quotationNumber
          );
        }
      }

      return communicationsWithEnquiry;
    } catch {
      // Error fetching communications
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch communications',
      });
    }
  }),

  // Get communication by ID
  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      try {
        const communication = await db.communication.findUnique({
          where: { id: input.id },
          include: {
            company: {
              select: {
                id: true,
                name: true,
                createdAt: true,
                updatedAt: true,
              },
            },
            contact: {
              select: {
                id: true,
                name: true,
                designation: true,
                officialCellNumber: true,
                personalCellNumber: true,
              },
            },
            employee: {
              select: {
                id: true,
                name: true,
                role: true,
              },
            },
          },
        });

        if (!communication) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Communication not found',
          });
        }

        return communication;
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        
        // Error fetching communication
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch communication',
        });
      }
    }),

  // Get communications by enquiry ID
  getCommunicationsByEnquiryId: publicProcedure
    .input(z.object({ enquiryId: z.number() }))
    .query(async ({ input }) => {
      try {
        const communications = await db.communication.findMany({
          where: { enquiryId: input.enquiryId },
          orderBy: { createdAt: 'desc' },
          include: {
            company: {
              select: {
                id: true,
                name: true,
              },
            },
            customer: {
              select: {
                id: true,
                name: true,
              },
            },
            contact: {
              select: {
                id: true,
                name: true,
                designation: true,
              },
            },
            employee: {
              select: {
                id: true,
                name: true,
                role: true,
              },
            },
          },
        });

        return communications;
      } catch {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch communications for enquiry',
        });
      }
    }),

  // Create new communication
  create: publicProcedure
    .input(CreateCommunicationSchema)
    .mutation(async ({ input }) => {
      try {
        // Find the first available employee (preferably marketing role)
        const employee = await db.employee.findFirst({
          where: { role: 'MARKETING' },
        });

        // If enquiryId is provided, fetch enquiry to get companyId/customerId if not provided
        let companyId = input.companyId;
        let customerId: string | undefined = undefined;

        if (input.enquiryId) {
          const enquiry = await db.enquiry.findUnique({
            where: { id: input.enquiryId },
            select: {
              companyId: true,
              customerId: true,
              subject: true,
            },
          });

          if (enquiry) {
            // Use enquiry's companyId/customerId if not provided in input
            if (!companyId && enquiry.companyId) {
              companyId = enquiry.companyId;
            }
            if (!input.companyId && enquiry.customerId) {
              customerId = enquiry.customerId;
            }
          }
        }

        const communication = await db.communication.create({
          data: {
            subject: input.subject ?? '',
            description: input.description ?? '',
            type: input.type ?? 'TELEPHONIC',
            enquiryRelated: input.enquiryRelated,
            enquiryId: input.enquiryId ?? null,
            nextCommunicationDate: input.nextCommunicationDate ? new Date(input.nextCommunicationDate) : null,
            proposedNextAction: input.proposedNextAction,
            companyId: companyId,
            ...(customerId && { customerId }),
            ...(input.contactId && { contactId: input.contactId }),
            employeeId: employee?.id ?? null,
          },
          include: {
            company: {
              select: {
                id: true,
                name: true,
                createdAt: true,
                updatedAt: true,
              },
            },
            contact: {
              select: {
                id: true,
                name: true,
                designation: true,
                officialCellNumber: true,
                personalCellNumber: true,
              },
            },
            employee: {
              select: {
                id: true,
                name: true,
                role: true,
              },
            },
          },
        });

        return communication;
      } catch (error) {
        // Error creating communication
        
        // Provide more specific error messages
        if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'A communication with this information already exists.',
          });
        }
        
        if (error && typeof error === 'object' && 'code' in error && error.code === 'P2003') {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Invalid customer or contact ID provided.',
          });
        }
        
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to create communication: ${error && typeof error === 'object' && 'message' in error ? String(error.message) : 'Unknown error'}`,
        });
      }
    }),

  // Update communication
  update: publicProcedure
    .input(UpdateCommunicationSchema)
    .mutation(async ({ input }) => {
      try {
        const { id, ...updateData } = input;

        const communication = await db.communication.update({
          where: { id },
          data: {
            subject: updateData.subject,
            description: updateData.description,
            type: updateData.type,
            enquiryRelated: updateData.enquiryRelated,
            nextCommunicationDate: updateData.nextCommunicationDate ? new Date(updateData.nextCommunicationDate) : null,
            proposedNextAction: updateData.proposedNextAction,
            companyId: updateData.companyId,
            contactId: updateData.contactId ?? null, // Handle optional contactId
          },
          include: {
            company: {
              select: {
                id: true,
                name: true,
                createdAt: true,
                updatedAt: true,
              },
            },
            contact: {
              select: {
                id: true,
                name: true,
                designation: true,
                officialCellNumber: true,
                personalCellNumber: true,
              },
            },
            employee: {
              select: {
                id: true,
                name: true,
                role: true,
              },
            },
          },
        });

        return communication;
      } catch {
        // Error updating communication
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update communication',
        });
      }
    }),

  // Delete communication
  delete: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      try {
        await db.communication.delete({
          where: { id: input.id },
        });

        return { success: true };
      } catch {
        // Error deleting communication
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to delete communication',
        });
      }
    }),

  // Get communications by customer
  getByCustomer: publicProcedure
    .input(z.object({ customerId: z.string() }))
    .query(async ({ input }) => {
      try {
        return await db.communication.findMany({
          where: { customerId: input.customerId },
          orderBy: { createdAt: 'desc' },
          include: {
            company: {
              select: {
                id: true,
                name: true,
                createdAt: true,
                updatedAt: true,
              },
            },
            contact: {
              select: {
                id: true,
                name: true,
                designation: true,
                officialCellNumber: true,
                personalCellNumber: true,
              },
            },
            employee: {
              select: {
                id: true,
                name: true,
                role: true,
              },
            },
          },
        });
      } catch {
        // Error fetching customer communications
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch customer communications',
        });
      }
    }),

  // Get communications by type
  getByType: publicProcedure
    .input(z.object({ 
      type: z.enum(['TELEPHONIC', 'VIRTUAL_MEETING', 'EMAIL', 'PLANT_VISIT', 'OFFICE_VISIT']) 
    }))
    .query(async ({ input }) => {
      try {
        return await db.communication.findMany({
          where: { type: input.type },
          orderBy: { createdAt: 'desc' },
          include: {
            company: {
              select: {
                id: true,
                name: true,
                createdAt: true,
                updatedAt: true,
              },
            },
            contact: {
              select: {
                id: true,
                name: true,
                designation: true,
                officialCellNumber: true,
                personalCellNumber: true,
              },
            },
            employee: {
              select: {
                id: true,
                name: true,
                role: true,
              },
            },
          },
        });
      } catch {
        // Error fetching communications by type
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch communications by type',
        });
      }
    }),

  // Get upcoming communications (with nextCommunicationDate)
  getUpcoming: publicProcedure.query(async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      return await db.communication.findMany({
        where: {
          nextCommunicationDate: {
            gte: today,
          },
        },
        orderBy: { nextCommunicationDate: 'asc' },
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              isNew: true,
              createdAt: true,
              updatedAt: true,
            },
          },
          contactPerson: {
            select: {
              id: true,
              name: true,
              designation: true,
              phoneNumber: true,
              emailId: true,
            },
          },
          employee: {
            select: {
              id: true,
              name: true,
              role: true,
            },
          },
        },
      });
    } catch {
      // Error fetching upcoming communications
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch upcoming communications',
      });
    }
  }),

  // Update communication status
  updateStatus: publicProcedure
    .input(z.object({
      id: z.string(),
      status: z.enum(['SCHEDULED', 'COMPLETED', 'CANCELLED', 'RESCHEDULED', 'FOLLOW_UP_REQUIRED', 'WON', 'LOST']),
    }))
    .mutation(async ({ input }) => {
      try {
        const updatedCommunication = await db.communication.update({
          where: { id: input.id },
          data: { status: input.status },
          include: {
            customer: {
              select: {
                id: true,
                name: true,
              },
            },
            contact: {
              select: {
                id: true,
                name: true,
                designation: true,
              },
            },
          },
        });

        return updatedCommunication;
      } catch {
        // Error updating communication status
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update communication status',
        });
      }
    }),
});

