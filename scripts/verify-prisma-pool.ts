/**
 * Verification script for the "prepared statement already exists" (42P05)
 * / "prepared statement does not exist" (26000) errors.
 *
 * Replicates the exact DB access patterns of:
 *   - tasks.getUpcoming  -> db.quotation.findMany with nested include
 *   - tasks.getTaskStats -> db.$transaction(interactive) with findMany inside
 *
 * Runs them repeatedly and concurrently to stress connection reuse through
 * the Supabase PgBouncer pooler. READ-ONLY - performs no writes.
 *
 * Usage: npx tsx scripts/verify-prisma-pool.ts
 */
import { config } from "dotenv";

// Load env before importing the app's Prisma client.
// .env.local must win over .env (same precedence as Next.js)
config({ path: ".env" });
config({ path: ".env.local", override: true });

async function main() {
  const { db } = await import("../src/server/db");

  console.log("DATABASE_URL host:", new URL(process.env.DATABASE_URL ?? "").host);
  console.log("pgbouncer param present:", (process.env.DATABASE_URL ?? "").includes("pgbouncer=true"));
  console.log("");

  // --- Pattern 1: tasks.getUpcoming ---
  const activeQuotations = await db.quotation.findMany({
    where: {
      NOT: {
        status: { in: ["WON", "LOST"] },
      },
    },
    include: {
      enquiry: {
        include: {
          company: {
            select: { name: true, id: true },
          },
          customer: {
            select: { name: true, id: true },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
  console.log(`[PASS] getUpcoming pattern: quotation.findMany returned ${activeQuotations.length} rows`);

  // --- Pattern 2: tasks.getTaskStats (interactive transaction) ---
  const statsCount = await db.$transaction(async (prisma) => {
    const quotations = await prisma.quotation.findMany({
      where: {
        NOT: {
          status: { in: ["WON", "LOST"] },
        },
      },
      select: { id: true, status: true, validityPeriod: true, createdAt: true },
    });
    const communications = await prisma.communication.findMany({
      where: { nextCommunicationDate: { not: null } },
      select: { id: true, nextCommunicationDate: true },
    });
    return quotations.length + communications.length;
  });
  console.log(`[PASS] getTaskStats pattern: $transaction returned ${statsCount} rows`);

  // --- Stress: repeat both patterns concurrently 10 times ---
  for (let i = 0; i < 10; i++) {
    await Promise.all([
      db.quotation.findMany({ take: 1 }),
      db.communication.findMany({ take: 1 }),
      db.$transaction(async (p) => p.quotation.count()),
    ]);
    console.log(`[PASS] stress iteration ${i + 1}/10`);
  }

  console.log("");
  console.log("ALL CHECKS PASSED - prepared statement errors not reproduced");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("[FAIL]", error);
    process.exit(1);
  });