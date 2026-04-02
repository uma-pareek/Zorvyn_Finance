import { z } from "zod";
import type { Request, Response } from "express";

import { asyncHandler } from "../../utils/asyncHandler";
import { parseOrApiError } from "../../utils/zod";
import {
  createRecord as createRecordService,
  deleteRecord as deleteRecordService,
  getRecordById as getRecordByIdService,
  listRecords as listRecordsService,
  updateRecord as updateRecordService,
} from "./finance.service";

const RecordTypeEnum = z.enum(["INCOME", "EXPENSE"]);

const CreateRecordBodySchema = z.object({
  amount: z.coerce.number().positive(),
  type: RecordTypeEnum,
  category: z.string().min(1).max(100),
  date: z.coerce.date(),
  notes: z.string().max(500).optional().nullable(),
});

const UpdateRecordBodySchema = z
  .object({
    amount: z.coerce.number().positive().optional(),
    type: RecordTypeEnum.optional(),
    category: z.string().min(1).max(100).optional(),
    date: z.coerce.date().optional(),
    notes: z.string().max(500).optional().nullable(),
  })
  .refine((data) => Object.keys(data).length > 0, { message: "At least one field is required" });

const ListRecordsQuerySchema = z
  .object({
    type: RecordTypeEnum.optional(),
    category: z.string().min(1).max(100).optional(),
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional(),
    limit: z.coerce.number().int().positive().max(100).optional().default(20),
    offset: z.coerce.number().int().nonnegative().optional().default(0),
  })
  .refine((q) => !q.startDate || !q.endDate || q.startDate <= q.endDate, {
    message: "startDate must be <= endDate",
    path: ["endDate"],
  });

function toNumberAmount(amount: unknown) {
  if (typeof amount === "number") return amount;
  if (typeof amount === "string") return Number(amount);
  // Prisma Decimal supports toNumber() in runtime.
  if (amount && typeof (amount as any).toNumber === "function") return (amount as any).toNumber();
  return Number(amount);
}

export const financeController = {
  create: asyncHandler(async (req: Request, res: Response) => {
    const body = parseOrApiError(CreateRecordBodySchema, req.body);
    const userId = req.user!.id;
    const created = await createRecordService(userId, body);

    return res.status(201).json({
      id: created.id,
      amount: toNumberAmount(created.amount),
      type: created.type,
      category: created.category,
      date: created.date,
      notes: created.notes,
      createdAt: created.createdAt,
    });
  }),

  list: asyncHandler(async (req: Request, res: Response) => {
    const q = parseOrApiError(ListRecordsQuerySchema, req.query);
    const userId = req.user!.id;

    const result = await listRecordsService(
      userId,
      { type: q.type, category: q.category, startDate: q.startDate, endDate: q.endDate },
      { limit: q.limit, offset: q.offset }
    );

    return res.status(200).json({
      items: result.items.map((r) => ({
        id: r.id,
        amount: toNumberAmount(r.amount),
        type: r.type,
        category: r.category,
        date: r.date,
        notes: r.notes,
        createdAt: r.createdAt,
      })),
      pagination: result.pagination,
    });
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const recordId = req.params.id;
    const userId = req.user!.id;
    const record = await getRecordByIdService(userId, recordId);

    return res.status(200).json({
      id: record.id,
      amount: toNumberAmount(record.amount),
      type: record.type,
      category: record.category,
      date: record.date,
      notes: record.notes,
      createdAt: record.createdAt,
    });
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const recordId = req.params.id;
    const body = parseOrApiError(UpdateRecordBodySchema, req.body);
    const userId = req.user!.id;

    const updated = await updateRecordService(userId, recordId, body);
    return res.status(200).json({
      id: updated.id,
      amount: toNumberAmount(updated.amount),
      type: updated.type,
      category: updated.category,
      date: updated.date,
      notes: updated.notes,
      createdAt: updated.createdAt,
    });
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    const recordId = req.params.id;
    const userId = req.user!.id;
    await deleteRecordService(userId, recordId);
    return res.status(204).send();
  }),
};

