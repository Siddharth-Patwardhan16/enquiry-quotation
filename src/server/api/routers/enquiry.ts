import { createTRPCRouter, publicProcedure } from '../trpc';
import { CreateEnquirySchema, UpdateEnquirySchema, UpdateEnquiryFullSchema } from '@/lib/validators/enquiry';
import { FinancialYearFilterSchema, getFinancialYear } from '@/lib/financial-year';
import { db } from '@/server/db';
import { z } from 'zod';
import type { Prisma } from '@prisma/client';

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

      const fy = getFinancialYear(new Date());

      return db.$transaction(async (tx) => {
        const last = await tx.enquiry.findFirst({
          where: { financialYear: fy },
          orderBy: { sequenceNumber: 'desc' },
          select: { sequenceNumber: true },
        });
        const sequenceNumber = (last?.sequenceNumber ?? 0) + 1;

        return tx.enquiry.create({
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
            financialYear: fy,
            sequenceNumber,
            // Status: if undefined, don't set it (let database default handle it)
            // If provided, use it; otherwise Prisma will use the schema default
            ...(input.status ? { status: input.status } : {}),
          },
        });
      });
    }),

  // Procedure to get paginated enquiries with server-side filtering
  getPaginated: publicProcedure
    .input(
      z.object({
        financialYear: z.string().optional(),
        page: z.number().int().min(1).default(1),
        pageSize: z.number().int().min(1).max(100).default(25),
        search: z.string().optional(),
        status: z.enum(['LIVE', 'DEAD', 'RCD', 'LOST', 'WON', 'BUDGETARY']).optional().nullable(),
      }),
    )
    .query(async ({ input }) => {
      const page = input.page ?? 1;
      const pageSize = input.pageSize ?? 25;
      const skip = (page - 1) * pageSize;

      const where: Prisma.EnquiryWhereInput = {};

      if (input.financialYear) {
        where.financialYear = input.financialYear;
      }

      if (input.status) {
        where.status = input.status;
      }

      if (input.search?.trim()) {
        const query = input.search.trim();
        where.OR = [
          { subject: { contains: query, mode: 'insensitive' } },
          { quotationNumber: { contains: query, mode: 'insensitive' } },
          { region: { contains: query, mode: 'insensitive' } },
          { company: { name: { contains: query, mode: 'insensitive' } } },
          { customer: { name: { contains: query, mode: 'insensitive' } } },
          { marketingPerson: { name: { contains: query, mode: 'insensitive' } } },
          { attendedBy: { name: { contains: query, mode: 'insensitive' } } },
        ];
      }

      const [total, items] = await Promise.all([
        db.enquiry.count({ where }),
        db.enquiry.findMany({
          where,
          skip,
          take: pageSize,
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
        }),
      ]);

      const totalPages = Math.ceil(total / pageSize);

      return {
        items,
        total,
        page,
        pageSize,
        totalPages,
      };
    }),

  // Procedure to get all enquiries with company and location names
  getAll: publicProcedure
    .input(FinancialYearFilterSchema)
    .query(async ({ input }) => {
    const where = input.financialYear ? { financialYear: input.financialYear } : {};
    return db.enquiry.findMany({
      where,
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
  getStats: publicProcedure
    .input(FinancialYearFilterSchema)
    .query(async ({ input }) => {
    const base = input.financialYear ? { financialYear: input.financialYear } : {};
    const [total, liveCount, deadCount, rcdCount, lostCount, wonCount, budgetaryCount] = await Promise.all([
      db.enquiry.count({ where: base }),
      db.enquiry.count({ where: { ...base, status: 'LIVE' } }),
      db.enquiry.count({ where: { ...base, status: 'DEAD' } }),
      db.enquiry.count({ where: { ...base, status: 'RCD' } }),
      db.enquiry.count({ where: { ...base, status: 'LOST' } }),
      db.enquiry.count({ where: { ...base, status: 'WON' } }),
      db.enquiry.count({ where: { ...base, status: 'BUDGETARY' } })
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
      const { id, enquiryDate, dateOfReceipt, quotationDate, oaDate, attendedById, status, customerId, locationId, entityType, ...rest } = input;
      
      // Determine if the location is an office or plant for companies
      let officeId = null;
      let plantId = null;
      
      if (entityType === 'company' && locationId) {
        // Check if the location is an office or plant
        const office = await db.office.findUnique({
          where: { id: locationId }
        });
        
        if (office) {
          officeId = locationId;
        } else {
          const plant = await db.plant.findUnique({
            where: { id: locationId }
          });
          if (plant) {
            plantId = locationId;
          }
        }
      }
      
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
        numberOfBlocks?: string | null;
        designRequired?: string | null;
        attendedById?: string | null;
        customerType?: string | null;
        status?: 'LIVE' | 'DEAD' | 'RCD' | 'LOST' | 'WON' | 'BUDGETARY';
        customerId?: string | null;
        companyId?: string | null;
        locationId?: string | null;
        officeId?: string | null;
        plantId?: string | null;
      } = { ...rest };
      
      // Handle customer/company update
      if (customerId !== undefined || entityType !== undefined) {
        if (entityType === 'company' && customerId) {
          // Update to company
          updateData.companyId = customerId;
          updateData.customerId = null;
          updateData.locationId = null;
          updateData.officeId = officeId;
          updateData.plantId = plantId;
        } else if (entityType === 'customer' && customerId) {
          // Update to customer
          updateData.customerId = customerId;
          updateData.companyId = null;
          updateData.locationId = locationId ?? null;
          updateData.officeId = null;
          updateData.plantId = null;
        } else if (customerId === undefined && entityType === undefined) {
          // Don't change customer/company if not provided
          // Leave existing values unchanged
        } else if (customerId === undefined && entityType) {
          // If entityType is provided but customerId is undefined, don't update customer fields
          // This allows updating other fields without changing customer
        }
      }
      
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
      
      // attendedById has already been normalized by the schema.
      if (attendedById !== undefined) {
        updateData.attendedById = attendedById;
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
