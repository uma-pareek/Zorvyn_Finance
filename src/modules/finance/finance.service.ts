import { z } from "zod";

import { prisma } from "../../config/prisma";
import { ApiError } from "../../utils/apiError";

const RecordTypeEnum = z.enum(["INCOME", "EXPENSE"]);

export type CreateRecordInput = {
  amount: number;
  type: z.infer<typeof RecordTypeEnum>;
  category: string;
  date: Date;
  notes?: string | null;
};

export type UpdateRecordInput = {
  amount?: number;
  type?: z.infer<typeof RecordTypeEnum>;
  category?: string;
  date?: Date;
  notes?: string | null;
};

export type ListRecordsFilters = {
  type?: z.infer<typeof RecordTypeEnum>;
  category?: string;
  startDate?: Date;
  endDate?: Date;
};

export type OffsetPagination = { limit: number; offset: number };

export type RecordListResult = {
  items: Array<{
    id: string;
    amount: any; // Prisma Decimal returns Decimal at runtime.
    type: any;
    category: string;
    date: Date;
    notes: string | null;
    createdAt: Date;
  }>;
  pagination: { limit: number; offset: number; hasMore: boolean };
};

export async function createRecord(userId: string, input: CreateRecordInput) {
  const created = await prisma.financialRecord.create({
    data: {
      userId,
      amount: input.amount as any,
      type: input.type as any,
      category: input.category,
      date: input.date,
      notes: input.notes ?? null,
    },
    select: { id: true, amount: true, type: true, category: true, date: true, notes: true, createdAt: true },
  });

  return created;
}

export async function getRecordById(userId: string, recordId: string) {
  const record = await prisma.financialRecord.findFirst({
    where: { id: recordId, userId, deletedAt: null },
  });

  if (!record) {
    throw new ApiError({ statusCode: 404, code: "record_not_found", message: "Record not found" });
  }

  return record;
}

export async function listRecords(userId: string, filters: ListRecordsFilters, pagination: OffsetPagination): Promise<RecordListResult> {
  const { limit, offset } = pagination;

  const where: any = {
    userId,
    deletedAt: null,
  };

  if (filters.type) where.type = filters.type as any;
  if (filters.category) where.category = filters.category;
  if (filters.startDate || filters.endDate) {
    where.date = {
      ...(filters.startDate ? { gte: filters.startDate } : {}),
      ...(filters.endDate ? { lte: filters.endDate } : {}),
    };
  }

  const take = limit + 1;
  const records = await prisma.financialRecord.findMany({
    where,
    orderBy: [{ date: "desc" }, { id: "desc" }],
    skip: offset,
    take,
    select: { id: true, amount: true, type: true, category: true, date: true, notes: true, createdAt: true },
  });

  const hasMore = records.length > limit;
  const items = hasMore ? records.slice(0, limit) : records;

  return {
    items,
    pagination: { limit, offset, hasMore },
  };
}

export async function updateRecord(userId: string, recordId: string, input: UpdateRecordInput) {
  const existing = await prisma.financialRecord.findFirst({
    where: { id: recordId, userId, deletedAt: null },
    select: { id: true },
  });

  if (!existing) {
    throw new ApiError({ statusCode: 404, code: "record_not_found", message: "Record not found" });
  }

  const updated = await prisma.financialRecord.update({
    where: { id: recordId },
    data: {
      ...(input.amount !== undefined ? { amount: input.amount as any } : {}),
      ...(input.type !== undefined ? { type: input.type as any } : {}),
      ...(input.category !== undefined ? { category: input.category } : {}),
      ...(input.date !== undefined ? { date: input.date } : {}),
      ...(input.notes !== undefined ? { notes: input.notes ?? null } : {}),
    },
    select: { id: true, amount: true, type: true, category: true, date: true, notes: true, createdAt: true },
  });

  // ensure record wasn't soft-deleted between find and update
  if ((updated as any).deletedAt) {
    throw new ApiError({ statusCode: 404, code: "record_not_found", message: "Record not found" });
  }

  return updated;
}

export async function deleteRecord(userId: string, recordId: string) {
  const existing = await prisma.financialRecord.findFirst({
    where: { id: recordId, userId, deletedAt: null },
    select: { id: true },
  });

  if (!existing) {
    throw new ApiError({ statusCode: 404, code: "record_not_found", message: "Record not found" });
  }

  const deleted = await prisma.financialRecord.update({
    where: { id: recordId },
    data: { deletedAt: new Date() },
    select: { id: true, deletedAt: true },
  });

  return { id: deleted.id, deletedAt: deleted.deletedAt };
}

