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
      
      if (input.entityType === 'company' && input.locationId) {
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
          enquiryDate: input.enquiryDate ? new Date(input.enquiryDate) : null,
          marketingPersonId: ctx.currentUser?.id ?? marketingPerson?.id ?? null,
          attendedById: input.attendedById,
          priority: input.priority,
          source: input.source,
          notes: input.notes,
          quotationNumber: input.quotationNumber,
          quotationDate: input.quotationDate ? new Date(input.quotationDate) : null,
          region: input.region,
          oaNumber: input.oaNumber,
          blockModel: input.blockModel,
          numberOfBlocks: input.numberOfBlocks,
          designRequired: input.designRequired,
          customerType: input.customerType,
          status: input.status ?? 'LIVE',
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
        attendedBy: {
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
    const [total, liveCount, deadCount, rcdCount, lostCount] = await Promise.all([
      db.enquiry.count(),
      db.enquiry.count({ where: { status: 'LIVE' } }),
      db.enquiry.count({ where: { status: 'DEAD' } }),
      db.enquiry.count({ where: { status: 'RCD' } }),
      db.enquiry.count({ where: { status: 'LOST' } })
    ]);

    return {
      total,
      live: liveCount,
      dead: deadCount,
      rcd: rcdCount,
      lost: lostCount
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
      const { id, enquiryDate, dateOfReceipt, quotationDate, attendedById, status, ...rest } = input;
      
      // Build update data with proper types
      const updateData: {
        subject?: string | null;
        description?: string | null;
        requirements?: string | null;
        timeline?: string | null;
        enquiryDate?: Date | null;
        priority?: string | null;
        source?: string | null;
        notes?: string | null;
        quotationNumber?: string | null;
        quotationDate?: Date | null;
        region?: string | null;
        oaNumber?: string | null;
        dateOfReceipt?: Date | null;
        blockModel?: string | null;
        numberOfBlocks?: number | null;
        designRequired?: string | null;
        attendedById?: string | undefined;
        customerType?: string | null;
        status?: 'LIVE' | 'DEAD' | 'RCD' | 'LOST';
      } = { ...rest };
      
      // Convert date strings to Date objects
      if (enquiryDate !== undefined) {
        updateData.enquiryDate = enquiryDate ? new Date(enquiryDate) : null;
      }
      if (dateOfReceipt !== undefined) {
        updateData.dateOfReceipt = dateOfReceipt ? new Date(dateOfReceipt) : null;
      }
      if (quotationDate !== undefined) {
        updateData.quotationDate = quotationDate ? new Date(quotationDate) : null;
      }
      
      // Handle attendedById - convert empty string to undefined
      if (attendedById !== undefined) {
        updateData.attendedById = attendedById && attendedById.trim() !== '' ? attendedById : undefined;
      }
      
      // Handle status - ensure it's a valid enum value
      if (status !== undefined) {
        updateData.status = status;
      }
      
      return db.enquiry.update({
        where: { id },
        data: updateData,
      });
    }),

  // Procedure to update status with receipt date
  updateStatusWithReceipt: publicProcedure
    .input(z.object({
      id: z.number(),
      status: z.literal('RCD'),
      dateOfReceipt: z.string(),
      receiptNumber: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, dateOfReceipt, receiptNumber } = input;
      
      return db.enquiry.update({
        where: { id },
        data: {
          status: 'RCD',
          dateOfReceipt: dateOfReceipt ? new Date(dateOfReceipt) : null,
          // Store receipt number in oaNumber if provided, or leave it as is
          ...(receiptNumber ? { oaNumber: receiptNumber } : {}),
        },
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

