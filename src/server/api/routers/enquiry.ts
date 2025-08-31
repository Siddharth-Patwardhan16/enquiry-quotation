import { createTRPCRouter, publicProcedure } from '../trpc';
import { CreateEnquirySchema, UpdateEnquirySchema, UpdateEnquiryFullSchema } from '@/lib/validators/enquiry';
import { db } from '@/server/db';
import { z } from 'zod';

export const enquiryRouter = createTRPCRouter({
  // Procedure to create a new enquiry
  create: publicProcedure
    .input(CreateEnquirySchema)
    .mutation(async ({ input }) => {
      // Find the first marketing person in the database
      const marketingPerson = await db.employee.findFirst({
        where: { role: 'MARKETING' },
      });

      if (!marketingPerson) {
        throw new Error('No marketing person found in the database');
      }
      
      return db.enquiry.create({
        data: {
          subject: input.subject,
          customerId: input.customerId,
          description: input.description,
          requirements: input.requirements,
          expectedBudget: input.expectedBudget,
          timeline: input.timeline,
          enquiryDate: new Date(input.enquiryDate),
          marketingPersonId: marketingPerson.id,
          priority: input.priority,
          source: input.source,
          notes: input.notes,
          status: 'NEW',
        },
      });
    }),

  // Procedure to get all enquiries with customer names
  getAll: publicProcedure.query(async () => {
    return db.enquiry.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        customer: {
          select: {
            name: true,
          },
        },
        marketingPerson: {
          select: {
            name: true,
          },
        },
      },
    });
  }),

  // Procedure to get a single enquiry by ID
  getById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const enquiry = await db.enquiry.findUnique({
        where: { id: input.id },
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              officeAddress: true,
              officeCity: true,
              officeState: true,
              officeCountry: true,
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
