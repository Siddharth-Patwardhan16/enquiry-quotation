import { prisma } from "../db";

// For now, we'll use a simple approach to get the current user
// In a real application, you'd get this from the session/JWT token
const getCurrentUser = async () => {
  try {
    // For demo purposes, we'll get Siddharth as the current user
    // In production, this would come from the authentication session
    let employee = await prisma.employee.findFirst({
      where: {
        name: 'Siddharth'
      }
    });
    
    // If Siddharth doesn't exist, create him
    employee ??= await prisma.employee.create({
        data: {
          id: 'siddharth-user-1',
          name: 'Siddharth',
          email: 'siddharth@example.com',
          role: 'MARKETING'
        }
      });
      // Default user created successfully
    
    return employee;
  } catch {
    // Error handling for user context creation
    // Return a fallback user object if database operations fail
    return {
      id: 'fallback-user-1',
      name: 'Siddharth',
      email: 'siddharth@example.com',
      role: 'MARKETING'
    };
  }
};

const createInnerTRPCContext = async () => {
  const currentUser = await getCurrentUser();
  
  return {
    prisma,
    currentUser,
  };
};

export const createTRPCContext = () => {
  return createInnerTRPCContext();
};

export type TRPCContext = Awaited<ReturnType<typeof createTRPCContext>>;
