import { config } from "dotenv";
import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";

config({ path: ".env" });
config({ path: ".env.local" });

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DIRECT_URL ?? process.env.DATABASE_URL,
    },
  },
});

const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, -5);
const backupDir = path.join(process.cwd(), "backups", `backup-${timestamp}`);

if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

console.log(`📦 Starting database backup...`);
console.log(`📁 Backup directory: ${backupDir}\n`);

async function backupTable<T>(
  tableName: string,
  fetchFunction: () => Promise<T[]>
): Promise<void> {
  try {
    console.log(`  ⏳ Backing up ${tableName}...`);
    const data = await fetchFunction();
    const filePath = path.join(backupDir, `${tableName}.json`);

    const serializedData = JSON.stringify(
      data,
      (_key, value) => {
        if (typeof value === "bigint") {
          return value.toString();
        }
        if (value instanceof Date) {
          return value.toISOString();
        }
        return value;
      },
      2
    );

    fs.writeFileSync(filePath, serializedData, "utf-8");
    console.log(`  ✅ ${tableName}: ${data.length} records backed up`);
  } catch (error) {
    console.error(`  ❌ Error backing up ${tableName}:`, error);
    throw error;
  }
}

async function main() {
  try {
    if (!process.env.DATABASE_URL && !process.env.DIRECT_URL) {
      console.error(
        "❌ DATABASE_URL or DIRECT_URL must be set (.env / .env.local)."
      );
      process.exit(1);
    }

    console.log("🔄 Fetching all data from database...\n");

    await backupTable("Employee", () => prisma.employee.findMany());
    await backupTable("Customer", () => prisma.customer.findMany());
    await backupTable("Company", () => prisma.company.findMany());
    await backupTable("Office", () => prisma.office.findMany());
    await backupTable("Plant", () => prisma.plant.findMany());
    await backupTable("ContactPerson", () => prisma.contactPerson.findMany());
    await backupTable("Location", () => prisma.location.findMany());
    await backupTable("Contact", () => prisma.contact.findMany());
    await backupTable("Enquiry", () => prisma.enquiry.findMany());
    await backupTable("Quotation", () => prisma.quotation.findMany());
    await backupTable("QuotationItem", () => prisma.quotationItem.findMany());
    await backupTable("Communication", () => prisma.communication.findMany());
    await backupTable("Document", () => prisma.document.findMany());

    const summary = {
      backupDate: new Date().toISOString(),
      timestamp,
      tables: [
        "Employee",
        "Customer",
        "Company",
        "Office",
        "Plant",
        "ContactPerson",
        "Location",
        "Contact",
        "Enquiry",
        "Quotation",
        "QuotationItem",
        "Communication",
        "Document",
      ],
      note: "Full Prisma schema export. Copy this folder to safe storage.",
    };

    fs.writeFileSync(
      path.join(backupDir, "backup-summary.json"),
      JSON.stringify(summary, null, 2),
      "utf-8"
    );

    console.log("\n✅ Database backup completed successfully!");
    console.log(`📁 Backup location: ${backupDir}`);
    console.log(
      "\n⚠️  Keep this backup secure; copy it off this machine for redundancy."
    );
  } catch (error) {
    console.error("\n❌ Backup failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
