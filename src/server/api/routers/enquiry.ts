import { createTRPCRouter, publicProcedure } from '../trpc';
import { CreateEnquirySchema, UpdateEnquirySchema, UpdateEnquiryFullSchema } from '@/lib/validators/enquiry';
import { db } from '@/server/db';
import { z } from 'zod';

export const enquiryRouter = createTRPCRouter({
  // Procedure to create a new enquiry
  create: publicProcedure
    .input(CreateEnquirySchema)
    .mutation(async ({ ctx, input }) => {
      // Find the first marketing person in the database
      const marketingPerson = await db.employee.findFirst({
        where: { role: 'MARKETING' },
      });
      
      // Determine if the location is an office or plant for companies
      let officeId = null;
      let plantId = null;
      
      if (input.entityType === 'company') {
        // Check if the location is an office or plant
        const office = await db.office.findUnique({
          where: { id: input.locationId }
        });
        
        if (office) {
          officeId = input.locationId;
        } else {
          const plant = await db.plant.findUnique({
            where: { id: input.locationId }
          });
          if (plant) {
            plantId = input.locationId;
          }
        }
      }
      
      return db.enquiry.create({
        data: {
          subject: input.subject,
          customerId: null, // No longer support old customer structure
          companyId: input.customerId, // Always use companyId now
          locationId: null, // No longer support old location structure
          officeId: officeId, // For company offices
          plantId: plantId, // For company plants
          description: input.description,
          requirements: input.requirements,
          timeline: input.timeline,
          enquiryDate: new Date(input.enquiryDate),
          marketingPersonId: ctx.currentUser?.id ?? marketingPerson?.id ?? null,
          priority: input.priority,
          source: input.source,
          notes: input.notes,
          quotationNumber: input.quotationNumber,
          status: 'NEW',
        },
      });
    }),

  // Procedure to get all enquiries with company and location names
  getAll: publicProcedure.query(async () => {
    return db.enquiry.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        company: {
          select: {
            name: true,
          },
        },
        office: {
          select: {
            name: true,
          },
        },
        plant: {
          select: {
            name: true,
          },
        },
        marketingPerson: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }),

  // Get enquiry statistics - moved from frontend calculations
  getStats: publicProcedure.query(async () => {
    const [total, newCount, inProgress, quoted] = await Promise.all([
      db.enquiry.count(),
      db.enquiry.count({ where: { status: 'NEW' } }),
      db.enquiry.count({ where: { status: 'IN_PROGRESS' } }),
      db.enquiry.count({ where: { status: 'QUOTED' } })
    ]);

    return {
      total,
      new: newCount,
      inProgress,
      quoted
    };
  }),

  // Procedure to get a single enquiry by ID
  getById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const enquiry = await db.enquiry.findUnique({
        where: { id: input.id },
        include: {
          company: {
            select: {
              id: true,
              name: true,
            },
          },
          office: {
            select: {
              id: true,
              name: true,
              address: true,
              city: true,
              state: true,
              country: true,
            },
          },
          plant: {
            select: {
              id: true,
              name: true,
              address: true,
              city: true,
              state: true,
              country: true,
            },
          },
          marketingPerson: {
            select: {
              name: true,
            },
          },
        },
      });

      if (!enquiry) {
        throw new Error('Enquiry not found');
      }

      return enquiry;
    }),

  // Procedure to update enquiry status
  updateStatus: publicProcedure
    .input(UpdateEnquirySchema)
    .mutation(async ({ input }) => {
      return db.enquiry.update({
        where: { id: input.id },
        data: { status: input.status },
      });
    }),

  // Procedure to update enquiry details
  update: publicProcedure
    .input(UpdateEnquiryFullSchema)
    .mutation(async ({ input }) => {
      const { id, ...updateData } = input;
      return db.enquiry.update({
        where: { id },
        data: updateData,
      });
    }),

  // Procedure to delete an enquiry
  delete: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      return db.enquiry.delete({
        where: { id: input.id },
      });
    }),
});

