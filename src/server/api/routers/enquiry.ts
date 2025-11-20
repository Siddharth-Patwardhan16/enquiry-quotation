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
          oaDate: input.oaDate ? new Date(input.oaDate) : null,
          blockModel: input.blockModel,
          numberOfBlocks: input.numberOfBlocks,
          designRequired: input.designRequired,
          customerType: input.customerType,
          // Status: if undefined, don't set it (let database default handle it)
          // If provided, use it; otherwise Prisma will use the schema default
          ...(input.status ? { status: input.status } : {}),
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
    const [total, liveCount, deadCount, rcdCount, lostCount, wonCount, budgetaryCount] = await Promise.all([
      db.enquiry.count(),
      db.enquiry.count({ where: { status: 'LIVE' } }),
      db.enquiry.count({ where: { status: 'DEAD' } }),
      db.enquiry.count({ where: { status: 'RCD' } }),
      db.enquiry.count({ where: { status: 'LOST' } }),
      db.enquiry.count({ where: { status: 'WON' } }),
      db.enquiry.count({ where: { status: 'BUDGETARY' } })
    ]);

    return {
      total,
      live: liveCount,
      dead: deadCount,
      rcd: rcdCount,
      lost: lostCount,
      won: wonCount,
      budgetary: budgetaryCount
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
      const { id, status, purchaseOrderNumber, poValue, poDate } = input;
      
      // Prepare poDate as DateTime if provided
      const poDateValue = poDate ? new Date(poDate) : null;
      
      const updateData: {
        status: 'LIVE' | 'DEAD' | 'RCD' | 'LOST' | 'WON' | 'BUDGETARY';
        purchaseOrderNumber?: string | null;
        poValue?: number | null;
        poDate?: Date | null;
      } = {
        status: status,
      };
      
      // Store PO fields when status is WON
      if (status === 'WON') {
        updateData.purchaseOrderNumber = purchaseOrderNumber ?? null;
        updateData.poValue = poValue ?? null;
        updateData.poDate = poDateValue;
      } else {
        // Clear PO fields when status is not WON
        updateData.purchaseOrderNumber = null;
        updateData.poValue = null;
        updateData.poDate = null;
      }
      
      const updatedEnquiry = await db.enquiry.update({
        where: { id },
        data: updateData,
      });

      // Sync status to related quotations
      const relatedQuotations = await db.quotation.findMany({
        where: { enquiryId: id },
      });

      if (relatedQuotations.length > 0) {
        // Map enquiry status to quotation status
        let quotationStatus: 'LIVE' | 'WON' | 'LOST' | 'BUDGETARY' | 'RECEIVED' | 'DEAD' | undefined;
        
        if (status === 'BUDGETARY') {
          quotationStatus = 'BUDGETARY';
        } else if (status === 'RCD') {
          quotationStatus = 'RECEIVED';
        } else if (status === 'LOST') {
          quotationStatus = 'LOST';
        } else if (status === 'WON') {
          quotationStatus = 'WON';
        } else if (status === 'DEAD') {
          quotationStatus = 'DEAD';
        } else if (status === 'LIVE') {
          quotationStatus = 'LIVE';
        }

        // Update all related quotations
        if (quotationStatus) {
          await db.quotation.updateMany({
            where: { enquiryId: id },
            data: { status: quotationStatus },
          });
        }
      }

      return updatedEnquiry;
    }),

  // Procedure to update enquiry details
  update: publicProcedure
    .input(UpdateEnquiryFullSchema)
    .mutation(async ({ input }) => {
      const { id, enquiryDate, dateOfReceipt, quotationDate, oaDate, attendedById, status, ...rest } = input;
      
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
        oaDate?: Date | null;
        dateOfReceipt?: Date | null;
        blockModel?: string | null;
        numberOfBlocks?: number | null;
        designRequired?: string | null;
        attendedById?: string | null;
        customerType?: string | null;
        status?: 'LIVE' | 'DEAD' | 'RCD' | 'LOST' | 'WON' | 'BUDGETARY';
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
      if (oaDate !== undefined) {
        updateData.oaDate = oaDate ? new Date(oaDate) : null;
      }
      
      // Handle attendedById - convert empty string to undefined, but allow null to clear
      if (attendedById !== undefined) {
        if (attendedById === null) {
          // Explicitly set to null to clear the field
          updateData.attendedById = null;
        } else if (typeof attendedById === 'string' && attendedById.trim() !== '') {
          // Valid UUID string
          updateData.attendedById = attendedById.trim();
        } else {
          // Empty string or invalid - set to undefined (don't update)
          updateData.attendedById = undefined;
        }
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
      purchaseOrderNumber: z.string().optional(),
      poValue: z.number().optional(),
      poDate: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, dateOfReceipt, receiptNumber, purchaseOrderNumber, poValue, poDate } = input;
      
      // Prepare poDate as DateTime if provided
      const poDateValue = poDate ? new Date(poDate) : null;
      
      return db.enquiry.update({
        where: { id },
        data: {
          status: 'RCD',
          dateOfReceipt: dateOfReceipt ? new Date(dateOfReceipt) : null,
          // Store receipt number in oaNumber if provided, or leave it as is
          ...(receiptNumber ? { oaNumber: receiptNumber } : {}),
          // Store PO fields
          purchaseOrderNumber: purchaseOrderNumber ?? null,
          poValue: poValue ?? null,
          poDate: poDateValue,
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

