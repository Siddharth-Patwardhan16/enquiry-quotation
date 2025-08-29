import { z } from 'zod';
import { createTRPCRouter, publicProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import { db } from '../../db';

// Validation schemas
const CreateCommunicationSchema = z.object({
  date: z.string(),
  customerId: z.string(),
  subject: z.string(),
  enquiryRelated: z.string().optional(),
  generalDescription: z.string().optional(),
  briefDescription: z.string(),
  communicationType: z.enum(['TELEPHONIC', 'VIRTUAL_MEETING', 'EMAIL', 'PLANT_VISIT', 'OFFICE_VISIT']),
  nextCommunicationDate: z.string().optional(),
  proposedNextAction: z.string().optional(),
  contactId: z.string().optional(), // Made optional for backward compatibility
});

const UpdateCommunicationSchema = CreateCommunicationSchema.extend({
  id: z.string(),
});

export const communicationRouter = createTRPCRouter({
  // Get all communications with related data
  getAll: publicProcedure.query(async () => {
    try {
      return await db.communication.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              officeAddress: true,
              officeCity: true,
              officeName: true,
              plantName: true,
              plantAddress: true,
              plantCity: true,
              officeState: true,
              officeCountry: true,
              officeReceptionNumber: true,
            },
          },
          contact: {
            select: {
              id: true,
              name: true,
              designation: true,
              officialCellNumber: true,
              personalCellNumber: true,
              locationType: true,
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
    } catch (error) {
      console.error('Error fetching communications:', error);
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
            customer: {
              select: {
                id: true,
                name: true,
                officeAddress: true,
                officeCity: true,
                officeState: true,
                officeCountry: true,
                officeReceptionNumber: true,
              },
            },
            contact: {
              select: {
                id: true,
                name: true,
                designation: true,
                officialCellNumber: true,
                personalCellNumber: true,
                locationType: true,
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
        
        console.error('Error fetching communication:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch communication',
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

        if (!employee) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'No marketing employee found in the database. Please add an employee first.',
          });
        }

        const communication = await db.communication.create({
          data: {
            subject: input.subject,
            description: input.briefDescription,
            type: input.communicationType,
            nextCommunicationDate: input.nextCommunicationDate ? new Date(input.nextCommunicationDate) : null,
            proposedNextAction: input.proposedNextAction,
            customerId: input.customerId,
            ...(input.contactId && { contactId: input.contactId }),
            employeeId: employee.id,
          },
          include: {
            customer: {
              select: {
                id: true,
                name: true,
                officeAddress: true,
                officeCity: true,
                officeState: true,
                officeCountry: true,
                officeReceptionNumber: true,
              },
            },
            contact: {
              select: {
                id: true,
                name: true,
                designation: true,
                officialCellNumber: true,
                personalCellNumber: true,
                locationType: true,
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
        console.error('Error creating communication:', error);
        
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
            description: updateData.briefDescription,
            type: updateData.communicationType,
            nextCommunicationDate: updateData.nextCommunicationDate ? new Date(updateData.nextCommunicationDate) : null,
            proposedNextAction: updateData.proposedNextAction,
            customerId: updateData.customerId,
            contactId: updateData.contactId || null, // Handle optional contactId
          },
          include: {
            customer: {
              select: {
                id: true,
                name: true,
                officeAddress: true,
                officeCity: true,
                officeState: true,
                officeCountry: true,
                officeReceptionNumber: true,
              },
            },
            contact: {
              select: {
                id: true,
                name: true,
                designation: true,
                officialCellNumber: true,
                personalCellNumber: true,
                locationType: true,
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
        console.error('Error updating communication:', error);
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
      } catch (error) {
        console.error('Error deleting communication:', error);
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
            customer: {
              select: {
                id: true,
                name: true,
                officeAddress: true,
                officeCity: true,
                officeState: true,
                officeCountry: true,
                officeReceptionNumber: true,
              },
            },
            contact: {
              select: {
                id: true,
                name: true,
                designation: true,
                officialCellNumber: true,
                personalCellNumber: true,
                locationType: true,
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
      } catch (error) {
        console.error('Error fetching customer communications:', error);
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
            customer: {
              select: {
                id: true,
                name: true,
                officeAddress: true,
                officeCity: true,
                officeState: true,
                officeCountry: true,
                officeReceptionNumber: true,
              },
            },
            contact: {
              select: {
                id: true,
                name: true,
                designation: true,
                officialCellNumber: true,
                personalCellNumber: true,
                locationType: true,
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
      } catch (error) {
        console.error('Error fetching communications by type:', error);
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
              officeAddress: true,
              officeCity: true,
              officeState: true,
              officeCountry: true,
              officeReceptionNumber: true,
            },
          },
          contact: {
            select: {
              id: true,
              name: true,
              designation: true,
              officialCellNumber: true,
              personalCellNumber: true,
              locationType: true,
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
    } catch (error) {
      console.error('Error fetching upcoming communications:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch upcoming communications',
      });
    }
  }),
});

