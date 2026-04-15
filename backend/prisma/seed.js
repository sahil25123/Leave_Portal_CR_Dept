import "dotenv/config";
import prismaPkg from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import bcrypt from "bcrypt";

const { PrismaClient } = prismaPkg;

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL is not set. Please configure it before running seed.",
  );
}

const adapter = new PrismaMariaDb(databaseUrl);
const prisma = new PrismaClient({ adapter });

const DEFAULT_PASSWORD = "123";
const DEFAULT_TOTAL_LEAVES = 30;
const SALT_ROUNDS = 10;

const usersToSeed = [
  {
    name: "Admin User",
    email: "admin@iitd.ac.in",
    designation: "Admin",
    role: "admin",
  },
  {
    name: "Dean Corporate Relations",
    email: "deancorp@iitd.ac.in",
    designation: "Dean",
    role: "dean",
  },
  {
    name: "Roopam Mishra",
    email: "rjha.cstaff@iitd.ac.in",
    designation: "Consultant",
    role: "staff",
  },
  {
    name: "Meraj Ahmad",
    email: "merajcro.cstaff@iitd.ac.in",
    designation: "Project Manager",
    role: "staff",
  },
  {
    name: "Neha Kumari",
    email: "kneha25.cstaff@iitd.ac.in",
    designation: "Project Manager",
    role: "staff",
  },
  {
    name: "Ayush Ranjan",
    email: "ayush97.cstaff@iitd.ac.in",
    designation: "Project Manager",
    role: "staff",
  },
  {
    name: "Rupanshi Toteja",
    email: "rupansh7.cstaff@iitd.ac.in",
    designation: "Project Manager",
    role: "staff",
  },
  {
    name: "Paramjit Singh",
    email: "paramco.cstaff@iitd.ac.in",
    designation: "Project Manager",
    role: "staff",
  },
];

async function upsertUserAndLeaveBalance(
  tx,
  userData,
  hashedPassword,
  leaveYear,
) {
  const user = await tx.user.upsert({
    where: { email: userData.email },
    update: {
      name: userData.name,
      password: hashedPassword,
      designation: userData.designation,
      role: userData.role,
    },
    create: {
      name: userData.name,
      email: userData.email,
      password: hashedPassword,
      designation: userData.designation,
      role: userData.role,
    },
  });

  await tx.leaveBalance.upsert({
    where: {
      userId_yearId: {
        userId: user.id,
        yearId: leaveYear.id,
      },
    },
    update: {
      year: leaveYear.startDate.getUTCFullYear(),
      total: leaveYear.yearlyLimit,
      used: 0,
      remaining: leaveYear.yearlyLimit,
    },
    create: {
      userId: user.id,
      yearId: leaveYear.id,
      year: leaveYear.startDate.getUTCFullYear(),
      total: leaveYear.yearlyLimit,
      used: 0,
      remaining: leaveYear.yearlyLimit,
    },
  });

  return user;
}

export async function main() {
  const currentYear = new Date().getUTCFullYear();
  const startDate = new Date(Date.UTC(currentYear, 0, 1));
  const endDate = new Date(Date.UTC(currentYear, 11, 31));
  const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, SALT_ROUNDS);

  const leaveYear = await prisma.leaveYear.upsert({
    where: {
      name: String(currentYear),
    },
    update: {
      startDate,
      endDate,
      isActive: true,
      monthlyLimit: 2.5,
      yearlyLimit: DEFAULT_TOTAL_LEAVES,
    },
    create: {
      name: String(currentYear),
      startDate,
      endDate,
      isActive: true,
      monthlyLimit: 2.5,
      yearlyLimit: DEFAULT_TOTAL_LEAVES,
    },
  });

  await prisma.leaveYear.updateMany({
    where: {
      id: {
        not: leaveYear.id,
      },
    },
    data: {
      isActive: false,
    },
  });

  for (const userData of usersToSeed) {
    const user = await prisma.$transaction((tx) =>
      upsertUserAndLeaveBalance(tx, userData, hashedPassword, leaveYear),
    );

    console.log(`Seeded user: ${user.email}`);
  }
}

async function runSeed() {
  try {
    await main();
    console.log("Seeding completed successfully.");
  } catch (error) {
    console.error("Seeding failed:", error);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

runSeed();
