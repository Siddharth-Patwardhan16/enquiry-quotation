import { createTRPCRouter, publicProcedure } from '../trpc';
import { db } from '@/server/db';
import { z } from 'zod';

// Schema for creating a customer with multiple locations
const CreateCustomerWithLocationsSchema = z.object({
  name: z.string().min(2, 'Customer name is required'),
  isNew: z.boolean().default(true),
  offices: z.array(z.object({
    name: z.string().min(2, 'Office name is required'),
    address: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    country: z.string().optional(),
    receptionNumber: z.string().optional(),
  })).min(1, 'At least one office is required'),
  plants: z.array(z.object({
    name: z.string().min(2, 'Plant name is required'),
    address: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    country: z.string().optional(),
    receptionNumber: z.string().optional(),
  })).default([]),
  // PO Information
  poRuptureDiscs: z.boolean().default(false),
  poThermowells: z.boolean().default(false),
  poHeatExchanger: z.boolean().default(false),
  poMiscellaneous: z.boolean().default(false),
  poWaterJetSteamJet: z.boolean().default(false),
  // Supplier Information
  existingGraphiteSuppliers: z.string().optional(),
  problemsFaced: z.string().optional(),
});

// Schema for updating a customer
const UpdateCustomerSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(2, 'Customer name is required'),
  isNew: z.boolean(),
  // PO Information
  poRuptureDiscs: z.boolean().optional(),
  poThermowells: z.boolean().optional(),
  poHeatExchanger: z.boolean().optional(),
  poMiscellaneous: z.boolean().optional(),
  poWaterJetSteamJet: z.boolean().optional(),
  // Supplier Information
  existingGraphiteSuppliers: z.string().optional(),
  problemsFaced: z.string().optional(),
});

export const customerRouter = createTRPCRouter({
  // Procedure to get all customers with their locations
  getAll: publicProcedure.query(async () => {
    try {
      await db.$connect();
      
      const customers = await db.customer.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
          locations: {
            orderBy: { name: 'asc' },
          },
          contacts: {
            include: {
              location: true,
            },
          },
        },
      });
      
      return customers;
    } catch (error) {
      console.error('Error fetching customers:', error);
      throw new Error('Failed to fetch customers');
    }
  }),

  // Procedure to get a single customer by ID
  getById: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input }) => {
      return db.customer.findUnique({
        where: { id: input.id },
        include: {
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
          locations: {
            orderBy: { name: 'asc' },
          },
          contacts: {
            include: {
              location: true,
            },
          },
          enquiries: {
            include: {
              location: true,
              marketingPerson: true,
            },
          },
        },
      });
    }),

  // Procedure to create a customer with multiple locations
  create: publicProcedure
    .input(CreateCustomerWithLocationsSchema)
    .mutation(async ({ input }) => {
      try {
        const { 
          name, 
          isNew, 
          offices, 
          plants,
          poRuptureDiscs,
          poThermowells,
          poHeatExchanger,
          poMiscellaneous,
          poWaterJetSteamJet,
          existingGraphiteSuppliers,
          problemsFaced
        } = input;
        
        // Find the first available employee to assign as creator
        const creator = await db.employee.findFirst({
          where: { role: 'MARKETING' },
        });

        if (!creator) {
          throw new Error('No marketing person found in the database');
        }
        
        return await db.$transaction(async (prisma) => {
          // 1. Create the parent Customer
          const newCustomer = await prisma.customer.create({
            data: {
              name,
              isNew,
              createdById: creator.id,
              poRuptureDiscs,
              poThermowells,
              poHeatExchanger,
              poMiscellaneous,
              poWaterJetSteamJet,
              existingGraphiteSuppliers,
              problemsFaced,
            },
          });

          // 2. Prepare all office and plant locations
          const locationsToCreate = [
            ...offices.map(office => ({ 
              ...office, 
              type: 'OFFICE' as const, 
              customerId: newCustomer.id 
            })),
            ...plants.map(plant => ({ 
              ...plant, 
              type: 'PLANT' as const, 
              customerId: newCustomer.id 
            }))
          ];

          // 3. Create all Locations in a single database call
          if (locationsToCreate.length > 0) {
            await prisma.location.createMany({
              data: locationsToCreate,
            });
          }

          // 4. Return the customer with locations
          return prisma.customer.findUnique({
            where: { id: newCustomer.id },
            include: {
              locations: true,
            },
          });
        });
      } catch (error) {
        console.error('Error creating customer with locations:', error);
        
        // Handle Prisma unique constraint errors
        if (error && typeof error === 'object' && 'code' in error) {
          if (error.code === 'P2002') {
            throw new Error('A customer with this name already exists. Please use a different name.');
          }
        }
        
        throw new Error('Failed to create customer');
      }
    }),

  // Procedure to update a customer
  update: publicProcedure
    .input(UpdateCustomerSchema)
    .mutation(async ({ input }) => {
      try {
        const { id, ...updateData } = input;
        
        return await db.customer.update({
          where: { id },
          data: updateData,
          include: {
            locations: true,
          },
        });
      } catch (error) {
        console.error('Error updating customer:', error);
        throw new Error('Failed to update customer');
      }
    }),

  // Procedure to delete a customer
  delete: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input }) => {
      try {
        return await db.customer.delete({
          where: { id: input.id },
        });
      } catch (error) {
        console.error('Error deleting customer:', error);
        throw new Error('Failed to delete customer');
      }
    }),

  // Procedure to add a new location to an existing customer
  addLocation: publicProcedure
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
      try {
        return await db.location.create({
          data: input,
        });
      } catch (error) {
        console.error('Error adding location:', error);
        throw new Error('Failed to add location');
      }
    }),

  // Procedure to search customers by name
  search: publicProcedure
    .input(z.object({ searchTerm: z.string() }))
    .query(async ({ input }) => {
      if (!input.searchTerm.trim()) return [];
      
      return db.customer.findMany({
        where: {
          name: {
            contains: input.searchTerm,
            mode: 'insensitive',
          },
        },
        include: {
          locations: true,
        },
        orderBy: { name: 'asc' },
        take: 10, // Limit results
      });
    }),
});