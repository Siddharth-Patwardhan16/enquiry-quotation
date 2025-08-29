import { createTRPCRouter, publicProcedure } from '../trpc';
import { CreateCustomerSchema } from '@/lib/validators/customer';
import { db } from '@/server/db';
import { z } from 'zod';

export const customerRouter = createTRPCRouter({
  // Procedure to get all customers
  getAll: publicProcedure.query(async () => {
    try {
      // Test database connection first
      await db.$connect();
      
      const customers = await db.customer.findMany({
        orderBy: { createdAt: 'desc' }, // Show newest first
      });
      
      return customers;
    } catch (error) {
      console.error('Error fetching customers:', error);
      
      // If it's a connection error, try to reconnect
      if (error instanceof Error && error.message.includes('prepared statement')) {
        try {
          await db.$disconnect();
          await db.$connect();
          
          const customers = await db.customer.findMany({
            orderBy: { createdAt: 'desc' },
          });
          
          return customers;
        } catch (retryError) {
          console.error('Retry failed:', retryError);
          throw new Error('Database connection failed');
        }
      }
      
      throw new Error('Failed to fetch customers');
    }
  }),

  // Procedure to search customers by office name or plant name
  searchByOfficeOrPlant: publicProcedure
    .input(z.object({
      searchTerm: z.string().min(1, 'Search term is required'),
      searchType: z.enum(['office', 'plant', 'both']).default('both'),
    }))
    .query(async ({ input }) => {
      try {
        const { searchTerm, searchType } = input;
        
        let whereClause = {};
        
        if (searchType === 'office') {
          whereClause = {
            officeName: {
              contains: searchTerm,
              mode: 'insensitive', // Case-insensitive search
            },
          };
        } else if (searchType === 'plant') {
          whereClause = {
            plantName: {
              contains: searchTerm,
              mode: 'insensitive', // Case-insensitive search
            },
          };
        } else {
          // Search both office and plant names
          whereClause = {
            OR: [
              {
                officeName: {
                  contains: searchTerm,
                  mode: 'insensitive',
                },
              },
              {
                plantName: {
                  contains: searchTerm,
                  mode: 'insensitive',
                },
              },
            ],
          };
        }
        
        const customers = await db.customer.findMany({
          where: whereClause,
          orderBy: { createdAt: 'desc' },
          include: {
            enquiries: {
              select: {
                id: true,
                subject: true,
                status: true,
                enquiryDate: true,
              },
            },
          },
        });
        
        return customers;
      } catch (error) {
        console.error('Error searching customers:', error);
        throw new Error('Failed to search customers');
      }
    }),

  // Procedure to get a single customer by ID
  getById: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input }) => {
      try {
        const customer = await db.customer.findUnique({
          where: { id: input.id },
        });
        
        if (!customer) {
          throw new Error('Customer not found');
        }
        
        return customer;
      } catch (error) {
        console.error('Error fetching customer:', error);
        throw new Error('Failed to fetch customer');
      }
    }),

  // Procedure to create a new customer
  create: publicProcedure
    .input(CreateCustomerSchema)
    .mutation(async ({ input }) => {
      try {
        return await db.customer.create({
          data: {
            name: input.name,
            officeName: input.officeName,
            officeAddress: input.officeAddress,
            officeCity: input.officeCity,
            officeState: input.officeState,
            officeCountry: input.officeCountry,
            officeReceptionNumber: input.officeReceptionNumber,
            plantName: input.plantName,
            plantAddress: input.plantAddress,
            plantCity: input.plantCity,
            plantState: input.plantState,
            plantCountry: input.plantCountry,
            plantReceptionNumber: input.plantReceptionNumber,
            poRuptureDiscs: input.poRuptureDiscs ? 1 : 0,
            poThermowells: input.poThermowells ? 1 : 0,
            poHeatExchanger: input.poHeatExchanger ? 1 : 0,
            poMiscellaneous: input.poMiscellaneous ? 1 : 0,
            poWaterJetSteamJet: input.poWaterJetSteamJet ? 1 : 0,
            existingGraphiteSuppliers: input.existingGraphiteSuppliers,
            problemsFaced: input.problemsFaced,
            isNew: input.isNew,
          },
        });
      } catch (error) {
        console.error('Error creating customer:', error);
        throw new Error('Failed to create customer');
      }
    }),

  // Procedure to update an existing customer
  update: publicProcedure
    .input(z.object({
      id: z.string().uuid(),
      name: z.string().min(2, 'Customer name is required'),
      officeName: z.string().optional(),
      officeAddress: z.string().optional(),
      officeCity: z.string().optional(),
      officeState: z.string().optional(),
      officeCountry: z.string().optional(),
      officeReceptionNumber: z.string().optional(),
      plantName: z.string().optional(),
      plantAddress: z.string().optional(),
      plantCity: z.string().optional(),
      plantState: z.string().optional(),
      plantCountry: z.string().optional(),
      plantReceptionNumber: z.string().optional(),
      poRuptureDiscs: z.boolean().optional(),
      poThermowells: z.boolean().optional(),
      poHeatExchanger: z.boolean().optional(),
      poMiscellaneous: z.boolean().optional(),
      poWaterJetSteamJet: z.boolean().optional(),
      existingGraphiteSuppliers: z.string().optional(),
      problemsFaced: z.string().optional(),
      isNew: z.boolean(),
    }))
    .mutation(async ({ input }) => {
      try {
        const { id, ...updateData } = input;
        
        // Convert boolean PO fields to numbers for database storage
        const processedData = {
          ...updateData,
          poRuptureDiscs: updateData.poRuptureDiscs !== undefined ? (updateData.poRuptureDiscs ? 1 : 0) : undefined,
          poThermowells: updateData.poThermowells !== undefined ? (updateData.poThermowells ? 1 : 0) : undefined,
          poHeatExchanger: updateData.poHeatExchanger !== undefined ? (updateData.poHeatExchanger ? 1 : 0) : undefined,
          poMiscellaneous: updateData.poMiscellaneous !== undefined ? (updateData.poMiscellaneous ? 1 : 0) : undefined,
          poWaterJetSteamJet: updateData.poWaterJetSteamJet !== undefined ? (updateData.poWaterJetSteamJet ? 1 : 0) : undefined,
        };
        
        return await db.customer.update({
          where: { id },
          data: processedData,
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
});
