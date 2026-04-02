import "dotenv/config";
import bcrypt from "bcrypt";
import { Prisma } from "@prisma/client";

import { prisma } from "../config/prisma";

type SeedUser = {
  email: string;
  password: string;
  role: "VIEWER" | "ANALYST" | "ADMIN";
  status: "ACTIVE" | "INACTIVE";
};

async function seed() {
  const saltRounds = 12;

  const users: SeedUser[] = [
    { email: "admin@zorvyn.finance", password: "Admin123!", role: "ADMIN", status: "ACTIVE" },
    { email: "analyst@zorvyn.finance", password: "Analyst123!", role: "ANALYST", status: "ACTIVE" },
    { email: "viewer@zorvyn.finance", password: "Viewer123!", role: "VIEWER", status: "ACTIVE" },
  ];

  const upsertedUsers = [];
  for (const u of users) {
    const passwordHash = await bcrypt.hash(u.password, saltRounds);

    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {
        role: u.role as any,
        status: u.status as any,
        passwordHash,
      },
      create: {
        email: u.email,
        passwordHash,
        role: u.role as any,
        status: u.status as any,
      },
      select: { id: true, email: true, role: true },
    });

    upsertedUsers.push(user);
  }

  const now = new Date();
  const daysAgo = (d: number) => new Date(now.getTime() - d * 24 * 60 * 60 * 1000);

  // Generate a few months worth of predictable data for monthly trends.
  const seedRecords = [
    // Admin user
    { email: "admin@zorvyn.finance", amount: "5000.00", type: "INCOME", category: "Salary", date: daysAgo(75), notes: "Monthly pay" },
    { email: "admin@zorvyn.finance", amount: "1800.00", type: "EXPENSE", category: "Rent", date: daysAgo(72), notes: "Rent payment" },
    { email: "admin@zorvyn.finance", amount: "220.50", type: "EXPENSE", category: "Groceries", date: daysAgo(40), notes: "Weekly groceries" },
    { email: "admin@zorvyn.finance", amount: "1200.00", type: "INCOME", category: "Freelance", date: daysAgo(20), notes: "Client project" },
    // Analyst user
    { email: "analyst@zorvyn.finance", amount: "3200.00", type: "INCOME", category: "Salary", date: daysAgo(60), notes: "Monthly pay" },
    { email: "analyst@zorvyn.finance", amount: "900.00", type: "EXPENSE", category: "Subscriptions", date: daysAgo(58), notes: "Streaming + SaaS" },
    { email: "analyst@zorvyn.finance", amount: "160.00", type: "EXPENSE", category: "Transport", date: daysAgo(25), notes: "Commute" },
    // Viewer user
    { email: "viewer@zorvyn.finance", amount: "2500.00", type: "INCOME", category: "Salary", date: daysAgo(50), notes: "Monthly pay" },
    { email: "viewer@zorvyn.finance", amount: "600.00", type: "EXPENSE", category: "Food", date: daysAgo(48), notes: "Dining out" },
  ] as const;

  // Clear existing records to keep seed repeatable.
  // If you prefer non-destructive seeds, remove these deletes.
  await prisma.financialRecord.deleteMany({});

  const userByEmail = new Map(upsertedUsers.map((u) => [u.email, u.id]));

  await prisma.financialRecord.createMany({
    data: seedRecords.map((r) => ({
      userId: userByEmail.get(r.email)!,
      amount: new Prisma.Decimal(r.amount),
      type: r.type as any,
      category: r.category,
      date: r.date,
      notes: r.notes,
    })),
  });

  // eslint-disable-next-line no-console
  console.log("[seed] complete");
}

seed()
  .catch((e) => {
    // eslint-disable-next-line no-console
    console.error("[seed] failed", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

