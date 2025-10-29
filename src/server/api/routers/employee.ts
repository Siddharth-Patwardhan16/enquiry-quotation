import { createTRPCRouter, publicProcedure } from '../trpc';
import { z } from 'zod';

export const employeeRouter = createTRPCRouter({
  // Get all employees
  getAll: publicProcedure
    .query(async ({ ctx }) => {
      return ctx.prisma.employee.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: {
          name: 'asc'
        }
      });
    }),

  // Get employee by ID
  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.employee.findUnique({
        where: { id: input.id },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
          updatedAt: true,
        }
      });
    }),
});
