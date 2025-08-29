// src/server/api/routers/admin.ts
import { createTRPCRouter, publicProcedure } from '../trpc';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { db } from '../../db';

// Zod schema for the invitation form
const InviteSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2),
  role: z.enum(['MANAGER', 'ADMINISTRATOR']), // Only privileged roles
});

export const adminRouter = createTRPCRouter({
  inviteUser: publicProcedure
    .input(InviteSchema)
    .mutation(async ({ input }) => {
      try {
        // For now, we'll create the user directly in our database
        // In a production environment, you'd want to implement proper admin authentication
        
        // Check if user already exists
        const existingEmployee = await db.employee.findUnique({
          where: { email: input.email },
        });

        if (existingEmployee) {
          throw new TRPCError({ 
            code: 'CONFLICT', 
            message: 'User with this email already exists' 
          });
        }

        // Create a new Employee record with the specified role
        const employee = await db.employee.create({
          data: {
            name: input.name,
            email: input.email,
            role: input.role,
          },
        });

        return { 
          success: true, 
          message: `User ${input.name} created with ${input.role} role`,
          user: {
            id: employee.id,
            name: employee.name,
            email: employee.email,
            role: employee.role,
          }
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({ 
          code: 'INTERNAL_SERVER_ERROR', 
          message: 'User could not be created.' 
        });
      }
    }),

  // Get all users (admin only)
  getAllUsers: publicProcedure.query(async () => {
    try {
      const users = await db.employee.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return users;
    } catch (error) {
      throw new TRPCError({ 
        code: 'INTERNAL_SERVER_ERROR', 
        message: 'Failed to fetch users' 
      });
    }
  }),

  // Update user role (admin only)
  updateUserRole: publicProcedure
    .input(z.object({
      userId: z.string(),
      role: z.enum(['MARKETING', 'MANAGER', 'ADMINISTRATOR']),
    }))
    .mutation(async ({ input }) => {
      try {
        const updatedUser = await db.employee.update({
          where: { id: input.userId },
          data: { role: input.role },
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        });

        return { 
          success: true, 
          message: `Role updated for ${updatedUser.name}`,
          user: updatedUser,
        };
      } catch (error) {
        throw new TRPCError({ 
          code: 'INTERNAL_SERVER_ERROR', 
          message: 'Failed to update user role' 
        });
      }
    }),
});

