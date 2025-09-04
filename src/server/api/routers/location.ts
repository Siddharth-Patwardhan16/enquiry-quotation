import { createTRPCRouter, publicProcedure } from '../trpc';
import { db } from '@/server/db';
import { z } from 'zod';

export const locationRouter = createTRPCRouter({
  // Fetches all locations belonging to a specific customer ID
  getByCustomerId: publicProcedure
    .input(z.object({ customerId: z.string().uuid() }))
    .query(async ({ input }) => {
      if (!input.customerId) return [];
      return db.location.findMany({
        where: { customerId: input.customerId },
        orderBy: { name: 'asc' },
      });
    }),

  // Get all locations with customer information
  getAll: publicProcedure.query(async () => {
    return db.location.findMany({
      include: {
        customer: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: [
        { customer: { name: 'asc' } },
        { name: 'asc' },
      ],
    });
  }),

  // Get a specific location by ID
  getById: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input }) => {
      return db.location.findUnique({
        where: { id: input.id },
        include: {
          customer: true,
          contacts: true,
          enquiries: true,
        },
      });
    }),

  // Create a new location
  create: publicProcedure
    .input(z.object({
      customerId: z.string().uuid(),
      name: z.string().min(2, 'Location name is required'),
      type: z.enum(['OFFICE', 'PLANT']),
      address: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      country: z.string().optional(),
      receptionNumber: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      return db.location.create({
        data: input,
      });
    }),

  // Update a location
  update: publicProcedure
    .input(z.object({
      id: z.string().uuid(),
      name: z.string().min(2, 'Location name is required').optional(),
      type: z.enum(['OFFICE', 'PLANT']).optional(),
      address: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      country: z.string().optional(),
      receptionNumber: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...updateData } = input;
      return db.location.update({
        where: { id },
        data: updateData,
      });
    }),

  // Delete a location
  delete: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input }) => {
      return db.location.delete({
        where: { id: input.id },
      });
    }),
});

