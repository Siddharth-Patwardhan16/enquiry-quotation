import { createTRPCRouter, publicProcedure } from '../trpc';
import { db } from '@/server/db';
import { z } from 'zod';

export const customerRouter = createTRPCRouter({
  // Get all customers with locations and contacts
  getAll: publicProcedure
    .input(z.object({
      sortBy: z.enum(['name', 'createdAt', 'updatedAt', 'type']).optional().default('name'),
      sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
    }).optional())
    .query(async ({ input }) => {
      const sortBy = input?.sortBy ?? 'name';
      const sortOrder = input?.sortOrder ?? 'asc';
      
      // Build orderBy object
      let orderBy: Record<string, 'asc' | 'desc'>;
      if (sortBy === 'type') {
        // For type, we'll sort by isNew (new customers first) or name as fallback
        orderBy = { name: sortOrder };
      } else {
        orderBy = { [sortBy]: sortOrder };
      }
      
      return db.customer.findMany({
        include: {
          locations: {
            orderBy: { name: 'asc' },
          },
          contacts: {
            include: {
              location: true,
            },
            orderBy: { name: 'asc' },
          },
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
        orderBy,
      });
    }),

  // Get customer by ID with locations and contacts
  getById: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input }) => {
      return db.customer.findUnique({
        where: { id: input.id },
        include: {
          locations: {
            orderBy: { name: 'asc' },
          },
          contacts: {
            include: {
              location: true,
            },
            orderBy: { name: 'asc' },
          },
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
      });
    }),

  // Create a new customer
  create: publicProcedure
    .input(z.object({
      name: z.string().min(1, 'Customer name is required'),
      isNew: z.boolean().default(true),
      designation: z.string().optional(),
      phoneNumber: z.string().optional(),
      emailId: z.string().optional(),
      createdById: z.string().optional(),
      poRuptureDiscs: z.boolean().default(false),
      poThermowells: z.boolean().default(false),
      poHeatExchanger: z.boolean().default(false),
      poMiscellaneous: z.boolean().default(false),
      poWaterJetSteamJet: z.boolean().default(false),
      existingGraphiteSuppliers: z.string().optional(),
      problemsFaced: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      return db.customer.create({
        data: input,
      });
    }),

  // Update a customer
  update: publicProcedure
    .input(z.object({
      id: z.string().uuid(),
      name: z.string().min(1, 'Customer name is required').optional(),
      isNew: z.boolean().optional(),
      designation: z.string().optional(),
      phoneNumber: z.string().optional(),
      emailId: z.string().optional(),
      poRuptureDiscs: z.boolean().optional(),
      poThermowells: z.boolean().optional(),
      poHeatExchanger: z.boolean().optional(),
      poMiscellaneous: z.boolean().optional(),
      poWaterJetSteamJet: z.boolean().optional(),
      existingGraphiteSuppliers: z.string().optional(),
      problemsFaced: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      return db.customer.update({
        where: { id },
        data,
      });
    }),

  // Delete a customer
  delete: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input }) => {
      return db.customer.delete({
        where: { id: input.id },
      });
    }),
});

