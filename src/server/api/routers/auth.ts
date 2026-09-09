import { createTRPCRouter, publicProcedure } from '../trpc';
import { LoginSchema, SignupSchema } from '../../../lib/validators/auth';
import { hashPassword, verifyPassword } from '../../auth/password';
import { TRPCError } from '@trpc/server';
import { db } from '../../db';
import { z } from 'zod';

// Simple in-memory rate limiting (in production, use Redis or similar)
const loginAttempts = new Map<string, { count: number; lastAttempt: number; blockedUntil?: number }>();

const RATE_LIMIT = {
  MAX_ATTEMPTS: 5,
  WINDOW_MS: 15 * 60 * 1000, // 15 minutes
  BLOCK_DURATION_MS: 30 * 60 * 1000, // 30 minutes
};

const checkRateLimit = (email: string): boolean => {
  const now = Date.now();
  const attempts = loginAttempts.get(email);

  if (!attempts) {
    loginAttempts.set(email, { count: 1, lastAttempt: now });
    return true;
  }

  // Reset if window has passed
  if (now - attempts.lastAttempt > RATE_LIMIT.WINDOW_MS) {
    attempts.count = 1;
    attempts.lastAttempt = now;
    attempts.blockedUntil = undefined;
    return true;
  }

  // Check if blocked
  if (attempts.blockedUntil && now < attempts.blockedUntil) {
    return false;
  }

  // Increment attempts
  attempts.count++;
  attempts.lastAttempt = now;

  // Block if too many attempts
  if (attempts.count >= RATE_LIMIT.MAX_ATTEMPTS) {
    attempts.blockedUntil = now + RATE_LIMIT.BLOCK_DURATION_MS;
    return false;
  }

  return true;
};

export const authRouter = createTRPCRouter({
  signup: publicProcedure
    .input(SignupSchema)
    .mutation(() => {
      // Public self-registration is permanently disabled to protect proprietary CRM data.
      // New employee accounts can only be provisioned by an administrator.
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Public registration is disabled. Please contact your administrator to obtain access.',
      });
    }),

  login: publicProcedure
    .input(LoginSchema)
    .mutation(async ({ input }) => {
      try {
        // Check rate limiting
        if (!checkRateLimit(input.email)) {
          const attempts = loginAttempts.get(input.email);
          const remainingTime = Math.ceil((attempts!.blockedUntil! - Date.now()) / 1000 / 60);
          throw new TRPCError({
            code: 'TOO_MANY_REQUESTS',
            message: `Too many failed login attempts. Please try again in ${remainingTime} minutes.`
          });
        }

        // Check if user exists in database
        const employee = await db.employee.findUnique({
          where: { email: input.email },
        });

        if (!employee?.passwordHash) {
          throw new TRPCError({ 
            code: 'UNAUTHORIZED', 
            message: 'Invalid email or password' 
          });
        }

        // Strictly verify password using bcrypt
        const isPasswordValid = await verifyPassword(input.password, employee.passwordHash);
        if (!isPasswordValid) {
          throw new TRPCError({ 
            code: 'UNAUTHORIZED', 
            message: 'Invalid email or password' 
          });
        }

        // Reset rate limiting on successful login
        loginAttempts.delete(input.email);
        return { 
          success: true, 
          message: 'Login successful',
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
          message: 'Login failed' 
        });
      }
    }),

  changePassword: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        currentPassword: z.string().min(1),
        newPassword: z.string().min(4, 'New password must be at least 4 characters'),
      }),
    )
    .mutation(async ({ input }) => {
      const employee = await db.employee.findUnique({
        where: { email: input.email },
      });

      if (!employee) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found',
        });
      }

      if (employee.passwordHash) {
        const isValid = await verifyPassword(input.currentPassword, employee.passwordHash);
        if (!isValid) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'Current password is incorrect',
          });
        }
      }

      const newHash = await hashPassword(input.newPassword);
      await db.employee.update({
        where: { id: employee.id },
        data: { passwordHash: newHash },
      });

      return {
        success: true,
        message: 'Password updated successfully',
      };
    }),

  signOut: publicProcedure.mutation(() => {
    // For now, just return success
    // You can implement proper signout logic later
    return { success: true };
  }),

  getSession: publicProcedure.query(async ({ ctx: _ctx }) => {
    try {
      // Test database connection
      await db.$queryRaw`SELECT 1`;
      return null; // Single user system - no session needed
    } catch {
      // Database connection error
      throw new TRPCError({ 
        code: 'INTERNAL_SERVER_ERROR', 
        message: 'Database connection failed' 
      });
    }
  }),

  // Simple procedure to create employee (without user table dependency)
  createEmployee: publicProcedure
    .input(z.object({
      email: z.string().email(),
      name: z.string(),
      role: z.enum(['MARKETING', 'MANAGER', 'ADMINISTRATOR']).default('MARKETING'),
    }))
    .mutation(async ({ input }) => {
      try {
        // Check if employee already exists
        const existingEmployee = await db.employee.findUnique({
          where: { email: input.email },
        });

        if (existingEmployee) {
          return { success: true, employee: existingEmployee, message: 'Employee already exists' };
        }

        // Create new employee
        const newEmployee = await db.employee.create({
          data: {
            id: `emp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            name: input.name,
            email: input.email,
            role: input.role,
          },
        });

        return { success: true, employee: newEmployee };
      } catch {
        // Error creating employee record
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create employee',
        });
      }
    }),
});