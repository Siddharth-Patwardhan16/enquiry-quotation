/**
 * Harsh reproduction attempt for 42P05 "prepared statement already exists".
 * READ-ONLY - performs no writes.
 */
import { config } from "dotenv";

config({ path: ".env" });
config({ path: ".env.local", override: true });

async function main() {
  const { PrismaClient } = await import("@prisma/client");
  const url = process.env.DATABASE_URL;

  const clientA = new PrismaClient({ datasources: { db: { url } } });
  const clientB = new PrismaClient({ datasources: { db: { url } } });

  let failures = 0;

  await Promise.all(
    Array.from({ length: 30 }, (_, i) =>
      (i % 2 === 0 ? clientA : clientB).quotation.findMany({ take: 1 })
    )
  ).catch((e) => {
    failures++;
    console.error("[FAIL] round 1:", e.message.slice(0, 200));
  });
  console.log("round 1 done (30 concurrent findMany across 2 clients)");

  await Promise.all(
    Array.from({ length: 20 }, (_, i) =>
      (i % 2 === 0 ? clientA : clientB).$transaction(async (p) => {
        await p.quotation.findMany({ take: 1 });
        await p.communication.findMany({ take: 1 });
      })
    )
  ).catch((e) => {
    failures++;
    console.error("[FAIL] round 2:", e.message.slice(0, 200));
  });
  console.log("round 2 done (20 concurrent $transaction across 2 clients)");

  for (let wave = 0; wave < 5; wave++) {
    await Promise.all([
      ...Array.from({ length: 10 }, () => clientA.quotation.findMany({ take: 1 })),
      ...Array.from({ length: 10 }, () => clientB.company.findMany({ take: 1 })),
      clientA.$transaction((p) => p.quotation.count()),
      clientB.$transaction((p) => p.communication.count()),
    ]).catch((e) => {
      failures++;
      console.error("[FAIL] wave " + wave + ":", e.message.slice(0, 200));
    });
    console.log("wave " + (wave + 1) + "/5 done");
  }

  await Promise.all([clientA.$disconnect(), clientB.$disconnect()]);

  if (failures > 0) {
    console.error("REPRODUCED: " + failures + " failure(s) - prepared statement issue exists");
    process.exit(1);
  }
  console.log("NO FAILURES - could not reproduce 42P05 under heavy load");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("[FAIL]", error);
    process.exit(1);
  });
