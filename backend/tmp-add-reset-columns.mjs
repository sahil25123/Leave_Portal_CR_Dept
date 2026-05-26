import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

const databaseUrl = process.env.DATABASE_URL;
const prisma = new PrismaClient({ adapter: new PrismaMariaDb(databaseUrl) });

try {
  await prisma.$executeRawUnsafe(
    "ALTER TABLE `User` ADD COLUMN `resetPasswordToken` VARCHAR(191) NULL, ADD COLUMN `resetPasswordExpiry` DATETIME(3) NULL",
  );
  console.log("Reset password columns added");
} finally {
  await prisma.$disconnect();
}
