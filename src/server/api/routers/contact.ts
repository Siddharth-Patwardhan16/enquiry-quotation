import { z } from 'zod';
import { createTRPCRouter, publicProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import { db } from '../../db';

// Validation schemas
const CreateContactSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  designation: z.string().optional(),
  officialCellNumber: z.string().optional(),
  personalCellNumber: z.string().optional(),
  locationType: z.enum(['OFFICE', 'PLANT']),
  locationAddress: z.string().optional(),
  customerId: z.string().min(1, 'Customer is required'),
});

const UpdateContactSchema = CreateContactSchema.extend({
  id: z.string(),
});

export const contactRouter = createTRPCRouter({
  // Get all contacts with customer information
  getAll: publicProcedure.query(async () => {
    try {
      return await db.contact.findMany({
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
            },
          },
        },
      });
    } catch (error) {
      console.error('Error fetching contacts:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch contacts',
      });
    }
  }),

  // Get contact by ID
  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      try {
        const contact = await db.contact.findUnique({
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
              },
            },
          },
        });

        if (!contact) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Contact not found',
          });
        }

        return contact;
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        
        console.error('Error fetching contact:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch contact',
        });
      }
    }),

  // Get contacts by customer
  getByCustomer: publicProcedure
    .input(z.object({ customerId: z.string() }))
    .query(async ({ input }) => {
      try {
        return await db.contact.findMany({
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
              },
            },
          },
        });
      } catch (error) {
        console.error('Error fetching customer contacts:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch customer contacts',
        });
      }
    }),

  // Create new contact
  create: publicProcedure
    .input(CreateContactSchema)
    .mutation(async ({ input }) => {
      try {
        const contact = await db.contact.create({
          data: {
            name: input.name,
            designation: input.designation,
            officialCellNumber: input.officialCellNumber,
            personalCellNumber: input.personalCellNumber,
            locationType: input.locationType,
            locationAddress: input.locationAddress,
            customerId: input.customerId,
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
              },
            },
          },
        });

        return contact;
      } catch (error) {
        console.error('Error creating contact:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create contact',
        });
      }
    }),

  // Update contact
  update: publicProcedure
    .input(UpdateContactSchema)
    .mutation(async ({ input }) => {
      try {
        const { id, ...updateData } = input;

        const contact = await db.contact.update({
          where: { id },
          data: {
            name: updateData.name,
            designation: updateData.designation,
            officialCellNumber: updateData.officialCellNumber,
            personalCellNumber: updateData.personalCellNumber,
            locationType: updateData.locationType,
            locationAddress: updateData.locationAddress,
            customerId: updateData.customerId,
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
              },
            },
          },
        });

        return contact;
      } catch (error) {
        console.error('Error updating contact:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update contact',
        });
      }
    }),

  // Delete contact
  delete: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      try {
        await db.contact.delete({
          where: { id: input.id },
        });

        return { success: true };
      } catch (error) {
        console.error('Error deleting contact:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to delete contact',
        });
      }
    }),
});

