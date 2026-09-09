import { PrismaClient } from "@prisma/client";

// 1. Access the global scope of your Node.js environment.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function getNormalizedDatabaseUrl(): string | undefined {
  const url = process.env.DATABASE_URL;
  if (!url) return undefined;

  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes("pooler.supabase.com")) {
      // Supabase pooler requires port 6543 for transaction pooling
      if (parsed.port === "5432") {
        parsed.port = "6543";
      }
      // PgBouncer requires disabling prepared statements
      parsed.searchParams.set("pgbouncer", "true");
      if (!parsed.searchParams.has("connection_limit")) {
        parsed.searchParams.set("connection_limit", "1");
      }
      return parsed.toString();
    }
  } catch {
    if (!url.includes("pgbouncer=true")) {
      return `${url}${url.includes("?") ? "&" : "?"}pgbouncer=true`;
    }
  }

  return url;
}

// 2. Check if a prisma instance already exists on the global object.
//    - If it does (globalForPrisma.prisma), reuse it.
//    - If it doesn't (??), create a new PrismaClient.
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    // This is a good practice: it logs database queries to your terminal
    // only when you are in development mode.
    log: process.env.NODE_ENV === "development" ? ["query"] : [],
    // Use pooled DATABASE_URL at runtime. DIRECT_URL is for Prisma migrations only (schema.prisma).
    datasources: {
      db: {
        url: getNormalizedDatabaseUrl(),
      },
    },
  });

// 3. Cache the prisma instance on the global object so that serverless
//    warm lambdas reuse the connection pool rather than exhausting database connections.
globalForPrisma.prisma = prisma;

// 4. Export the same instance as `db` for convenience, a common
//    convention in many modern frameworks (like the T3 Stack).
export const db = prisma;
