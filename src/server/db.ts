import { PrismaClient } from "@prisma/client";

// 1. Access the global scope of your Node.js environment.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// 2. Check if a prisma instance already exists on the global object.
//    - If it does (globalForPrisma.prisma), reuse it.
//    - If it doesn't (??), create a new PrismaClient.
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    // This is a good practice: it logs database queries to your terminal
    // only when you are in development mode.
    log: process.env.NODE_ENV === "development" ? ["query"] : [],
    // This is an advanced and correct setup for connection pooling (like on Vercel),
    // ensuring it uses the direct connection URL when available.
    datasources: {
      db: {
        url: process.env.DIRECT_URL ?? process.env.DATABASE_URL,
      },
    },
  });

// 3. In development, save the newly created instance back to the global
//    object so it can be reused on the next hot reload.
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// 4. Export the same instance as `db` for convenience, a common
//    convention in many modern frameworks (like the T3 Stack).
export const db = prisma;
