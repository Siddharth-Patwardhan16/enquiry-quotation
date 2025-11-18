
import { createTRPCRouter, publicProcedure } from '../trpc';
import { CreateQuotationSchema } from '@/lib/validators/quotation';
import { UpdateQuotationStatusSchema } from '@/lib/validators/quotationStatus';
import { db } from '@/server/db';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';

export const quotationRouter = createTRPCRouter({
  create: publicProcedure
    .input(CreateQuotationSchema)
    .mutation(async ({ ctx, input }) => {
      const { enquiryId, items = [], quotationDate, ...rest } = input;

      // Generate quotation number - use enquiry's quotation number if available, otherwise generate default
      let quotationNumber: string;
      
      if (enquiryId) {
        // Get the enquiry to retrieve its quotation number
        const enquiry = await db.enquiry.findUnique({
          where: { id: enquiryId },
          select: { quotationNumber: true, subject: true }
        });

        if (enquiry?.quotationNumber) {
          quotationNumber = enquiry.quotationNumber;
          
          // Check for duplicate quotation number before creating
          const existingQuotation = await db.quotation.findUnique({
            where: { quotationNumber },
          });

          if (existingQuotation) {
            throw new TRPCError({
              code: 'CONFLICT',
              message: `Quotation number "${quotationNumber}" already exists. Please use a different quotation number.`,
            });
          }
        } else {
          // Generate default quotation number if enquiry doesn't have one
          const now = new Date();
          const year = now.getFullYear();
          const month = String(now.getMonth() + 1).padStart(2, '0');
          const timestamp = now.getTime().toString().slice(-6);
          quotationNumber = `Q${year}${month}${timestamp}`;
        }
      } else {
        // Generate default quotation number if no enquiry is selected
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const timestamp = now.getTime().toString().slice(-6);
        quotationNumber = `Q${year}${month}${timestamp}`;
      }

      // Calculate totals - handle empty items array
      const itemsArray = items || [];
      const subtotal = itemsArray.reduce((sum, item) => {
        const quantity = Number(item.quantity) || 0;
        const pricePerUnit = Number(item.pricePerUnit) || 0;
        return sum + (quantity * pricePerUnit);
      }, 0);
      const totalValue = subtotal;

      // Prisma Transaction: This ensures that both the quotation and all its items are created successfully.
      // If any part fails, the entire transaction is rolled back, preventing partial data.
      try {
        return await db.$transaction(async (prisma) => {
          // 1. Create the main Quotation record
          const newQuotation = await prisma.quotation.create({
            data: {
              enquiryId: enquiryId ?? null,
              quotationNumber,
              subtotal,
              tax: 0,
              totalValue,
              quotationDate: quotationDate ? new Date(quotationDate) : new Date(),
              createdById: ctx.currentUser?.id ?? null,
              ...rest,
            },
          });

          // 2. Prepare the data for all QuotationItem records with totals (only if items array is not empty)
          if (itemsArray.length > 0) {
            const itemsToCreate = itemsArray.map((item) => {
              const quantity = Number(item.quantity) || 0;
              const pricePerUnit = Number(item.pricePerUnit) || 0;
              const materialDescription: string = item.materialDescription ?? 'Unnamed Item';
              return {
                materialDescription,
                specifications: item.specifications ?? null,
                quantity,
                pricePerUnit,
                total: quantity * pricePerUnit,
                quotationId: newQuotation.id, // Link each item to the new quotation
              };
            });

            // 3. Create all QuotationItem records in one go
            await prisma.quotationItem.createMany({
              data: itemsToCreate,
            });
          }

          return newQuotation;
        });
      } catch (error) {
        // Error in quotation operation
        
        // Check if it's a Prisma constraint violation error
        if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002' && 
            'meta' in error && error.meta && typeof error.meta === 'object' && 
            'target' in error.meta && Array.isArray(error.meta.target) && 
            error.meta.target.includes('quotationNumber')) {
          throw new TRPCError({
            code: 'CONFLICT',
            message: `Quotation number "${quotationNumber}" already exists. Please use a different quotation number.`,
          });
        }
        
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create quotation. Please try again.',
        });
      }
    }),

  getAll: publicProcedure.query(() => {
    return db.quotation.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        // Include related data to display in the list
        enquiry: {
          include: {
            customer: {
              select: { name: true },
            },
            company: {
              select: { name: true },
            },
          },
        },
        items: true, // Also include the line items
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }),

  // Get quotation statistics - moved from frontend calculations
  getStats: publicProcedure.query(async () => {
    const [total, live, won, lost, budgetary, dead] = await Promise.all([
      db.quotation.count(),
      db.quotation.count({ where: { status: { in: ['LIVE'] } } }),
      db.quotation.count({ where: { status: 'WON' } }),
      db.quotation.count({ where: { status: 'LOST' } }),
      db.quotation.count({ where: { status: 'BUDGETARY' } }),
      db.quotation.count({ where: { status: 'DEAD' } })
    ]);

    // Calculate total value for live/submitted quotations
    const liveTotalValue = await db.quotation.aggregate({
      where: { status: { in: ['LIVE'] } },
      _sum: { totalValue: true }
    });

    // Calculate total value for all active quotations (live, submitted, won, budgetary)
    const activeTotalValue = await db.quotation.aggregate({
      where: { status: { in: ['LIVE', 'WON', 'BUDGETARY'] } },
      _sum: { totalValue: true }
    });

    return {
      total,
      live,
      won,
      lost,
      budgetary,
      dead,
      liveTotalValue: liveTotalValue._sum.totalValue ?? 0,
      activeTotalValue: activeTotalValue._sum.totalValue ?? 0
    };
  }),

  // Check if quotation number already exists
  checkDuplicateNumber: publicProcedure
    .input(z.object({ quotationNumber: z.string() }))
    .mutation(async ({ input }) => {
      const existingQuotation = await db.quotation.findUnique({
        where: { quotationNumber: input.quotationNumber },
        select: { id: true, quotationNumber: true },
      });
      
      return {
        exists: !!existingQuotation,
        quotationNumber: input.quotationNumber,
      };
    }),

  updateStatus: publicProcedure
    .input(UpdateQuotationStatusSchema)
    .mutation(async ({ input }) => {
      const { quotationId, status, lostReason, purchaseOrderNumber, poValue, poDate } = input;

      // Ensure the quotation exists before trying to update it
      const existingQuotation = await db.quotation.findUnique({
        where: { id: quotationId },
        include: {
          enquiry: true,
        },
      });

      if (!existingQuotation) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Quotation not found.' });
      }

      // Prepare poDate as DateTime if provided
      const poDateValue = poDate ? new Date(poDate) : null;

      // Update the quotation in the database
      const updatedQuotation = await db.quotation.update({
        where: {
          id: quotationId,
        },
        data: {
          status: status,
          lostReason: status === 'LOST' ? lostReason : null, // Only set lostReason if status is LOST
          purchaseOrderNumber: status === 'WON' ? purchaseOrderNumber : null,
          poValue: status === 'WON' ? poValue : null,
          poDate: status === 'WON' ? poDateValue : null,
        },
      });

      // Sync status and PO fields to related enquiry (preserve RCD status)
      if (existingQuotation.enquiryId && existingQuotation.enquiry) {
        const enquiry = existingQuotation.enquiry;
        
        // Don't override RCD status
        if (enquiry.status !== 'RCD') {
          let enquiryStatus: 'LIVE' | 'DEAD' | 'RCD' | 'LOST' | 'WON' | undefined;
          
          // Map quotation status to enquiry status
          if (status === 'WON') {
            enquiryStatus = 'WON';
          } else if (status === 'LOST') {
            enquiryStatus = 'LOST';
          } else if (status === 'DEAD') {
            enquiryStatus = 'DEAD';
          }
          
          // Update enquiry with status and PO fields if status is WON
          if (enquiryStatus) {
            const enquiryUpdateData: {
              status: 'LIVE' | 'DEAD' | 'RCD' | 'LOST' | 'WON';
              purchaseOrderNumber?: string | null;
              poValue?: number | null;
              poDate?: Date | null;
            } = {
              status: enquiryStatus,
            };
            
            // Sync PO fields when status is WON
            if (status === 'WON') {
              enquiryUpdateData.purchaseOrderNumber = purchaseOrderNumber ?? null;
              enquiryUpdateData.poValue = poValue ?? null;
              enquiryUpdateData.poDate = poDateValue;
            }
            
            await db.enquiry.update({
              where: { id: enquiry.id },
              data: enquiryUpdateData,
            });
          }
        }
      }

      return updatedQuotation;
    }),

  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(({ input }) => {
      try {
        return db.quotation.findUnique({
          where: { id: input.id },
          include: {
            enquiry: {
              include: {
                customer: {
                  select: { name: true },
                },
              },
            },
            items: true,
          },
        });
      } catch {
        // Error in quotation operation
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch quotation. Please try again.',
        });
      }
    }),

  update: publicProcedure
    .input(CreateQuotationSchema.extend({ id: z.string() }))
    .mutation(async ({ input }) => {
      const { id, enquiryId, items, quotationDate, ...rest } = input;

      // Get the enquiry to retrieve its quotation number
      const enquiry = await db.enquiry.findUnique({
        where: { id: enquiryId },
        select: { quotationNumber: true, subject: true }
      });

      if (!enquiry) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Enquiry not found',
        });
      }

      if (!enquiry.quotationNumber) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Selected enquiry does not have a quotation number assigned',
        });
      }

      const quotationNumber = enquiry.quotationNumber;

      // Check for duplicate quotation number (excluding current quotation)
      const existingQuotation = await db.quotation.findFirst({
        where: { 
          quotationNumber,
          NOT: { id }
        },
      });

      if (existingQuotation) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: `Quotation number "${quotationNumber}" already exists. Please use a different quotation number.`,
        });
      }

      // Calculate totals
      const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.pricePerUnit), 0);
      const totalValue = subtotal;

      try {
        return await db.$transaction(async (prisma) => {
          // 1. Update the main Quotation record
          const updatedQuotation = await prisma.quotation.update({
            where: { id },
            data: {
              enquiryId,
              quotationNumber,
              subtotal,
              tax: 0,
              totalValue,
              quotationDate: quotationDate ? new Date(quotationDate) : new Date(),
              ...rest,
            },
          });

          // 2. Delete existing items
          await prisma.quotationItem.deleteMany({
            where: { quotationId: id },
          });

          // 3. Create new items
          const itemsToCreate = items.map((item) => ({
            ...item,
            materialDescription: item.materialDescription ?? 'Unnamed Item',
            total: item.quantity * item.pricePerUnit,
            quotationId: id,
          }));

          await prisma.quotationItem.createMany({
            data: itemsToCreate,
          });

          return updatedQuotation;
        });
      } catch {
        // Error in quotation operation
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update quotation. Please try again.',
        });
      }
    }),

  delete: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      try {
        return await db.$transaction(async (prisma) => {
          // Delete quotation items first (due to foreign key constraint)
          await prisma.quotationItem.deleteMany({
            where: { quotationId: input.id },
          });

          // Delete the quotation
          return prisma.quotation.delete({
            where: { id: input.id },
          });
        });
      } catch {
        // Error in quotation operation
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to delete quotation. Please try again.',
        });
      }
    }),
});
