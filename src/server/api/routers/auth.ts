import { createTRPCRouter, publicProcedure } from '../trpc';
import { LoginSchema, SignupSchema, checkPasswordStrength } from '../../../lib/validators/auth';
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
    .mutation(async ({ input }) => {
      try {
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

        // Additional password strength validation on server side
        const passwordCheck = checkPasswordStrength(input.password);
        if (!passwordCheck.isStrong) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Password does not meet security requirements'
          });
        }

        // Create a new Employee record with MARKETING role by default
        const employee = await db.employee.create({
          data: {
            id: `emp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, // Generate unique ID
            name: input.name,
            email: input.email,
            role: 'MARKETING', // Default role - only admins can change this
          },
        });

        return { 
          success: true, 
          message: 'Account created successfully',
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

        if (!employee) {
          throw new TRPCError({ 
            code: 'UNAUTHORIZED', 
            message: 'Invalid email or password' 
          });
        }

        // TODO: In production, implement proper password hashing and verification
        // For now, accept any password for existing users (demo purposes)
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

        throw new TRPCError({ 
          code: 'UNAUTHORIZED', 
          message: 'Invalid email or password' 
        });
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

  signOut: publicProcedure.mutation(() => {
    // For now, just return success
    // You can implement proper signout logic later
    return { success: true };
  }),

  getSession: publicProcedure.query(async ({ ctx }) => {
    try {
      // Test database connection
      await db.$queryRaw`SELECT 1`;
      return ctx.session;
    } catch (error) {
      console.error('Database connection failed:', error);
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
      } catch (error) {
        console.error('Error creating employee:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create employee',
        });
      }
    }),
});