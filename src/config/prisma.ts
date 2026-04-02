import { PrismaClient } from "@prisma/client";

// PrismaClient should be created once per process.
export const prisma = new PrismaClient();

