/**
 * One-off: set Enquiry.financialYear from createdAt (India FY Apr–Mar) and
 * assign per-FY sequenceNumber ordered by createdAt, id.
 *
 * Run after nullable columns exist: npx tsx scripts/backfill-financial-year.ts
 */
import { config } from "dotenv";
import { PrismaClient } from "@prisma/client";
import { getFinancialYear } from "../src/lib/financial-year";

config({ path: ".env" });
config({ path: ".env.local" });

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DIRECT_URL ?? process.env.DATABASE_URL,
    },
  },
});

async function main() {
  const enquiries = await prisma.enquiry.findMany({
    select: { id: true, createdAt: true },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
  });

  const byFy = new Map<string, { id: number }[]>();
  for (const e of enquiries) {
    const fy = getFinancialYear(e.createdAt);
    const list = byFy.get(fy) ?? [];
    list.push({ id: e.id });
    byFy.set(fy, list);
  }

  let updated = 0;
  for (const [fy, rows] of byFy) {
    for (let i = 0; i < rows.length; i += 1) {
      const seq = i + 1;
      await prisma.enquiry.update({
        where: { id: rows[i].id },
        data: { financialYear: fy, sequenceNumber: seq },
      });
      updated += 1;
    }
  }

  console.log(`Backfill complete: ${updated} enquiries across ${byFy.size} financial years.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
