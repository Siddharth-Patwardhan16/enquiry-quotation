
import { createTRPCRouter, publicProcedure } from '../trpc';
import { CreateQuotationSchema } from '@/lib/validators/quotation';
import { UpdateQuotationStatusSchema } from '@/lib/validators/quotationStatus';
import { db } from '@/server/db';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';

export const quotationRouter = createTRPCRouter({
  create: publicProcedure
    .input(CreateQuotationSchema)
    .mutation(async ({ input }) => {
      const { enquiryId, items, quotationDate, validityPeriod, ...rest } = input;

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

      // Calculate totals
      const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.pricePerUnit), 0);
      const gstPercentage = Number(rest.gst) || 0;
      const gstAmount = (subtotal * gstPercentage) / 100;
      const packingForwardingPercentage = Number(rest.packingForwardingPercentage) || 3;
      const packingForwardingAmount = (subtotal * packingForwardingPercentage) / 100;
      const totalValue = subtotal + Number(rest.transportCosts || 0) + gstAmount + packingForwardingAmount;

      // Prisma Transaction: This ensures that both the quotation and all its items are created successfully.
      // If any part fails, the entire transaction is rolled back, preventing partial data.
      try {
        return await db.$transaction(async (prisma) => {
          // 1. Create the main Quotation record
          const newQuotation = await prisma.quotation.create({
            data: {
              enquiryId,
              quotationNumber,
              subtotal,
              tax: gstAmount,
              totalValue,
              quotationDate: quotationDate ? new Date(quotationDate) : new Date(),
              validityPeriod: validityPeriod ? new Date(validityPeriod) : null,
              ...rest,
            },
          });

          // 2. Prepare the data for all QuotationItem records with totals
          const itemsToCreate = items.map((item) => ({
            ...item,
            total: item.quantity * item.pricePerUnit,
            quotationId: newQuotation.id, // Link each item to the new quotation
          }));

          // 3. Create all QuotationItem records in one go
          await prisma.quotationItem.createMany({
            data: itemsToCreate,
          });

          return newQuotation;
        });
      } catch (error) {
        console.error(error);
        
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
      },
    });
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
      const { quotationId, status, lostReason, purchaseOrderNumber } = input;

      // Ensure the quotation exists before trying to update it
      const existingQuotation = await db.quotation.findUnique({
        where: { id: quotationId },
      });

      if (!existingQuotation) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Quotation not found.' });
      }

      // Update the quotation in the database
      return db.quotation.update({
        where: {
          id: quotationId,
        },
        data: {
          status: status,
          lostReason: status === 'LOST' ? lostReason : null, // Only set lostReason if status is LOST
          purchaseOrderNumber: status === 'WON' || status === 'RECEIVED' ? purchaseOrderNumber : null,
          // Add other fields here
        },
      });
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
      } catch (error) {
        console.error(error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch quotation. Please try again.',
        });
      }
    }),

  update: publicProcedure
    .input(CreateQuotationSchema.extend({ id: z.string() }))
    .mutation(async ({ input }) => {
      const { id, enquiryId, items, quotationDate, validityPeriod, ...rest } = input;

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
      const gstPercentage = Number(rest.gst) || 0;
      const gstAmount = (subtotal * gstPercentage) / 100;
      const packingForwardingPercentage = Number(rest.packingForwardingPercentage) || 3;
      const packingForwardingAmount = (subtotal * packingForwardingPercentage) / 100;
      const totalValue = subtotal + Number(rest.transportCosts || 0) + gstAmount + packingForwardingAmount;

      try {
        return await db.$transaction(async (prisma) => {
          // 1. Update the main Quotation record
          const updatedQuotation = await prisma.quotation.update({
            where: { id },
            data: {
              enquiryId,
              quotationNumber,
              subtotal,
              tax: gstAmount,
              totalValue,
              quotationDate: quotationDate ? new Date(quotationDate) : new Date(),
              validityPeriod: validityPeriod ? new Date(validityPeriod) : null,
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
            total: item.quantity * item.pricePerUnit,
            quotationId: id,
          }));

          await prisma.quotationItem.createMany({
            data: itemsToCreate,
          });

          return updatedQuotation;
        });
      } catch (error) {
        console.error(error);
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
      } catch (error) {
        console.error(error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to delete quotation. Please try again.',
        });
      }
    }),
});
